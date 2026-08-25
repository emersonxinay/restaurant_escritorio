import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useCartStore } from '../stores/cartStore';
import { useAuth } from '../hooks/useAuth';
import { Icon, Icons } from '../utils/icons';
import api from '../lib/api';
import DeliveryMap from '../components/DeliveryMap';
import { useShallow } from 'zustand/react/shallow';

interface CheckoutState {
  deliveryType: 'pickup' | 'delivery' | 'dine_in';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryReferences?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryStreetNumber?: string;
  deliveryPropertyType?: 'house' | 'apartment';
  deliveryApartmentNumber?: string;
  distanceKm: number;
  notes: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items, addItem, updateItemNotes, getTotal, clearCart } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      addItem: state.addItem,
      updateItemNotes: state.updateItemNotes,
      getTotal: state.getTotal,
      clearCart: state.clearCart,
    }))
  );
  
  const isStaff = user?.role && ['waiter', 'admin', 'cashier'].includes(user.role);
  const isWaiterFlow = isStaff && useCartStore.getState().activeTableId;
  
  const [checkout, setCheckout] = useState<CheckoutState>({
    deliveryType: isWaiterFlow ? 'dine_in' : 'pickup',
    customerName: user?.name || '',
    customerPhone: '',
    customerEmail: user?.email || '',
    deliveryAddress: '',
    distanceKm: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDeliveryValid, setIsDeliveryValid] = useState(false);

  // Cargar datos precargados si es un pedido repetido
  useEffect(() => {
    const state = location.state as any;
    if (state?.prefilledOrder) {
      const prefilledOrder = state.prefilledOrder;

      if (prefilledOrder.items && prefilledOrder.items.length > 0) {
        clearCart();
        prefilledOrder.items.forEach((item: any) => {
          addItem({
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            quantity: item.quantity
          });
        });
      }

      setCheckout(prev => ({
        ...prev,
        deliveryType: prefilledOrder.delivery_type || 'pickup',
        customerName: prefilledOrder.customer_name || prev.customerName,
        customerPhone: prefilledOrder.customer_phone || prev.customerPhone,
        customerEmail: prefilledOrder.customer_email || prev.customerEmail,
        deliveryAddress: prefilledOrder.delivery_address || prev.deliveryAddress,
        deliveryLat: prefilledOrder.delivery_lat,
        deliveryLng: prefilledOrder.delivery_lng,
        notes: prefilledOrder.notes || prev.notes
      }));
    }
  }, [location.state, clearCart, addItem]);

  const calculateDeliveryFee = (): number => {
    if (checkout.deliveryType === 'pickup') return 0;

    const distance = checkout.distanceKm;
    const baseFee = 2000;
    const baseThreshold = 1.5;
    const additionalStep = 0.13;
    const additionalAmount = 200;

    if (distance <= baseThreshold) {
      return baseFee;
    }

    const additionalDistance = distance - baseThreshold;
    const additionalSteps = Math.ceil(additionalDistance / additionalStep);
    const additionalFee = additionalSteps * additionalAmount;

    return baseFee + additionalFee;
  };

  const handleLocationSelect = (lat: number, lng: number, distance: number, _deliveryFee: number, address: string) => {
    setCheckout(prev => ({
      ...prev,
      deliveryLat: lat,
      deliveryLng: lng,
      distanceKm: distance,
      deliveryAddress: address
    }));
  };

  const subtotal = getTotal();
  const deliveryFee = calculateDeliveryFee();
  const total = subtotal + deliveryFee;

  const validateAndSubmit = async () => {
    // Validación (saltar si es mesero)
    if (!isWaiterFlow) {
      if (!checkout.customerName.trim() || !checkout.customerPhone.trim()) {
        setError('Por favor completa Nombre y Teléfono');
        return;
      }

      if (checkout.deliveryType === 'delivery') {
        if (!checkout.deliveryLat || !isDeliveryValid) {
          setError('Por favor selecciona una ubicación válida dentro del área de cobertura (4 km máximo)');
          return;
        }
        if (!checkout.deliveryAddress.trim() || !checkout.deliveryStreetNumber?.trim()) {
          setError('Por favor completa la dirección de entrega');
          return;
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      if (items.length === 0) {
        setError('El carrito está vacío');
        setLoading(false);
        return;
      }

      const orderData = {
        customer_name: checkout.customerName,
        customer_phone: checkout.customerPhone,
        customer_email: checkout.customerEmail,
        delivery_type: checkout.deliveryType,
        delivery_address: checkout.deliveryType === 'delivery' ? checkout.deliveryAddress : undefined,
        delivery_references: checkout.deliveryType === 'delivery' ? checkout.deliveryReferences : undefined,
        delivery_lat: checkout.deliveryType === 'delivery' ? checkout.deliveryLat : undefined,
        delivery_lng: checkout.deliveryType === 'delivery' ? checkout.deliveryLng : undefined,
        delivery_street_number: checkout.deliveryType === 'delivery' ? checkout.deliveryStreetNumber : undefined,
        delivery_property_type: checkout.deliveryType === 'delivery' ? checkout.deliveryPropertyType : undefined,
        delivery_apartment_number: checkout.deliveryType === 'delivery' ? checkout.deliveryApartmentNumber : undefined,
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes
        })),
        subtotal,
        discount_amount: 0,
        delivery_distance_km: checkout.distanceKm,
        notes: checkout.notes,
        table_id: isWaiterFlow ? useCartStore.getState().activeTableId : undefined
      };

      const activeOrderId = useCartStore.getState().activeOrderId;

      let response;
      if (activeOrderId) {
        // Añadir a orden existente
        response = await api.post(`/orders/${activeOrderId}/items`, {
          items: orderData.items
        });
      } else {
        // Crear orden nueva
        response = await api.post('/orders', orderData);
      }

      clearCart();

      if (isWaiterFlow) {
        navigate('/waiter');
      } else {
        navigate(`/order-confirmation/${response.data.order.id}`, {
          state: { order: response.data.order }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar el pedido');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Icon icon={Icons.info} size="lg" className="text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-6">Tu carrito está vacío</p>
          <button
            onClick={() => navigate('/menu')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-lg transition"
          >
            Volver al Menú
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-12">
        <h1 className="text-4xl font-bold text-orange-600 mb-12">
          {isWaiterFlow 
            ? (useCartStore.getState().activeOrderId ? `Agregar Platos a Mesa ${useCartStore.getState().activeTableId}` : `Confirmar Pedido - Mesa ${useCartStore.getState().activeTableId}`)
            : 'Completar Pedido'}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 flex items-center gap-3">
            <Icon icon={Icons.error} size="sm" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Tipo de Entrega (Oculto para Meseros) */}
            {!isWaiterFlow && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                  <Icon icon={Icons.delivery} size="md" />
                  <span>Tipo de Entrega</span>
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-600 transition"
                    style={{ borderColor: checkout.deliveryType === 'pickup' ? '#a855f7' : '' }}>
                    <input
                      type="radio"
                      name="delivery"
                      value="pickup"
                      checked={checkout.deliveryType === 'pickup'}
                      onChange={() => {
                        setCheckout(prev => ({ ...prev, deliveryType: 'pickup' as const, deliveryLat: undefined, deliveryLng: undefined }));
                        setIsDeliveryValid(false);
                      }}
                      className="w-5 h-5"
                    />
                    <div className="ml-4">
                      <p className="font-bold flex items-center gap-2">
                        <Icon icon={Icons.store} size="sm" />
                        Retiro en Local
                      </p>
                      <p className="text-sm text-gray-600">Retira en nuestro restaurante</p>
                      <p className="text-green-600 font-bold mt-1">GRATIS</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-600 transition"
                    style={{ borderColor: checkout.deliveryType === 'delivery' ? '#a855f7' : '' }}>
                    <input
                      type="radio"
                      name="delivery"
                      value="delivery"
                      checked={checkout.deliveryType === 'delivery'}
                      onChange={() => {
                        setCheckout(prev => ({ ...prev, deliveryType: 'delivery' as const }));
                      }}
                      className="w-5 h-5"
                    />
                    <div className="ml-4">
                      <p className="font-bold flex items-center gap-2">
                        <Icon icon={Icons.car} size="sm" />
                        Entrega a Domicilio
                      </p>
                      <p className="text-sm text-gray-600">Entrega en tu dirección</p>
                      <p className="text-orange-600 font-bold mt-1">
                        {checkout.deliveryType === 'delivery' && checkout.deliveryLat ? `$${calculateDeliveryFee().toLocaleString('es-CL')}` : 'Desde $2.000'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* 2. Mapa y Datos de Entrega (solo si delivery) */}
            {!isWaiterFlow && checkout.deliveryType === 'delivery' && (
              <>
                {/* Mapa */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Icon icon={Icons.location} size="sm" />
                    Selecciona tu ubicación en el mapa
                  </h2>
                  <DeliveryMap
                    onLocationSelect={handleLocationSelect}
                    onValidityChange={setIsDeliveryValid}
                  />
                </div>

                {/* Datos de Entrega */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Icon icon={Icons.location} size="sm" />
                    Datos de Entrega
                  </h2>

                  <div className="space-y-4">
                    {/* Dirección confirmada */}
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold mb-1">Dirección Base *</label>
                      <div className="bg-gray-100 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-semibold">
                        {checkout.deliveryAddress || 'Selecciona ubicación en el mapa'}
                      </div>
                    </div>

                    {/* Tipo de Propiedad */}
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold mb-1">Tipo de Propiedad *</label>
                      <select
                        value={checkout.deliveryPropertyType || 'house'}
                        onChange={(e) => setCheckout(prev => ({ ...prev, deliveryPropertyType: e.target.value as 'house' | 'apartment' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                      >
                        <option value="house">Casa</option>
                        <option value="apartment">Departamento</option>
                      </select>
                    </div>

                    {/* Número de Casa/Calle */}
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold mb-1">Número de Casa/Calle *</label>
                      <input
                        type="text"
                        value={checkout.deliveryStreetNumber || ''}
                        onChange={(e) => setCheckout(prev => ({ ...prev, deliveryStreetNumber: e.target.value }))}
                        placeholder="Ej: 123, 456A"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                      />
                    </div>

                    {/* Número de Departamento (condicional) */}
                    {checkout.deliveryPropertyType === 'apartment' && (
                      <div>
                        <label className="block text-xs text-gray-600 font-semibold mb-1">Número de Departamento *</label>
                        <input
                          type="text"
                          value={checkout.deliveryApartmentNumber || ''}
                          onChange={(e) => setCheckout(prev => ({ ...prev, deliveryApartmentNumber: e.target.value }))}
                          placeholder="Ej: 201, 5B"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                        />
                      </div>
                    )}

                    {/* Referencias */}
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold mb-1">Referencias (Opcional)</label>
                      <input
                        type="text"
                        value={checkout.deliveryReferences || ''}
                        onChange={(e) => setCheckout(prev => ({ ...prev, deliveryReferences: e.target.value }))}
                        placeholder="Ej: Frente a farmacia, junto al árbol..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                      />
                    </div>

                    {/* Resumen dirección */}
                    <div className="bg-orange-50 rounded p-3 border border-orange-200">
                      <p className="text-xs text-orange-700 font-semibold">Dirección Completa:</p>
                      <p className="text-sm text-orange-900 font-bold mt-1">
                        {checkout.deliveryAddress} {checkout.deliveryStreetNumber && `#${checkout.deliveryStreetNumber}`} {checkout.deliveryPropertyType === 'apartment' && checkout.deliveryApartmentNumber && `Depto. ${checkout.deliveryApartmentNumber}`}
                      </p>
                      {checkout.deliveryReferences && <p className="text-xs text-orange-700 mt-1">Ref: {checkout.deliveryReferences}</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 3. Datos de Contacto (Oculto para Meseros) */}
            {!isWaiterFlow && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <Icon icon={Icons.user} size="sm" />
                  Datos de Contacto
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={checkout.customerName}
                      onChange={(e) => setCheckout(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Teléfono *</label>
                    <input
                      type="tel"
                      value={checkout.customerPhone}
                      onChange={(e) => setCheckout(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      value={checkout.customerEmail}
                      onChange={(e) => setCheckout(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Notas Especiales */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Icon icon={Icons.clipboard} size="sm" />
                Notas Especiales
              </h2>

              <textarea
                value={checkout.notes}
                onChange={(e) => setCheckout(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                placeholder="Instrucciones de entrega, alergias, etc."
                rows={3}
              />
            </div>

            {/* Botón Confirmar */}
            <button
              onClick={validateAndSubmit}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <Icon icon={Icons.spinner} size="sm" className="animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Icon icon={Icons.check} size="sm" />
                  {isWaiterFlow ? 'Enviar Pedido a Cocina' : 'Confirmar Pedido'}
                </>
              )}
            </button>
          </div>

          {/* Resumen del Carrito (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
              <h3 className="text-xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                <Icon icon={Icons.box} size="sm" />
                Resumen
              </h3>

              {/* Productos */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1 pr-2">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-gray-600">x{item.quantity}</p>
                      <div className="mt-1">
                        <input
                          type="text"
                          placeholder="Nota (ej. sin ají)"
                          value={item.notes || ''}
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toLocaleString('es-CL')}</p>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${subtotal.toLocaleString('es-CL')}</span>
                </div>
                {checkout.deliveryType === 'delivery' && (
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery:</span>
                    <span className="font-semibold">${deliveryFee.toLocaleString('es-CL')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-2xl font-black text-orange-600 pt-6 border-t border-gray-200">
                <span>Total:</span>
                <span>${total.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
