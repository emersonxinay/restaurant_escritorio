import { Router, Response } from 'express';
import { Reservation } from '../models';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { socketService } from '../services/socket';

const router = Router();

// POST /api/reservations
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, date, time, people, details } = req.body;

    if (!name || !email || !date || !time || !people) {
      res.status(400).json({ message: 'All required fields must be provided' });
      return;
    }

    // Crear reservación
    const reservation = await Reservation.create({
      name,
      email,
      phone,
      date: new Date(date),
      time,
      people,
      details: details || ''
    });

    // Validaciones
    if (!reservation.isValidDate()) {
      res.status(400).json({ message: 'Date must be between today and 60 days from now' });
      return;
    }

    if (!reservation.isValidTime()) {
      res.status(400).json({ message: 'Las reservas deben estar entre las 1:30 PM y 9:45 PM en intervalos de 15 minutos' });
      return;
    }

    // Validate people per table (2-10)
    if (people < 2 || people > 10) {
      res.status(400).json({ message: 'La mesa debe tener entre 2 y 10 personas' });
      return;
    }

    // Verificar capacidad máxima por hora (máximo 15 mesas por hora)
    const reservationsForTimeSlot = await Reservation.findAll({
      where: {
        date: new Date(date),
        time
      }
    });

    const MAX_TABLES_PER_SLOT = 15;

    if (reservationsForTimeSlot.length >= MAX_TABLES_PER_SLOT) {
      res.status(409).json({
        message: 'No hay mesas disponibles para esta hora. Por favor, elige otra hora o fecha.'
      });
      return;
    }

    // Generar QR
    await reservation.generateQRCode();
    await reservation.save();

    socketService.getIO().emit('new_reservation', reservation.toJSON());

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: reservation.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reservations/my - Get only authenticated user's reservations
// MUST come before /:id route
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      res.status(401).json({ message: 'User not identified' });
      return;
    }

    // Try to match by user_id first, then fall back to email
    const reservations = await Reservation.findAll({
      where: userEmail ? { email: userEmail } : {},
      order: [['date', 'DESC']]
    });

    res.json({
      reservations: reservations.map(r => r.toJSON())
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reservations/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      res.status(404).json({ message: 'Reservation not found' });
      return;
    }

    res.json({ reservation: reservation.toJSON() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reservations - Get all reservations (admin)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const reservations = await Reservation.findAll({
      order: [['date', 'DESC']]
    });

    res.json({
      reservations: reservations.map(r => r.toJSON())
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/reservations/:id/confirm
router.patch('/:id/confirm', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      res.status(404).json({ message: 'Reservation not found' });
      return;
    }

    reservation.status = 'confirmed';
    await reservation.save();

    socketService.getIO().emit('reservation_updated', reservation.toJSON());

    res.json({
      message: 'Reservation confirmed successfully',
      reservation: reservation.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/reservations/:id/reject
router.patch('/:id/reject', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      res.status(404).json({ message: 'Reservation not found' });
      return;
    }

    reservation.status = 'rejected';
    await reservation.save();

    socketService.getIO().emit('reservation_updated', reservation.toJSON());

    res.json({
      message: 'Reservation rejected successfully',
      reservation: reservation.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/reservations/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      res.status(404).json({ message: 'Reservation not found' });
      return;
    }

    // Only allow deletion of pending reservations, unless user is admin
    if (reservation.status !== 'pending' && req.user?.role !== 'admin') {
      res.status(409).json({
        message: 'Solo se pueden cancelar reservas pendientes. Para cancelar una reserva confirmada, por favor contacta con nosotros 1 hora antes del horario reservado.'
      });
      return;
    }

    await reservation.destroy();

    socketService.getIO().emit('reservation_deleted', req.params.id);

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
