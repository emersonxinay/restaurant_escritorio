import { useCallback, useState } from 'react';
import api from '../lib/api';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id: number;
}

export interface Category {
  id: number;
  name: string;
}

export const usePublic = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHome = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/home');
      setCategories(response.data.categories);
      setProducts(Object.values(response.data.products_by_category).flat() as Product[]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCarta = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/carta');
      setCategories(response.data.categories);
      setProducts(Object.values(response.data.products_by_category).flat() as Product[]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPromociones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/promociones');
      setProducts(response.data.products);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (categoryId?: number) => {
    try {
      setLoading(true);
      const params = categoryId ? { category_id: categoryId } : {};
      const response = await api.get('/public/products', { params });
      setProducts(response.data.products);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/categories');
      setCategories(response.data.categories);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    products,
    loading,
    error,
    fetchHome,
    fetchCarta,
    fetchPromociones,
    fetchProducts,
    fetchCategories
  };
};
