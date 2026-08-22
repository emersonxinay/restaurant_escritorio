import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { Order, OrderItem, Product, Table, Payment, User, AuditLog } from '../models';
import { authenticateToken, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';
import sequelize from '../config/database';
import { socketService } from '../services/socket';

const router = Router();

const calculateDeliveryFee = (distanceKm: number): number => {
  if (distanceKm <= 0) return 0;
  const baseFee = 2000;
  if (distanceKm <= 1) return baseFee;
  const additionalDistance = distanceKm - 1;
  const additionalChunks = Math.ceil(additionalDistance / 0.5);
  return baseFee + additionalChunks * 1000;
};

// POST /api/orders - Crear nueva orden
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const {
      customer_name, customer_phone, customer_email,
      delivery_type, delivery_address, delivery_references,
      delivery_lat, delivery_lng, delivery_street_number,
      delivery_property_type, delivery_apartment_number,
      items, subtotal, discount_amount, delivery_distance_km, notes,
      table_id
    } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      res.status(400).json({ message: 'Items are required' });
      return;
    }

    let deliveryFee = 0;
    if (delivery_type === 'delivery') {
      if (!delivery_address) {
        await t.rollback();
        res.status(400).json({ message: 'Delivery address required' });
        return;
      }
      deliveryFee = calculateDeliveryFee(delivery_distance_km || 0);
    }

    const total = parseFloat(subtotal) + deliveryFee - parseFloat(discount_amount || 0);

    const isStaff = req.user?.role && ['admin', 'cashier', 'waiter'].includes(req.user.role);
    const initialStatus = isStaff ? 'confirmed' : 'pending';

    const order = await Order.create({
      order_number: '',
      user_id: req.user?.id || undefined,
      customer_name: customer_name || 'Mesa',
      customer_phone: customer_phone || '000000000',
      customer_email,
      delivery_type,
      delivery_address: delivery_type === 'delivery' ? delivery_address : null,
      delivery_references: delivery_type === 'delivery' ? delivery_references : null,
      delivery_lat: delivery_type === 'delivery' ? delivery_lat : null,
      delivery_lng: delivery_type === 'delivery' ? delivery_lng : null,
      delivery_street_number: delivery_type === 'delivery' ? delivery_street_number : null,
      delivery_property_type: delivery_type === 'delivery' ? delivery_property_type : null,
      delivery_apartment_number: delivery_type === 'delivery' ? delivery_apartment_number : null,
      delivery_fee: deliveryFee,
      subtotal: parseFloat(subtotal),
      discount_amount: parseFloat(discount_amount || 0),
      total,
      items: [], // Deprecated JSON array, we use OrderItem now
      status: initialStatus,
      payment_status: 'pending',
      table_id: table_id || null,
      waiter_id: (req.user?.role === 'waiter') ? req.user.id : null,
      cashier_id: (req.user?.role === 'cashier' || req.user?.role === 'admin') ? req.user.id : null,
      notes
    }, { transaction: t });

    order.order_number = order.generateOrderNumber();
    await order.save({ transaction: t });

    // Create Order Items
    for (const item of items) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        status: 'pending',
        notes: item.notes || null
      }, { transaction: t });
    }

    // If dine in and table provided, update table status to occupied
    if (delivery_type === 'dine_in' && table_id) {
      const table = await Table.findByPk(table_id);
      if (table) {
        table.status = 'occupied';
        await table.save({ transaction: t });
      }
    }

    await t.commit();

    // Fetch the complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'order_items', include: [{ model: Product, as: 'product' }] }]
    });

    // Log the action
    await AuditLog.create({
      user_id: req.user?.id || null,
      action: 'ORDER_CREATED',
      target_type: 'Order',
      target_id: order.id,
      details: { order_number: order.order_number, total: order.total }
    });

    socketService.getIO().emit('new_order', completeOrder);

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder
    });
  } catch (error: any) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
});

// POST /api/orders/:id/items - Add items to existing order
router.post('/:id/items', authenticateToken, requireRole(['admin', 'cashier', 'waiter']), async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const { items } = req.body;
    if (!items || items.length === 0) {
      await t.rollback();
      res.status(400).json({ message: 'Items are required' });
      return;
    }

    let additionalSubtotal = 0;

    for (const item of items) {
      // Create new order item
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        status: 'pending' // Send it to kitchen again
      }, { transaction: t });
      
      additionalSubtotal += item.price * item.quantity;
    }

    // Update order totals
    order.subtotal = Number(order.subtotal) + additionalSubtotal;
    order.total = Number(order.total) + additionalSubtotal;
    
    // If order was already completed/paid, it might be weird to add items, 
    // but assuming it's still open for the table.
    if (order.payment_status === 'paid') {
      order.payment_status = 'partial';
    }

    await order.save({ transaction: t });
    await t.commit();

    // Fetch updated order to return
    const completeOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'order_items', include: [{ model: Product, as: 'product' }] }]
    });

    socketService.getIO().emit('order_updated', completeOrder);

    res.status(200).json({
      message: 'Items added successfully',
      order: completeOrder
    });
  } catch (error: any) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/customer/:phone - Get customer history by phone
