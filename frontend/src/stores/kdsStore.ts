import { create } from 'zustand';
import { OrderItemKDS, kdsAPI } from '../services/kdsService';
import { socket } from '../lib/socket';

interface KdsState {
  items: OrderItemKDS[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  updateItemStatus: (id: number, status: string, rejected_reason?: string) => Promise<void>;
}

export const useKdsStore = create<KdsState>((set, get) => {
  // Listen for new orders
  socket.on('new_order', () => {
    // We only have the generic order, we don't have the exact KDS structure.
    // The easiest way to handle this securely without duplicating mapping logic 
    // is to trigger a refetch of KDS items when a new order arrives, 
    // or we could map them manually if we had the full structure.
    // For safety and correctness, we refetch on 'new_order'.
    get().fetchItems();
  });

  socket.on('order_item_updated', (payload: { orderId: number, item: any }) => {
    set((state) => {
      const updatedItems = state.items.map(i => {
        if (i.id === payload.item.id) {
          // Merge the updated fields
          return { ...i, ...payload.item };
        }
        return i;
      });
      return { items: updatedItems };
    });
  });

  return {
    items: [],
    loading: false,
    error: null,

    fetchItems: async () => {
      set({ loading: true, error: null });
      try {
        const data = await kdsAPI.getItems();
        set({ items: data, loading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Error fetching KDS items', loading: false });
      }
    },

    updateItemStatus: async (id: number, status: string, rejected_reason?: string) => {
      try {
        await kdsAPI.updateItemStatus(id, status, rejected_reason);
        // We let the socket event 'order_item_updated' handle the state update,
        // or we could do it optimistically. Let's do it optimistically for better UX.
        set((state) => ({
          items: state.items.map(i => i.id === id ? { ...i, status: status as any, rejected_reason } : i)
        }));
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Error updating item status' });
        throw err;
      }
    }
  };
});
