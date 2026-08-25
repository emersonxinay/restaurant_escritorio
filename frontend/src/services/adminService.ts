import api from '../lib/api';

// Types
export interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id: number;
  category?: Category;
  station_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Discount {
  id: number;
  title: string;
  percentage: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  auto_apply: boolean;
  status: 'active' | 'programmed' | 'expired';
  created_at?: string;
  updated_at?: string;
}

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get<{ categories: Category[] }>('/admin/categories');
    return { data: response.data.categories };
  },
  getById: async (id: number) => {
    const response = await api.get<Category>(`/admin/categories/${id}`);
    return { data: response.data };
  },
  create: async (data: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<{ message: string; category: Category }>('/admin/categories', data);
    return { data: response.data.category };
  },
  update: async (id: number, data: Partial<Category>) => {
    const response = await api.put<{ message: string; category: Category }>(`/admin/categories/${id}`, data);
    return { data: response.data.category };
  },
  delete: (id: number) => api.delete(`/admin/categories/${id}`),
};

// Products API
export const productsAPI = {
  getAll: async () => {
    const response = await api.get<{ products: Product[] }>('/admin/products');
    return { data: response.data.products };
  },
  getById: async (id: number) => {
    const response = await api.get<Product>(`/admin/products/${id}`);
    return { data: response.data };
  },
  create: async (data: any) => {
    const response = await api.post<{ message: string; product: Product }>('/admin/products', data);
    return { data: response.data.product };
  },
  update: async (id: number, data: any) => {
    const response = await api.put<{ message: string; product: Product }>(`/admin/products/${id}`, data);
    return { data: response.data.product };
  },
  delete: (id: number) => api.delete(`/admin/products/${id}`),
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ message: string; url: string }>('/admin/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: { url: response.data.url } };
  },
};

// Discounts API
export const discountsAPI = {
  getAll: async () => {
    const response = await api.get<{ discounts: Discount[] }>('/admin/discounts');
    return { data: response.data.discounts };
  },
  getById: async (id: number) => {
    const response = await api.get<Discount>(`/admin/discounts/${id}`);
    return { data: response.data };
  },
  create: async (data: any) => {
    const response = await api.post<{ message: string; discount: Discount }>('/admin/discounts', data);
    return { data: response.data.discount };
  },
  update: async (id: number, data: any) => {
    const response = await api.put<{ message: string; discount: Discount }>(`/admin/discounts/${id}`, data);
    return { data: response.data.discount };
  },
  delete: (id: number) => api.delete(`/admin/discounts/${id}`),
};

// Tables API
export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
}

export const tablesAPI = {
  getAll: async () => {
    const response = await api.get<{ tables: Table[] }>('/tables');
    // Note: GET /tables directly returns the array, not an object with { tables: ... } based on tables.ts, wait let me check.
    // Yes, res.json(tables) returns an array. Let me fix the type:
    return { data: response.data as any as Table[] };
  },
  create: async (data: any) => {
    const response = await api.post<Table>('/tables', data);
    return { data: response.data };
  },
  update: async (id: number, data: any) => {
    const response = await api.put<Table>(`/tables/${id}`, data);
    return { data: response.data };
  },
  delete: (id: number) => api.delete(`/tables/${id}`),
  updateStatus: async (id: number, status: string) => {
    const response = await api.patch<Table>(`/tables/${id}/status`, { status });
    return { data: response.data };
  }
};

// Stations API
export interface Station {
  id: number;
  name: string;
  description?: string;
  printer_ip?: string;
}

export const stationsAPI = {
  getAll: async () => {
    const response = await api.get<Station[]>('/stations');
    return { data: response.data };
  },
  create: async (data: any) => {
    const response = await api.post<Station>('/stations', data);
    return { data: response.data };
  },
  update: async (id: number, data: any) => {
    const response = await api.put<Station>(`/stations/${id}`, data);
    return { data: response.data };
  },
  delete: (id: number) => api.delete(`/stations/${id}`),
};
