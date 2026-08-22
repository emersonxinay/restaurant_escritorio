import { Router, Response } from 'express';
import { OrderItem, Order, Product, Table, User } from '../models';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import { socketService } from '../services/socket';

const router = Router();

// GET /api/kds/items
// Get items for the currently logged in kitchen/bar user based on their station_id
router.get('/items', authenticateToken, requireRole(['kitchen', 'bar', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    console.log("KDS GET ITEMS - USER:", user);
    
    const whereClause: any = {
      status: {
        [Op.in]: ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'rejected']
      }
    };

    const includeProduct: any = {
      model: Product,
      as: 'product',
      attributes: ['id', 'name', 'station_id']
    };

    // Fetch latest user from DB to avoid stale JWTs that might not have station_id
    const dbUser = await User.findByPk(user?.id);
    const stationId = dbUser?.station_id;

    // If user is not admin and has a station_id, filter by their station
    if (user?.role !== 'admin' && stationId) {
      includeProduct.where = { station_id: stationId };
      includeProduct.required = true;
    }

    const items = await OrderItem.findAll({
      where: whereClause,
      include: [
        includeProduct,
        {
          model: Order,
          as: 'order',
          where: {
            status: {
              [Op.in]: ['confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled']
            },
            created_at: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          attributes: ['id', 'order_number', 'customer_name', 'delivery_type', 'notes', 'status'],
          include: [
            {
              model: Table,
              as: 'table',
              attributes: ['number']
            },
            {
              model: OrderItem,
              as: 'order_items',
              attributes: ['id', 'status'],
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'name', 'station_id']
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/kds/items/:id/status
// Update status of an item (accept, reject, ready, etc)
router.patch('/items/:id/status', authenticateToken, requireRole(['kitchen', 'bar', 'admin', 'waiter']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejected_reason } = req.body;
    const item = await OrderItem.findByPk(req.params.id);
    
    if (!item) {
      res.status(404).json({ message: 'Order item not found' });
      return;
    }

    item.status = status;
    if (status === 'rejected' && rejected_reason) {
      item.rejected_reason = rejected_reason;
    }
    
    // OrderItem has timestamps: false, so we MUST manually set updated_at
    (item as any).updated_at = new Date();

    await item.save();

    // Check if all items in the order are ready or delivered, then update order status
    if (status === 'ready' || status === 'delivered' || status === 'preparing' || status === 'rejected') {
      const allItems = await OrderItem.findAll({ where: { order_id: item.order_id } });
      const allRejected = allItems.length > 0 && allItems.every(i => i.status === 'rejected');
      const allReadyOrDelivered = allItems.every(i => ['ready', 'served', 'delivered', 'rejected'].includes(i.status));
      const allDelivered = allItems.every(i => ['served', 'delivered', 'rejected'].includes(i.status));
      
      const order = await Order.findByPk(item.order_id);
      if (order) {
        let orderUpdated = false;
        if (allRejected && order.status !== 'cancelled') {
          order.status = 'cancelled';
          orderUpdated = true;
        } else if (status === 'preparing' && (order.status === 'pending' || order.status === 'confirmed')) {
          order.status = 'preparing';
          orderUpdated = true;
        } else if (allDelivered && order.status !== 'delivered' && !allRejected) {
          order.status = 'delivered';
          orderUpdated = true;
          
          // Free table if already paid
          if (order.payment_status === 'paid' && order.delivery_type === 'dine_in' && order.table_id) {
             const table = await Table.findByPk(order.table_id);
             if (table) {
               table.status = 'available';
               await table.save();
             }
          }
        } else if (allReadyOrDelivered && order.status !== 'ready' && order.status !== 'delivered' && !allRejected) {
          order.status = 'ready';
          orderUpdated = true;
        }

        if (orderUpdated) {
          (order as any).updated_at = new Date();
          await order.save();
          socketService.getIO().emit('order_updated', order);
        }
      }
    }

    // Emit order item updated
    socketService.getIO().emit('order_item_updated', { orderId: item.order_id, item });

    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
