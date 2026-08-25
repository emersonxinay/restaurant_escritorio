import { useState, useCallback, useRef } from 'react';
import api from '../lib/api';

interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  details: string;
  status: 'pending' | 'confirmed' | 'rejected';
  qr_code?: string;
  created_at: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cache control
  const cacheRef = useRef<{ data: Reservation[]; timestamp: number } | null>(null);

  // Fetch all reservations with caching
  const fetchReservations = useCallback(async (forceRefresh = false) => {
    // Check cache
    if (!forceRefresh && cacheRef.current) {
      const now = Date.now();
      if (now - cacheRef.current.timestamp < CACHE_DURATION) {
        setReservations(cacheRef.current.data);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const response = await api.get('/reservations');
      const data = response.data.reservations || [];

      // Update cache
      cacheRef.current = { data, timestamp: Date.now() };
      setReservations(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar las reservas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update reservation status locally
  const updateReservationStatus = useCallback(
    (id: number, status: Reservation['status']) => {
      setReservations(prev =>
        prev.map(r =>
          r.id === id ? { ...r, status } : r
        )
      );

      // Update cache if exists
      if (cacheRef.current) {
        cacheRef.current.data = cacheRef.current.data.map(r =>
          r.id === id ? { ...r, status } : r
        );
      }
    },
    []
  );

  // Delete reservation locally
  const removeReservation = useCallback((id: number) => {
    setReservations(prev => prev.filter(r => r.id !== id));

    // Update cache if exists
    if (cacheRef.current) {
      cacheRef.current.data = cacheRef.current.data.filter(r => r.id !== id);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  return {
    reservations,
    loading,
    error,
    fetchReservations,
    updateReservationStatus,
    removeReservation,
    clearCache,
    setReservations
  };
}
