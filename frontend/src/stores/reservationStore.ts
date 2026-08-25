import { create } from 'zustand';
import api from '../lib/api';
import { Reservation } from '../types/models';
import { socket } from '../lib/socket';

interface ReservationState {
  reservations: Reservation[];
  myReservations: Reservation[]; // for the customer view
  loading: boolean;
  error: string | null;
  fetchReservations: () => Promise<void>;
  fetchMyReservations: () => Promise<void>;
  cancelReservation: (id: number) => Promise<void>;
}

export const useReservationStore = create<ReservationState>((set) => {
  // Listen to socket events
  socket.on('new_reservation', (reservation: Reservation) => {
    set((state) => ({
      reservations: [reservation, ...state.reservations],
      // Depending on if we want to show it in 'myReservations' right away, 
      // but usually the customer just fetched it after creating, so we don't strictly need it.
    }));
  });

  socket.on('reservation_updated', (updatedRes: Reservation) => {
    set((state) => ({
      reservations: state.reservations.map(r => r.id === updatedRes.id ? updatedRes : r),
      myReservations: state.myReservations.map(r => r.id === updatedRes.id ? updatedRes : r)
    }));
  });

  socket.on('reservation_deleted', (idStr: string) => {
    const id = parseInt(idStr, 10);
    set((state) => ({
      reservations: state.reservations.filter(r => r.id !== id),
      myReservations: state.myReservations.filter(r => r.id !== id)
    }));
  });

  return {
    reservations: [],
    myReservations: [],
    loading: false,
    error: null,

    fetchReservations: async () => {
      set({ loading: true, error: null });
      try {
        const response = await api.get('/reservations');
        set({ reservations: response.data.reservations || [], loading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Error fetching reservations', loading: false });
      }
    },

    fetchMyReservations: async () => {
      set({ loading: true, error: null });
      try {
        const response = await api.get('/reservations/my');
        set({ myReservations: response.data.reservations || [], loading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Error fetching my reservations', loading: false });
      }
    },

    cancelReservation: async (id: number) => {
      try {
        await api.delete(`/reservations/${id}`);
        // Socket event 'reservation_deleted' will remove it from the list
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Error canceling reservation' });
        throw err;
      }
    }
  };
});
