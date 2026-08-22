import { Router, Response } from 'express';
import { Order, User, Table } from '../models';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

// GET /api/waiter/stats
// Get statistics for the currently logged in waiter (today's stats)
router.get('/stats', authenticateToken, requireRole(['waiter', 'admin', 'cashier']), async (req: AuthRequest, res: Response) => {
  try {
    const waiter_id = req.user?.id;
    
    // Get start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const orders = await Order.findAll({
      where: {
        [Op.or]: [
          { waiter_id },
          { cashier_id: waiter_id }
        ],
        created_at: {
          [Op.gte]: startOfToday
        }
      },
      include: [
        { model: Table, as: 'table', attributes: ['number'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate total tips for today
    const total_tips = orders.reduce((sum, order) => sum + Number(order.tip_amount || 0), 0);
    
    // Calculate total tables served today
    const completed_orders = orders.filter(o => ['ready', 'delivered'].includes(o.status));

    res.json({
      total_tips,
      orders_count: orders.length,
      completed_orders_count: completed_orders.length,
      recent_orders: orders.slice(0, 10) // Send top 10 most recent orders for history
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
