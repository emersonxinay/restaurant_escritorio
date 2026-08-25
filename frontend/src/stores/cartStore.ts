import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  orderNotes: string;
  activeTableId: number | null;
  activeOrderId: number | null;
  setOrderNotes: (notes: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateItemNotes: (id: number, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  setTableId: (id: number | null) => void;
  setActiveOrderId: (id: number | null) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      orderNotes: '',
      activeTableId: null,
      activeOrderId: null,
      setOrderNotes: (notes) => set({ orderNotes: notes }),
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      updateItemNotes: (id, notes) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, notes } : i)),
        })),
      clearCart: () => set({ items: [], orderNotes: '', activeTableId: null, activeOrderId: null }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      setTableId: (id) => set({ activeTableId: id }),
      setActiveOrderId: (id) => set({ activeOrderId: id })
    }),
    {
      name: 'restaurant-cart',
    }
  )
);
