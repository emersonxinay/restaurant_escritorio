import api from '../lib/api';

export interface WaiterStats {
  total_tips: number;
  orders_count: number;
  completed_orders_count: number;
  recent_orders: any[];
}

export const waiterAPI = {
  getStats: async (): Promise<WaiterStats> => {
    const response = await api.get('/waiter/stats');
    return response.data;
  },
  updateOrderStatus: async (orderId: number, status: string): Promise<any> => {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  }
};
