import { create } from 'zustand';
import api from '../lib/api';
import { Order } from '../types/models';
import { socket } from '../lib/socket';

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  updateOrderStatusLocally: (orderId: number, status: Order['status']) => void;
  updateOrderStatus: (orderId: number, status: Order['status']) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => {
  // Listen to socket events
  socket.on('new_order', (order: Order) => {
    set((state) => {
      // Avoid duplicates
      if (state.orders.some(o => o.id === order.id)) return state;
      return { orders: [order, ...state.orders] };
    });
  });

  socket.on('order_updated', (updatedOrder: Order) => {
    set((state) => ({
      orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    }));
  });

  return {
    orders: [],
    loading: false,
    error: null,

    fetchOrders: async () => {
      set({ loading: true, error: null });
      try {
        const response = await api.get('/orders');
        set({ orders: response.data.orders || [], loading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Error fetching orders', loading: false });
      }
    },

    updateOrderStatusLocally: (orderId, status) => {
      set((state) => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
      }));
    },

    updateOrderStatus: async (orderId, status) => {
      try {
        await api.patch(`/orders/${orderId}/status`, { status });
        // We can either update locally immediately or wait for the socket event.
        // Let's rely on the socket event if it's connected, or we update locally for snappiness:
        get().updateOrderStatusLocally(orderId, status);
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Error updating order status' });
      }
    }
  };
});
