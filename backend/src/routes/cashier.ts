import { Router, Response } from 'express';
import { Order, Payment, User, OrderItem, Product, DailyClose, CashMovement } from '../models';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import { socketService } from '../services/socket';

const router = Router();

// Helper to get local date boundaries
const getDayBoundaries = (dateStr?: string | any) => {
  const targetDate = dateStr ? new Date(dateStr as string) : new Date();
  if (isNaN(targetDate.getTime())) {
    targetDate.setTime(new Date().getTime());
  }
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

// GET /api/cashier/reports/today (or ?date=YYYY-MM-DD)
router.get('/reports/today', authenticateToken, requireRole(['cashier', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { startOfDay, endOfDay } = getDayBoundaries(req.query.date);

    const payments = await Payment.findAll({
      where: {
        created_at: { [Op.gte]: startOfDay, [Op.lte]: endOfDay },
        status: 'completed'
      }
    });

    const orderIds = [...new Set(payments.map(p => p.order_id))];

    const orders = await Order.findAll({
      where: { id: { [Op.in]: orderIds }, payment_status: 'paid' },
      include: [
        { model: User, as: 'waiter', attributes: ['id', 'name'] },
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { 
          model: OrderItem, 
          as: 'order_items', 
          include: [{ model: Product, as: 'product', attributes: ['name', 'price'] }] 
        }
      ]
    });

    const total_collected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const total_tips = orders.reduce((sum, order) => sum + Number(order.tip_amount || 0), 0);
    const total_sales = total_collected - total_tips;

    const by_method = {
      cash: payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0),
      card_transbank: payments.filter(p => p.method === 'card_transbank').reduce((sum, p) => sum + Number(p.amount), 0),
      transfer: payments.filter(p => p.method === 'transfer').reduce((sum, p) => sum + Number(p.amount), 0),
      mixed: payments.filter(p => p.method === 'mixed').reduce((sum, p) => sum + Number(p.amount), 0),
    };

    const dailyClose = await DailyClose.findOne({ where: { date: startOfDay } });
    const movements = await CashMovement.findAll({ 
      where: { date: startOfDay },
      order: [['created_at', 'ASC']],
      include: [{ model: User, as: 'creator', attributes: ['name'] }]
    });

    // Find the previous closed session to get the leftover cash
    const previousClose = await DailyClose.findOne({
      where: { 
        status: 'closed',
        date: { [Op.lt]: startOfDay }
      },
      order: [['date', 'DESC']]
    });

    res.json({
      date: startOfDay,
      is_closed: dailyClose?.status === 'closed',
      is_open: dailyClose?.status === 'open',
      daily_close: dailyClose,
      previous_close: previousClose,
      movements,
      total_sales,
      total_tips,
      total_collected,
      by_method
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/cashier/orders/:id/reprint
router.post('/orders/:id/reprint', authenticateToken, requireRole(['cashier', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await OrderItem.update({ status: 'pending' }, { where: { order_id: id } });
    order.status = 'preparing';
    await order.save();
    socketService.getIO().emit('order_updated', order);
    res.json({ message: 'Ticket re-enviado a cocina.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/cashier/open
router.post('/open', authenticateToken, requireRole(['cashier', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { date, opening_balance } = req.body;
    const { startOfDay: targetDate } = getDayBoundaries(date);

    const existing = await DailyClose.findOne({ where: { date: targetDate } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un registro para esta fecha.' });
    }

    const session = await DailyClose.create({
      date: targetDate,
      opening_balance: Number(opening_balance) || 0,
      total_sales: 0,
      total_card: 0,
      total_other: 0,
      withdrawals: 0,
      extra_incomes: 0,
      status: 'open',
      closed_by: req.user!.id, // The person who opened it in this case
    });

    res.json({ message: 'Caja abierta exitosamente', data: session });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/cashier/movements
router.post('/movements', authenticateToken, requireRole(['cashier', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { date, type, amount, observation } = req.body;
    const { startOfDay: targetDate } = getDayBoundaries(date);

    const dailyClose = await DailyClose.findOne({ where: { date: targetDate } });
    if (!dailyClose || dailyClose.status === 'closed') {
      return res.status(400).json({ message: 'La caja no está abierta para esta fecha.' });
    }

    const movement = await CashMovement.create({
      date: targetDate,
      type,
      amount: Number(amount),
      observation,
      created_by: req.user!.id
    });

    // Also fetch the creator user info to return it nicely
    const movementWithUser = await CashMovement.findByPk(movement.id, {
      include: [{ model: User, as: 'creator', attributes: ['name'] }]
    });

    res.json({ message: 'Movimiento registrado', data: movementWithUser });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/cashier/close
router.post('/close', authenticateToken, requireRole(['cashier', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { date, counted_cash, amount_to_deposit } = req.body;
    const { startOfDay, endOfDay } = getDayBoundaries(date);

    const dailyClose = await DailyClose.findOne({ where: { date: startOfDay } });
    if (!dailyClose) return res.status(400).json({ message: 'La caja no ha sido abierta hoy.' });
    if (dailyClose.status === 'closed') return res.status(400).json({ message: 'La caja ya fue cerrada.' });

    // Aggregate Payments
    const payments = await Payment.findAll({
      where: { created_at: { [Op.between]: [startOfDay, endOfDay] }, status: 'completed' }
    });

    const total_cash = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0);
    const total_card = payments.filter(p => p.method === 'card_transbank').reduce((sum, p) => sum + Number(p.amount), 0);
    const total_other = payments.filter(p => !['cash', 'card_transbank'].includes(p.method)).reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Aggregate Movements
    const movements = await CashMovement.findAll({ where: { date: startOfDay } });
    const extra_incomes = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + Number(m.amount), 0);
    const withdrawals = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + Number(m.amount), 0);

    const opening = Number(dailyClose.opening_balance);
    const expected_cash = opening + total_cash + extra_incomes - withdrawals;
    const counted = Number(counted_cash) || 0;
    const deposit = Number(amount_to_deposit) || 0;
    const difference = counted - expected_cash;

    dailyClose.total_sales = total_cash + total_card + total_other;
    dailyClose.total_card = total_card;
    dailyClose.total_other = total_other;
    dailyClose.withdrawals = withdrawals;
    dailyClose.extra_incomes = extra_incomes;
    dailyClose.expected_cash = expected_cash;
    dailyClose.counted_cash = counted;
    dailyClose.difference = difference;
    dailyClose.amount_to_deposit = deposit;
    dailyClose.status = 'closed';
    dailyClose.closed_by = req.user!.id;

    await dailyClose.save();

    res.json({ message: 'Cierre de caja exitoso', data: dailyClose });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/cashier/closes
router.get('/closes', authenticateToken, requireRole(['cashier', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.query; 
    let whereClause: any = {};

    if (month && typeof month === 'string') {
      const [y, m] = month.split('-');
      const startOfMonth = new Date(`${y}-${m}-01T00:00:00`);
      const endOfMonth = new Date(Number(y), Number(m), 0, 23, 59, 59, 999);
      whereClause.date = { [Op.between]: [startOfMonth, endOfMonth] };
    }

    const closes = await DailyClose.findAll({
      where: whereClause,
      include: [{ model: User, as: 'cashier', attributes: ['name'] }],
      order: [['date', 'DESC']]
    });

    res.json(closes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