router.get('/customer/:phone', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { phone } = req.params;
    
    // Buscar órdenes con ese teléfono, ordenadas por más reciente
    const orders = await Order.findAll({
      where: { customer_phone: phone },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: OrderItem,
          as: 'order_items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    if (orders.length === 0) {
      res.status(404).json({ message: 'No se encontró historial para este cliente' });
      return;
    }

    const lastOrder = orders[0];
    
    // Preparar el resumen del cliente usando la orden más reciente
    const customerInfo = {
      name: lastOrder.customer_name,
      phone: lastOrder.customer_phone,
      email: lastOrder.customer_email,
      last_delivery_address: lastOrder.delivery_address,
      last_delivery_lat: lastOrder.delivery_lat,
      last_delivery_lng: lastOrder.delivery_lng,
      last_delivery_street_number: lastOrder.delivery_street_number,
      last_delivery_property_type: lastOrder.delivery_property_type,
      last_delivery_apartment_number: lastOrder.delivery_apartment_number,
      last_delivery_references: lastOrder.delivery_references,
      total_orders: orders.length,
      history: orders.slice(0, 20) // Devolver las últimas 20 órdenes para el historial
    };

    res.json(customerInfo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/my
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const orders = await Order.findAll({
      where: { user_id: userId },
      include: [
        { model: OrderItem, as: 'order_items', include: [{ model: Product, as: 'product' }] },
        { model: User, as: 'waiter', attributes: ['name', 'username'] },
        { model: User, as: 'cashier', attributes: ['name', 'username'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/kds - Kitchen Display System endpoint
router.get('/kds', authenticateToken, requireRole(['admin', 'kitchen', 'bar']), async (req: AuthRequest, res: Response) => {
  try {
    // Fetch pending or preparing items
    const items = await OrderItem.findAll({
      where: {
        status: ['pending', 'preparing']
      },
      include: [
        { model: Order, as: 'order', attributes: ['order_number', 'delivery_type', 'table_id', 'created_at'] },
        { model: Product, as: 'product', attributes: ['name', 'station_id'] }
      ],
      order: [['created_at', 'ASC']]
    });
    res.json({ items });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/orders/items/:id/status - Update OrderItem status
router.put('/items/:id/status', authenticateToken, requireRole(['admin', 'kitchen', 'bar', 'waiter']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const item = await OrderItem.findByPk(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Order item not found' });
      return;
    }
    item.status = status;
    await item.save();
    
    // Notify about item update so KDS and Admin/Waiter can refresh the whole order
    socketService.getIO().emit('order_item_updated', { orderId: item.order_id, item });

    res.json({ message: 'Order item status updated', item });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'order_items', include: [{ model: Product, as: 'product' }] }]
    });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders
router.get('/', authenticateToken, requireRole(['admin', 'cashier', 'waiter']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, payment_status, startDate, endDate, search } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`), 
          new Date(`${endDate}T23:59:59.999`)
        ]
      };
    } else if (startDate) {
      where.created_at = { [Op.gte]: new Date(`${startDate}T00:00:00`) };
    } else if (endDate) {
      where.created_at = { [Op.lte]: new Date(`${endDate}T23:59:59.999`) };
    }

    if (search) {
      const searchLike = `%${search}%`;
      where[Op.or] = [
        { order_number: { [Op.iLike]: searchLike } },
        { customer_name: { [Op.iLike]: searchLike } },
        { customer_email: { [Op.iLike]: searchLike } },
        { customer_phone: { [Op.iLike]: searchLike } }
      ];
    }
    
    // Si es un mesero, idealmente solo ve los pendientes de mesas, pero lo filtraremos en el frontend
    const orders = await Order.findAll({
      where,
      include: [
        { model: OrderItem, as: 'order_items', include: [{ model: Product, as: 'product' }] },
        { model: Payment, as: 'payments' },
        { model: User, as: 'waiter', attributes: ['name', 'username', 'role'] },
        { model: User, as: 'cashier', attributes: ['name', 'username', 'role'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'cashier', 'waiter']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    console.log(`[PATCH /orders/:id/status] id=${req.params.id}, status=${status}`);
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      console.log(`[PATCH /orders/:id/status] Order not found for id=${req.params.id}`);
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    
    // If the order is being cancelled, optionally cancel all items?
    if (status === 'cancelled') {
      await OrderItem.update({ status: 'rejected' }, { where: { order_id: order.id } });
    }

    order.status = status;
    await order.save();

    // Check if order is now complete (delivered AND paid) -> free table
    if (status === 'delivered' && order.payment_status === 'paid' && order.delivery_type === 'dine_in' && order.table_id) {
       const table = await Table.findByPk(order.table_id);
       if (table) {
         table.status = 'available';
         await table.save();
       }
    }
    
    // Check if order is cancelled -> free table
    if (status === 'cancelled' && order.delivery_type === 'dine_in' && order.table_id) {
       const table = await Table.findByPk(order.table_id);
       if (table) {
         table.status = 'available';
         await table.save();
         
         await AuditLog.create({
           user_id: req.user?.id || null,
           action: 'TABLE_FREED',
           target_type: 'Table',
           target_id: table.id,
           details: { reason: 'Order cancelled', order_id: order.id }
         });
       }
    }

    if (status === 'cancelled') {
      await AuditLog.create({
        user_id: req.user?.id || null,
        action: 'ORDER_CANCELLED',
        target_type: 'Order',
        target_id: order.id,
        details: { order_number: order.order_number }
      });
    }

    socketService.getIO().emit('order_updated', order);

    res.json({ message: 'Order status updated', order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
