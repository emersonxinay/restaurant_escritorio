import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductImageThumbnail from './ProductImageThumbnail';
import { Icon, Icons } from '../utils/icons';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '../hooks/useAuth';

export default function CartPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, updateItemNotes, clearCart, getTotal } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      removeItem: state.removeItem,
      updateQuantity: state.updateQuantity,
      updateItemNotes: state.updateItemNotes,
      clearCart: state.clearCart,
      getTotal: state.getTotal,
    }))
  );
  const [isOpen, setIsOpen] = useState(false);

  const total = getTotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Do not show cart for strictly kitchen/prep roles
  if (user && ['kitchen', 'sushi', 'bar'].includes(user.role)) {
    return null;
  }

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-hazuki rounded-full shadow-lg hover:shadow-glow-red transform hover:scale-110 transition-all duration-300 text-white"
      >
        <div className="relative">
          <span className="text-2xl md:text-3xl flex items-center justify-center"><Icon icon={Icons.cart} size="sm" /></span>
          {itemCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-bold shadow-lg">
              {itemCount}
            </div>
          )}
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Cart Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-full bg-white rounded-t-3xl shadow-2xl z-40 transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-hazuki text-white rounded-t-3xl md:rounded-t-2xl p-4 md:p-5 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-bold">Mi Carrito</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-2xl font-bold hover:bg-white/20 w-10 h-10 flex items-center justify-center rounded-full transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full md:h-auto overflow-hidden">
          {/* Items List */}
          <div className="flex-1 overflow-y-auto max-h-96 md:max-h-96 p-4 md:p-5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-hazuki-gray-medium">
                <span className="text-4xl mb-3 text-orange-600 flex items-center justify-center"><Icon icon={Icons.cart} size="lg" /></span>
                <p className="text-center text-sm md:text-base text-hazuki-text-dark">Tu carrito está vacío</p>
                <p className="text-center text-xs text-hazuki-gray-medium mt-2">Agrega productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    {/* Product Image */}
                    <ProductImageThumbnail
                      imageUrl={item.image_url}
                      alt={item.name}
                      size="md"
                      showBorder={true}
                      className="w-16 h-16 md:w-20 md:h-20"
                    />

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-hazuki-text-dark text-xs md:text-sm leading-tight">{item.name}</h3>
                      <p className="text-hazuki-orange font-bold text-sm md:text-base">
                        ${(item.price * item.quantity).toFixed(0)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-hazuki-gray-light rounded text-sm font-bold transition text-hazuki-text-dark"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-hazuki-text-dark">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-hazuki-gray-light rounded text-sm font-bold transition text-hazuki-text-dark"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-auto text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold transition"
                        >
                          Eliminar
                        </button>
                      </div>
                      
                      {/* Item Notes Input */}
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Nota (ej. sin sal)"
                          value={item.notes || ''}
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-gray-200 rounded text-hazuki-text-dark focus:border-hazuki-orange focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          {items.length > 0 && <div className="h-px bg-gray-200" />}

          {/* Summary */}
          {items.length > 0 && (
            <div className="p-4 md:p-5 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-hazuki-gray-medium">
                <span>Subtotal:</span>
                <span className="font-bold text-hazuki-text-dark">${total.toFixed(0)}</span>
              </div>

              {/* Delivery (Ocultar si es mesero tomando pedido para mesa) */}
              {!(user?.role === 'waiter' && useCartStore.getState().activeTableId) && (
                <div className="flex justify-between text-hazuki-gray-medium text-sm">
                  <span>Delivery:</span>
                  <span className="font-bold text-hazuki-orange">desde $1.500</span>
                </div>
              )}

              {/* Total */}
              <div className="bg-gradient-hazuki text-white rounded-lg p-3 flex justify-between items-center">
                <span className="font-bold">Total Estimado:</span>
                <span className="text-2xl font-black">${(user?.role === 'waiter' && useCartStore.getState().activeTableId) ? total.toFixed(0) : (total + 1500).toFixed(0)}</span>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full bg-gradient-hazuki text-white font-bold py-3 rounded-lg hover:shadow-glow-red transform hover:scale-105 transition-all duration-300"
                >
                  <Icon icon={Icons.check} size="sm" className="inline mr-1" /> Confirmar Pedido
                </button>
                <button
                  onClick={() => clearCart()}
                  className="w-full bg-gray-200 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Limpiar Carrito
                </button>
              </div>

              {/* Trust Badge */}
              <div className="text-xs text-center text-gray-500 border-t pt-2">
                <p><Icon icon={Icons.check} size="sm" className="inline" /> Garantía 100% frescos • Entrega Rápida</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop View */}
      {isOpen && (
        <div className="hidden md:block fixed right-6 top-20 w-96 bg-white rounded-2xl shadow-2xl z-40">
          {/* Header */}
          <div className="bg-gradient-hazuki text-white rounded-t-2xl p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold">Mi Carrito</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-2xl font-bold hover:bg-white/20 w-10 h-10 flex items-center justify-center rounded-full transition"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col">
            {/* Items List */}
            <div className="overflow-y-auto max-h-96 p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-hazuki-gray-medium">
                  <span className="text-4xl mb-3 text-orange-600 flex items-center justify-center"><Icon icon={Icons.cart} size="lg" /></span>
                  <p className="text-center text-hazuki-text-dark">Tu carrito está vacío</p>
                  <p className="text-center text-xs text-hazuki-gray-medium mt-2">Agrega productos para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <ProductImageThumbnail
                        imageUrl={item.image_url}
                        alt={item.name}
                        size="lg"
                        showBorder={true}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-hazuki-text-dark text-sm leading-tight">{item.name}</h3>
                        <p className="text-hazuki-orange font-bold">${(item.price * item.quantity).toFixed(0)}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-hazuki-gray-light rounded font-bold transition text-hazuki-text-dark"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-bold text-hazuki-text-dark">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-hazuki-gray-light rounded font-bold transition text-hazuki-text-dark"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold transition"
                          >
                            Eliminar
                          </button>
                        </div>

                        {/* Item Notes Input */}
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Nota (ej. sin sal)"
                            value={item.notes || ''}
                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-gray-200 rounded text-hazuki-text-dark focus:border-hazuki-orange focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && <div className="h-px bg-gray-200" />}

            {/* Summary */}
            {items.length > 0 && (
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-hazuki-gray-medium">
                  <span>Subtotal:</span>
                  <span className="font-bold text-hazuki-text-dark">${total.toFixed(0)}</span>
                </div>

                {/* Delivery (Ocultar si es mesero tomando pedido) */}
                {!(user?.role === 'waiter' && useCartStore.getState().activeTableId) && (
                  <div className="flex justify-between text-hazuki-gray-medium text-sm">
                    <span>Delivery:</span>
                    <span className="font-bold text-hazuki-orange">desde $1.500</span>
                  </div>
                )}

                <div className="bg-gradient-hazuki text-white rounded-lg p-3 flex justify-between items-center">
                  <span className="font-bold">Total Estimado:</span>
                  <span className="text-2xl font-black">${(user?.role === 'waiter' && useCartStore.getState().activeTableId) ? total.toFixed(0) : (total + 1500).toFixed(0)}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full bg-gradient-hazuki text-white font-bold py-3 rounded-lg hover:shadow-glow-red transform hover:scale-105 transition-all duration-300"
                  >
                    <Icon icon={Icons.check} size="sm" className="inline mr-1" /> Confirmar Pedido
                  </button>
                  <button
                    onClick={() => clearCart()}
                    className="w-full bg-gray-200 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Limpiar Carrito
                  </button>
                </div>

                <div className="text-xs text-center text-gray-500 border-t pt-2">
                  <p><Icon icon={Icons.check} size="sm" className="inline" /> Garantía 100% frescos • Entrega Rápida</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
