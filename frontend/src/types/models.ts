export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  image_url?: string;
  is_available: boolean;
  station_id?: number;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'cleaning' | 'reserved';
  active_order?: Order;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'rejected';
  product?: Product;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_type: 'pickup' | 'delivery' | 'dine_in';
  delivery_address?: string;
  delivery_references?: string;
  delivery_street_number?: string;
  delivery_property_type?: 'house' | 'apartment';
  delivery_apartment_number?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_fee: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid';
  table_id?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
  // For backwards compatibility before refactoring the frontend completely
  items?: any[];
  waiter?: { name: string; username: string };
  cashier?: { name: string; username: string };
  payments?: any[];
}

export interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  details?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'no_show';
  qr_code?: string;
  created_at: string;
}
