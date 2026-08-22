import { Router, Response } from 'express';
import { Station } from '../models';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/stations
router.get('/', async (req, res) => {
  try {
    const stations = await Station.findAll();
    res.json(stations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/stations
router.post('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, printer_ip } = req.body;
    const station = await Station.create({ name, description, printer_ip });
    res.status(201).json(station);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/stations/:id
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, printer_ip } = req.body;
    const station = await Station.findByPk(req.params.id);
    if (!station) {
      res.status(404).json({ message: 'Station not found' });
      return;
    }
    station.name = name;
    if (description !== undefined) station.description = description;
    if (printer_ip !== undefined) station.printer_ip = printer_ip;
    await station.save();
    res.json(station);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/stations/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) {
      res.status(404).json({ message: 'Station not found' });
      return;
    }
    await station.destroy();
    res.json({ message: 'Station deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
