import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Icon, Icons } from '../utils/icons';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import api from '../lib/api';

interface Order {
  id: number;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_type: 'pickup' | 'delivery' | 'dine_in';
  delivery_address?: string;
  delivery_references?: string;
  delivery_street_number?: string;
  delivery_property_type?: 'house' | 'apartment';
  delivery_apartment_number?: string;
  delivery_fee: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  order_items: Array<{ 
    id: number;
    product_id: number; 
    quantity: number; 
    status: string;
    product?: {
      name: string;
      price: number;
    }
  }>;
  status: string;
  notes?: string;
  created_at: string;
  table_id?: number;
  waiter?: { name: string; username?: string; role?: string };
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, hasRole } = useAuth();
  const isWaiter = hasRole(['waiter']);
  const { setActiveOrderId, setTableId } = useCartStore();
  const [order, setOrder] = useState<Order | null>(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order && orderId) {
      fetchOrder();
    }
  }, [orderId, order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (err: any) {
      setError('No se pudo cargar el pedido');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Icon icon={Icons.spinner} size="lg" className="text-orange-600 mb-4" />
          <p className="text-gray-600">Cargando confirmación...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-8 text-center">
            <Icon icon={Icons.error} size="lg" className="text-red-600 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error || 'Pedido no encontrado'}</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-lg transition"
            >
              Volver al Menú
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const statusTranslation: { [key: string]: { label: string; color: string; icon: string } } = {
    pending: { label: 'Pendiente de Confirmación', color: 'yellow', icon: 'clock' },
    confirmed: { label: 'Confirmado', color: 'blue', icon: 'check' },
    preparing: { label: 'En Preparación', color: 'blue', icon: 'spinner' },
    ready: { label: 'Listo para Retiro', color: 'green', icon: 'check' },
    on_the_way: { label: 'En Camino', color: 'green', icon: 'check' },
    delivered: { label: 'Entregado', color: 'green', icon: 'check' },
    cancelled: { label: 'Cancelado', color: 'red', icon: 'error' }
  };

  const status = statusTranslation[order.status] || { label: 'Desconocido', color: 'gray', icon: 'info' };
  const statusColors: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-400',
    blue: 'bg-blue-100 text-blue-700 border-blue-400',
    green: 'bg-green-100 text-green-700 border-green-400',
    red: 'bg-red-100 text-red-700 border-red-400',
    gray: 'bg-gray-100 text-gray-700 border-gray-400'
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12">
        {/* Success Banner */}
        <div className="mb-12">
          <div className={`rounded-lg p-8 text-center border-2 ${statusColors[status.color]}`}>
            <div className="mb-4">
              <Icon icon={Icons.check} size="xl" />
            </div>
            <h1 className="text-4xl font-black mb-2">¡Pedido Confirmado!</h1>
            <p className="text-lg mb-4">Tu pedido ha sido recibido con éxito</p>
            <p className="text-3xl font-bold mb-2">#{order.order_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Order Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Detalles del Pedido</h2>

              {/* Status */}
              <div className={`rounded-lg p-4 mb-6 border-2 ${statusColors[status.color]}`}>
                <div className="flex items-center gap-2 font-semibold">
                  <Icon icon={Icons[status.icon as keyof typeof Icons]} size="sm" />
                  {status.label}
                </div>
              </div>

              {/* Customer Info / Table Info */}
              <div className="mb-8">
                {order.delivery_type === 'dine_in' ? (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                      <Icon icon={Icons.store} size="sm" />
                      Datos de la Mesa
                    </h3>
                    <div className="space-y-2 text-gray-700 text-sm">
                      <p><span className="font-semibold text-gray-900">Mesa:</span> {order.table_id}</p>
                      {order.waiter && <p><span className="font-semibold text-gray-900">Atendido por:</span> {order.waiter.name || order.waiter.username || 'Mesero'}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <Icon icon={Icons.user} size="sm" />
                      Datos de Contacto
                    </h3>
                    <div className="space-y-2 text-gray-700 text-sm">
                      <p><span className="font-semibold">Nombre:</span> {order.customer_name}</p>
                      <p><span className="font-semibold">Teléfono:</span> {order.customer_phone}</p>
                      {order.customer_email && <p><span className="font-semibold">Email:</span> {order.customer_email}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Type and Info */}
              {order.delivery_type !== 'dine_in' && (
                <div className="mb-8">
                  {order.delivery_type === 'pickup' ? (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Icon icon={Icons.store} size="sm" />
                        Tipo de Entrega
                      </h3>
                      <p className="text-sm text-gray-700">Retiro en Local - Retira tu pedido en nuestro restaurante Hazuki Quilín</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-4">
                        <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                          <Icon icon={Icons.car} size="sm" />
                          Tipo de Entrega
                        </h3>
                        <p className="text-sm text-gray-700">Entrega a Domicilio</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <Icon icon={Icons.location} size="sm" />
                          Datos de Entrega
                        </h3>
                        <div className="space-y-2 text-gray-700 text-sm">
                          <p><span className="font-semibold">Dirección Base:</span> {order.delivery_address}</p>
                          {order.delivery_property_type && <p><span className="font-semibold">Tipo:</span> {order.delivery_property_type === 'apartment' ? <><Icon icon={Icons.building} size="sm" className="inline text-gray-500 mr-1" /> Departamento</> : <><Icon icon={Icons.house} size="sm" className="inline text-gray-500 mr-1" /> Casa</>}</p>}
                          {order.delivery_street_number && <p><span className="font-semibold">Número:</span> {order.delivery_street_number}</p>}
                          {order.delivery_property_type === 'apartment' && order.delivery_apartment_number && <p><span className="font-semibold">Depto:</span> {order.delivery_apartment_number}</p>}
                          {order.delivery_references && <p><span className="font-semibold">Referencias:</span> {order.delivery_references}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-4">Productos</h3>
                <div className="space-y-3">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{item.product?.name || 'Producto Desconocido'}</p>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${((item.product?.price || 0) * item.quantity).toLocaleString('es-CL')}</p>
                          <p className="text-sm text-gray-600">${(item.product?.price || 0).toLocaleString('es-CL')} c/u</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No hay productos registrados en este pedido.</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-semibold text-blue-900 mb-2">Notas Especiales:</p>
                  <p className="text-blue-800">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-8 sticky top-20">
              <h3 className="text-xl font-bold mb-6">Resumen del Pago</h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${order.subtotal.toLocaleString('es-CL')}</span>
                </div>
                {order.delivery_type === 'delivery' && (
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery:</span>
                    <span className="font-semibold">${order.delivery_fee.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Descuento:</span>
                    <span className="font-semibold">-${order.discount_amount.toLocaleString('es-CL')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-2xl font-black text-orange-600 mb-8 pb-8 border-b border-gray-200">
                <span>Total:</span>
                <span>${order.total.toLocaleString('es-CL')}</span>
              </div>

              {order.delivery_type !== 'dine_in' && (
                <div className="space-y-3 mb-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-900 font-semibold flex items-center gap-2">
                    <Icon icon={Icons.info} size="sm" />
                    Próximos Pasos
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-orange-800">
                    <li>Recibirás una confirmación por teléfono</li>
                    <li>Preparamos tu pedido con cuidado</li>
                    <li>
                      {order.delivery_type === 'pickup'
                        ? 'Retira tu pedido en el horario indicado'
                        : 'Te lo entregaremos en tu dirección'}
                    </li>
                  </ol>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/mis-pedidos')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Icon icon={Icons.eye} size="sm" />
                  Ver Historial de Pedidos
                </button>
                <button
                  onClick={() => navigate('/menu')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Icon icon={Icons.cart} size="sm" />
                  Hacer Otro Pedido
                </button>
                {(isAdmin || isWaiter) && order.delivery_type === 'dine_in' && order.status !== 'cancelled' && order.status !== 'completed' && (
                  <button
                    onClick={() => {
                      setActiveOrderId(order.id);
                      setTableId(order.table_id || null);
                      navigate('/menu');
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Icon icon={Icons.plus} size="sm" />
                    Agregar más Platos a esta Mesa
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="w-full border-2 border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:border-gray-400 transition"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-700 mb-4">¿Necesitas ayuda con tu pedido?</p>
          <div className="space-y-2">
            <p className="font-semibold">Contacta a nuestro equipo:</p>
            <p className="text-orange-600 font-bold">+56 9 XXXX XXXX</p>
            <p className="text-gray-600">Abiertos: Lunes a Domingo 11:00 - 23:00</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
