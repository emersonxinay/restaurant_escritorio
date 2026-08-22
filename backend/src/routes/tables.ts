import { Router, Response } from 'express';
import { Table, Order, OrderItem, Product } from '../models';
import { Op } from 'sequelize';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.findAll({ order: [['number', 'ASC']] });
    
    // Fetch active order for each table to know what is missing
    const tablesWithOrder = await Promise.all(tables.map(async (table) => {
      const activeOrder = await Order.findOne({
        where: {
          table_id: table.id,
          [Op.not]: [
            { status: 'cancelled' },
            { status: 'delivered', payment_status: 'paid' }
          ]
        },
        order: [['created_at', 'DESC']]
      });
      return {
        ...table.toJSON(),
        active_order: activeOrder ? activeOrder.toJSON() : null
      };
    }));

    res.json(tablesWithOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/tables
router.post('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { number, capacity } = req.body;
    const table = await Table.create({ number, capacity, status: 'available' });
    res.status(201).json(table);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/tables/:id/active-order
router.get('/:id/active-order', authenticateToken, requireRole(['admin', 'waiter', 'cashier']), async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({
      where: {
        table_id: req.params.id,
        [Op.not]: [
          { status: 'cancelled' },
          { status: 'delivered', payment_status: 'paid' }
        ]
      },
      include: [{ model: OrderItem, as: 'order_items', include: [{ model: Product, as: 'product' }] }],
      order: [['created_at', 'DESC']]
    });
    
    if (!order) {
      res.status(404).json({ message: 'No active order found for this table' });
      return;
    }
    
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/tables/:id/status
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'waiter', 'cashier']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const table = await Table.findByPk(req.params.id);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }
    table.status = status;
    await table.save();
    res.json(table);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/tables/:id
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { number, capacity } = req.body;
    const table = await Table.findByPk(req.params.id);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }
    table.number = number;
    table.capacity = capacity;
    await table.save();
    res.json(table);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/tables/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const table = await Table.findByPk(req.params.id);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }
    await table.destroy();
    res.json({ message: 'Table deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
