import api from '../lib/api';

export interface CashMovement {
  id?: number;
  date: string;
  type: 'expense' | 'income';
  amount: number;
  observation: string;
  creator?: { name: string };
  created_at?: string;
}

export interface CashierReport {
  date: string;
  is_closed?: boolean;
  is_open?: boolean;
  daily_close?: any;
  previous_close?: any;
  movements?: CashMovement[];
  total_sales: number;
  total_tips: number;
  total_collected: number;
  by_method: {
    cash: number;
    card_transbank: number;
    transfer: number;
    mixed: number;
  };
  tips_by_waiter: Array<{
    name: string;
    tips: number;
    order_count: number;
  }>;
  orders: any[];
}

export const cashierAPI = {
  getTodayReport: async (date?: string): Promise<CashierReport> => {
    const response = await api.get('/cashier/reports/today' + (date ? `?date=${date}` : ''));
    return response.data;
  },
  openRegister: async (data: {
    date: string;
    opening_balance: number;
  }): Promise<{message: string, data: any}> => {
    const response = await api.post('/cashier/open', data);
    return response.data;
  },
  addMovement: async (data: {
    date: string;
    type: 'expense' | 'income';
    amount: number;
    observation: string;
  }): Promise<{message: string, data: CashMovement}> => {
    const response = await api.post('/cashier/movements', data);
    return response.data;
  },
  closeRegister: async (data: {
    date: string;
    counted_cash: number;
    amount_to_deposit: number;
  }): Promise<{message: string, data: any}> => {
    const response = await api.post('/cashier/close', data);
    return response.data;
  },
  getMonthlyCloses: async (month: string): Promise<any[]> => {
    const response = await api.get(`/cashier/closes?month=${month}`);
    return response.data;
  },
  reprintOrder: async (orderId: number): Promise<{ message: string }> => {
    const response = await api.post(`/cashier/orders/${orderId}/reprint`);
    return response.data;
  },
  processPayment: async (orderId: number, paymentData: { amount: number, method: string }) => {
    const response = await api.post('/payments', {
      order_id: orderId,
      amount: paymentData.amount,
      method: paymentData.method
    });
    return response.data;
  }
};
