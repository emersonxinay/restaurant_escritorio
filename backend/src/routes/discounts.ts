import { Router, Response } from 'express';
import { Discount } from '../models';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

// POST /api/discounts
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, percentage, start_date, end_date, start_time, end_time, auto_apply } = req.body;

    // Validaciones
    if (!title || !percentage || !start_date || !end_date) {
      res.status(400).json({ message: 'Title, percentage, start_date, and end_date are required' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    if (startDate < today) {
      res.status(400).json({ message: 'Start date cannot be in the past' });
      return;
    }

    if (startDate > endDate) {
      res.status(400).json({ message: 'Start date cannot be after end date' });
      return;
    }

    if (percentage < 5 || percentage > 50) {
      res.status(400).json({ message: 'Percentage must be between 5 and 50' });
      return;
    }

    // Verificar conflictos
    const conflictingDiscount = await Discount.findOne({
      where: {
        [Op.and]: [
          { start_date: { [Op.lte]: endDate } },
          { end_date: { [Op.gte]: startDate } },
          { is_active: true }
        ]
      }
    });

    if (conflictingDiscount) {
      res.status(409).json({ message: `Conflicting discount: "${conflictingDiscount.title}"` });
      return;
    }

    const discount = await Discount.create({
      title,
      percentage,
      start_date: startDate,
      end_date: endDate,
      start_time: start_time || null,
      end_time: end_time || null,
      auto_apply: auto_apply === true || auto_apply === 'true',
      is_active: true,
      status: 'programmed',
      created_by_admin_id: req.user?.id
    });

    res.status(201).json({
      message: 'Discount created successfully',
      discount: discount.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/discounts/:id
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const discount = await Discount.findByPk(req.params.id);

    if (!discount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    res.json({ discount: discount.toJSON() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/discounts/:id
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, percentage, start_date, end_date, start_time, end_time, auto_apply } = req.body;
    const discount = await Discount.findByPk(req.params.id);

    if (!discount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    if (!discount.canBeEdited()) {
      res.status(400).json({ message: 'This discount cannot be edited because it is already active or expired' });
      return;
    }

    discount.title = title;
    discount.percentage = percentage;
    discount.start_date = new Date(start_date);
    discount.end_date = new Date(end_date);
    discount.start_time = start_time || null;
    discount.end_time = end_time || null;
    discount.auto_apply = auto_apply === true || auto_apply === 'true';

    await discount.save();

    res.json({
      message: 'Discount updated successfully',
      discount: discount.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/discounts/:id/stop
router.post('/:id/stop', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const discount = await Discount.findByPk(req.params.id);

    if (!discount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    discount.is_active = false;
    discount.status = 'cancelled';
    await discount.save();

    res.json({
      message: 'Discount stopped successfully',
      discount: discount.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/discounts/:id/reactivate
router.post('/:id/reactivate', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const discount = await Discount.findByPk(req.params.id);

    if (!discount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    if (!discount.canBeReactivated()) {
      res.status(400).json({ message: 'This discount cannot be reactivated' });
      return;
    }

    discount.is_active = true;
    discount.status = 'active';
    await discount.save();

    res.json({
      message: 'Discount reactivated successfully',
      discount: discount.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/discounts/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const discount = await Discount.findByPk(req.params.id);

    if (!discount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    if (discount.isCurrentlyActive()) {
      res.status(400).json({ message: 'Cannot delete an active discount' });
      return;
    }

    await discount.destroy();

    res.json({ message: 'Discount deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/discounts/history
router.get('/history', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await Discount.findAll({
      where: { created_at: { [Op.gte]: cutoffDate } },
      order: [['created_at', 'DESC']]
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const upcoming = await Discount.findAll({
      where: {
        start_date: { [Op.gte]: today, [Op.lte]: futureDate }
      },
      order: [['start_date', 'ASC']]
    });

    res.json({
      history: history.map(d => d.toJSON()),
      upcoming: upcoming.map(d => d.toJSON())
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/discounts/current
router.get('/current', async (req: any, res: Response) => {
  try {
    const discount = await Discount.findOne({
      where: { is_active: true }
    });

    if (!discount) {
      res.json({ discount: null });
      return;
    }

    discount.updateStatus();
    res.json({ discount: discount.toJSON() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
