import { create } from 'zustand';
import api from '../lib/api';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id?: number;
}

export interface Discount {
  id: number;
  title: string;
  percentage: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Subcategory {
  id: number;
  name: string;
  parent_id: number;
  products: Product[];
}

export interface MainCategory {
  id: number;
  name: string;
  parent_id: null;
  subcategories: Subcategory[];
}

interface AppDataStore {
  products: Product[];
  categories: Category[];
  discount: Discount | null;
  menuStructure: MainCategory[];
  
  hasFetchedHome: boolean;
  hasFetchedMenu: boolean;
  
  fetchHomeData: () => Promise<void>;
  fetchMenuData: () => Promise<void>;
}

export const useAppDataStore = create<AppDataStore>((set, get) => ({
  products: [],
  categories: [],
  discount: null,
  menuStructure: [],
  
  hasFetchedHome: false,
  hasFetchedMenu: false,

  fetchHomeData: async () => {
    if (get().hasFetchedHome) return;
    
    try {
      const [productsRes, categoriesRes, discountRes] = await Promise.all([
        api.get('/public/products'),
        api.get('/public/categories'),
        Promise.resolve({ data: null }), // Evitar error 404 de consola
      ]);

      set({
        products: productsRes.data.products || [],
        categories: categoriesRes.data.categories || [],
        discount: discountRes.data || null,
        hasFetchedHome: true,
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  },

  fetchMenuData: async () => {
    if (get().hasFetchedMenu) return;
    
    try {
      const response = await api.get('/public/menu-structure');
      const data = response.data.menu_structure || [];
      
      set({
        menuStructure: data,
        hasFetchedMenu: true,
      });
    } catch (error) {
      console.error('Error fetching menu structure:', error);
    }
  },
}));
