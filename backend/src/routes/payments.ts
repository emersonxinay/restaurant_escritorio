import { Router, Response } from 'express';
import { Payment, Order, Table, AuditLog } from '../models';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import sequelize from '../config/database';
import { socketService } from '../services/socket';

const router = Router();

// GET /api/payments/order/:orderId
router.get('/order/:orderId', authenticateToken, requireRole(['admin', 'cashier', 'waiter']), async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.findAll({
      where: { order_id: req.params.orderId }
    });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/payments
router.post('/', authenticateToken, requireRole(['admin', 'cashier', 'waiter']), async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { order_id, amount, method } = req.body;
    
    if (!order_id || !amount || !method) {
      await t.rollback();
      res.status(400).json({ message: 'Order ID, amount, and method are required' });
      return;
    }

    const order = await Order.findByPk(order_id, { transaction: t });
    if (!order) {
      await t.rollback();
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const payment = await Payment.create({
      order_id,
      amount,
      method,
      status: 'completed'
    }, { transaction: t });

    // Check if order is fully paid
    const allPayments = await Payment.findAll({ where: { order_id }, transaction: t });
    const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    if (totalPaid >= parseFloat(order.total.toString())) {
      order.payment_status = 'paid';
      
      // Save tip if any
      const tipAmount = totalPaid - parseFloat(order.total.toString());
      if (tipAmount > 0) {
        order.tip_amount = tipAmount;
      }

      // Free the table ONLY if the order is already delivered (e.g. they ate, then paid)
      if (order.delivery_type === 'dine_in' && order.table_id && order.status === 'delivered') {
        const table = await Table.findByPk(order.table_id, { transaction: t });
        if (table) {
          table.status = 'available';
          await table.save({ transaction: t });
        }
      }
    } else {
      order.payment_status = 'partial';
    }

    await order.save({ transaction: t });

    await AuditLog.create({
      user_id: req.user?.id || null,
      action: 'PAYMENT_PROCESSED',
      target_type: 'Order',
      target_id: order.id,
      details: { amount, method, payment_status: order.payment_status, tip_amount: order.tip_amount }
    }, { transaction: t });

    await t.commit();
    
    // Emit the update after transaction commits successfully
    socketService.getIO().emit('order_updated', order);

    res.status(201).json({ message: 'Payment registered successfully', payment });
  } catch (error: any) {
    await t.rollback();
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

export default router;
