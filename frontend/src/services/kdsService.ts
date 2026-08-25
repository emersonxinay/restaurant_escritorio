import api from '../lib/api';

export interface OrderItemKDS {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'served' | 'delivered';
  notes?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
    station_id: number | null;
  };
  order: {
    id: number;
    order_number: string;
    customer_name: string;
    delivery_type: string;
    notes?: string;
    table?: {
      number: number;
    } | null;
  };
}

export const kdsAPI = {
  getItems: async (): Promise<OrderItemKDS[]> => {
    const response = await api.get('/kds/items');
    return response.data;
  },
  
  updateItemStatus: async (id: number, status: string, rejected_reason?: string): Promise<OrderItemKDS> => {
    const response = await api.patch(`/kds/items/${id}/status`, { status, rejected_reason });
    return response.data;
  }
};
