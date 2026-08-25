import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';
import { useAuth } from '../hooks/useAuth';
import DeliveryMapModal from '../components/DeliveryMapModal';
import { socket } from '../lib/socket';

import { Order } from '../types/models';

export default function MyOrders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [repeatOrderOpen, setRepeatOrderOpen] = useState(false);
  const [orderToRepeat, setOrderToRepeat] = useState<Order | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      (order.table_id && order.table_id.toString().includes(q)) ||
      (order.waiter && order.waiter.name.toLowerCase().includes(q)) ||
      (order.cashier && order.cashier.name.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();

    // Listen for real-time updates for my orders
    const handleOrderUpdate = (updatedOrder: Order) => {
      setOrders(prev => {
        // Only update if it belongs to the current user's list
        if (prev.some(o => o.id === updatedOrder.id)) {
          return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        }
        return prev;
      });
    };

    socket.on('order_updated', handleOrderUpdate);

    return () => {
      socket.off('order_updated', handleOrderUpdate);
    };
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my');
      setOrders(response.data.orders);
    } catch (err: any) {
      setError('Error al cargar tus pedidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRepeatOrderDialog = (order: Order) => {
    setOrderToRepeat(order);
    setRepeatOrderOpen(true);
  };

  const closeRepeatOrderDialog = () => {
    setRepeatOrderOpen(false);
    setOrderToRepeat(null);
  };

  const repeatOrder = () => {
    if (!orderToRepeat) return;

    // Prepara los datos del nuevo pedido con los items del pedido anterior
    const newOrderData = {
      customer_name: orderToRepeat.customer_name,
      customer_phone: orderToRepeat.customer_phone,
      customer_email: orderToRepeat.customer_email,
      delivery_type: orderToRepeat.delivery_type,
      delivery_address: orderToRepeat.delivery_address,
      delivery_lat: orderToRepeat.delivery_lat,
      delivery_lng: orderToRepeat.delivery_lng,
      items: (orderToRepeat.order_items && orderToRepeat.order_items.length > 0 ? orderToRepeat.order_items : (orderToRepeat as any).items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product?.name || item.product_name,
        price: item.product?.price || item.price,
        quantity: item.quantity,
        notes: item.notes
      })),
      notes: orderToRepeat.notes
    };

    // Navega al checkout con los datos precargados
    navigate('/checkout', { state: { prefilledOrder: newOrderData } });
    closeRepeatOrderDialog();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; bgColor: string; textColor: string; icon: string } } = {
      pending: { label: 'Pendiente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', icon: 'clock' },
      confirmed: { label: 'Confirmado', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: 'check' },
      preparing: { label: 'En Preparación', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: 'spinner' },
      ready: { label: 'Listo para Retiro', bgColor: 'bg-green-100', textColor: 'text-green-700', icon: 'check' },
      on_the_way: { label: 'En Camino', bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: 'check' },
      delivered: { label: 'Entregado', bgColor: 'bg-green-100', textColor: 'text-green-700', icon: 'check' },
      cancelled: { label: 'Cancelado', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: 'error' }
    };

    const config = statusConfig[status] || { label: 'Desconocido', bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: 'info' };

    return (
      <span className={`${config.bgColor} ${config.textColor} text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1`}>
        <Icon icon={Icons[config.icon as keyof typeof Icons]} size="xs" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Icon icon={Icons.spinner} size="lg" className="inline mb-4 animate-spin" />
          <p className="text-gray-600 text-lg">Cargando tus pedidos...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-orange-600">
          Mis Pedidos
        </h1>
        <p className="text-gray-600 text-lg">
          Aquí puedes ver el historial y estado de todos tus pedidos
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-start gap-3">
          <Icon icon={Icons.error} size="sm" className="mt-1 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Icon icon={Icons.cart} size="lg" className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-6">No tienes pedidos aún</p>
          <button
            onClick={() => navigate('/menu')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
          >
            <Icon icon={Icons.cart} size="sm" />
            Ir al Menú
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col max-h-[800px]">
              <div className="p-4 md:p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-orange-600 mb-4">Tus Pedidos ({filteredOrders.length})</h2>
                <div className="relative">
                  <Icon icon={Icons.search} size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, mesa, personal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="divide-y overflow-y-auto flex-1 min-h-0">
                {filteredOrders.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No se encontraron pedidos
                  </div>
                ) : (
                  filteredOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition border-l-4 ${
                      order.delivery_type === 'pickup' ? 'border-l-purple-500' :
                      order.delivery_type === 'delivery' ? 'border-l-blue-500' :
                      'border-l-green-500'
                    } ${
                      selectedOrder?.id === order.id ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          #{order.order_number}
                          {order.table_id && (
                            <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Mesa {order.table_id}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">{formatDate(order.created_at)}</p>
                        
                        <div className="bg-white/50 rounded p-2 border border-gray-100 space-y-1">
                          <p className="text-sm text-gray-800 flex items-center gap-1.5">
                            <Icon icon={Icons.user} size="xs" className="text-gray-400" />
                            <span className="font-bold text-xs uppercase tracking-wider text-gray-500">Cliente:</span> 
                            <span className="font-medium">{order.customer_name}</span>
                          </p>
                          {(order.waiter || order.cashier) && (
                            <div className="pt-1 mt-1 border-t border-gray-100/80">
                              {order.waiter && (
                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                  <Icon icon={Icons.users} size="xs" className="text-gray-400" />
                                  <span className="font-bold uppercase tracking-wider text-gray-500">Mesero:</span> {order.waiter.name}
                                </p>
                              )}
                              {order.cashier && (
                                <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                                  <Icon icon={Icons.creditCard} size="xs" className="text-gray-400" />
                                  <span className="font-bold uppercase tracking-wider text-gray-500">Caja:</span> {order.cashier.name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-orange-600 font-semibold">${order.total.toLocaleString('es-CL')}</p>
                  </button>
                )))}
              </div>
            </div>
          </div>

          {/* Order Details */}
          {selectedOrder && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Detalles del Pedido</h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-semibold mb-2">Número de Pedido</p>
                    <p className="text-lg font-bold text-orange-600">#{selectedOrder.order_number}</p>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <Icon icon={Icons.user} size="sm" />
                      Datos de Contacto
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Nombre:</span> {selectedOrder.customer_name}</p>
                      <p><span className="font-semibold">Teléfono:</span> {selectedOrder.customer_phone}</p>
                      {selectedOrder.customer_email && <p><span className="font-semibold">Email:</span> {selectedOrder.customer_email}</p>}
                    </div>
                  </div>

                  {/* Staff Info */}
                  {(selectedOrder.waiter || selectedOrder.cashier) && (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                        <Icon icon={Icons.users} size="sm" />
                        Personal de Servicio
                      </h3>
                      <div className="space-y-2 text-sm">
                        {selectedOrder.waiter && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold w-16">Mesero:</span> 
                            <span className="bg-white px-2 py-1 rounded border border-orange-100">{selectedOrder.waiter.name}</span>
                          </p>
                        )}
                        {selectedOrder.cashier && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold w-16">Cajero:</span> 
                            <span className="bg-white px-2 py-1 rounded border border-orange-100">{selectedOrder.cashier.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Type Info */}
                  {selectedOrder.delivery_type === 'pickup' ? (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Icon icon={Icons.store} size="sm" />
                        Tipo de Entrega
                      </h3>
                      <p className="text-sm text-gray-700">Retiro en Local - Retira tu pedido en nuestro restaurante Hazuki Quilín</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                          <Icon icon={Icons.car} size="sm" />
                          Tipo de Entrega
                        </h3>
                        <p className="text-sm text-gray-700">Entrega a Domicilio</p>
                      </div>

                      {/* Delivery Address Info */}
                      {selectedOrder.delivery_address && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Icon icon={Icons.location} size="sm" />
                            Datos de Entrega
                          </h3>

                          <button
                            onClick={() => setMapModalOpen(true)}
                            className="w-full text-left p-3 bg-white rounded border border-gray-300 hover:bg-orange-50 transition"
                          >
                            <p className="text-sm text-gray-900 font-semibold">Dirección Base: {selectedOrder.delivery_address}</p>
                            <p className="text-xs text-orange-600 mt-1">Click para ver en el mapa con ruta</p>
                          </button>

                          <div className="space-y-2 text-sm">
                            <p><span className="font-semibold">Tipo:</span> {(selectedOrder as any).delivery_property_type === 'apartment' ? <><Icon icon={Icons.building} size="sm" className="inline text-gray-500 mr-1" /> Departamento</> : <><Icon icon={Icons.house} size="sm" className="inline text-gray-500 mr-1" /> Casa</>}</p>
                            <p><span className="font-semibold">Número:</span> {(selectedOrder as any).delivery_street_number || 'N/A'}</p>
                            {(selectedOrder as any).delivery_property_type === 'apartment' && (
                              <p><span className="font-semibold">Depto:</span> {(selectedOrder as any).delivery_apartment_number || 'N/A'}</p>
                            )}
                            {selectedOrder.delivery_references && (
                              <p><span className="font-semibold">Referencias:</span> {selectedOrder.delivery_references}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Items */}
                  <div>
                    <p className="font-bold text-lg mb-4">Productos</p>
                    <div className="space-y-2">
                      {(selectedOrder.order_items && selectedOrder.order_items.length > 0 ? selectedOrder.order_items : selectedOrder.items || []).map((item, idx) => (
                        <div key={idx} className="flex flex-col p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {item.quantity}x {(item as any).product?.name || (item as any).product_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                ${((item as any).product?.price || (item as any).price || 0).toLocaleString()}
                              </p>
                            </div>
                            <p className="font-semibold text-orange-600">${(((item as any).product?.price || (item as any).price || 0) * item.quantity).toLocaleString('es-CL')}</p>
                          </div>
                          {(item as any).notes && (
                            <p className="text-xs text-red-500 italic mt-1">Nota: {(item as any).notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-semibold text-blue-900 mb-2">Notas:</p>
                      <p className="text-blue-800">{selectedOrder.notes}</p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="border-t pt-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal:</span>
                        <span className="font-semibold">${selectedOrder.subtotal.toLocaleString('es-CL')}</span>
                      </div>
                      {selectedOrder.delivery_type === 'delivery' && selectedOrder.delivery_fee > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Delivery:</span>
                          <span className="font-semibold">${selectedOrder.delivery_fee.toLocaleString('es-CL')}</span>
                        </div>
                      )}
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Descuento:</span>
                          <span className="font-semibold">-${selectedOrder.discount_amount.toLocaleString('es-CL')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-2xl font-black text-orange-600">
                      <span>Total:</span>
                      <span>${selectedOrder.total.toLocaleString('es-CL')}</span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500">
                      Creado: {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => openRepeatOrderDialog(selectedOrder)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Icon icon={Icons.cart} size="sm" />
                      Repetir Pedido
                    </button>
                    <button
                      onClick={() => navigate(`/order-confirmation/${selectedOrder.id}`)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Icon icon={Icons.info} size="sm" />
                      Ver Detalles Completos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Repeat Order Confirmation Dialog */}
      {repeatOrderOpen && orderToRepeat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-green-600">Repetir Pedido</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                ¿Deseas repetir el pedido #{orderToRepeat.order_number}?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                <p className="text-sm font-semibold text-gray-700 mb-3">Productos ({(orderToRepeat.order_items || (orderToRepeat as any).items || []).length}):</p>
                <ul className="space-y-2">
                  {(orderToRepeat.order_items && orderToRepeat.order_items.length > 0 ? orderToRepeat.order_items : (orderToRepeat as any).items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>{item.quantity}x {item.product?.name || item.product_name}</span>
                        <span className="font-medium">${((item.product?.price || item.price || 0) * item.quantity).toLocaleString('es-CL')}</span>
                      </div>
                      {item.notes && <span className="text-xs text-red-500 italic mt-0.5">Nota: {item.notes}</span>}
                    </div>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Total:</strong> ${orderToRepeat.total.toLocaleString('es-CL')}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeRepeatOrderDialog}
                className="flex-1 border-2 border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:border-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={repeatOrder}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition"
              >
                Repetir Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Map Modal */}
      {selectedOrder && selectedOrder.delivery_type === 'delivery' && (
        <DeliveryMapModal
          isOpen={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          deliveryLat={selectedOrder.delivery_lat}
          deliveryLng={selectedOrder.delivery_lng}
          address={selectedOrder.delivery_address || 'Dirección de entrega'}
          distance={selectedOrder.delivery_fee > 0 ? (
            selectedOrder.delivery_fee >= 2200
              ? ((selectedOrder.delivery_fee - 2000) / 200 * 0.13 + 1.5)
              : 1.5
          ) : 0}
        />
      )}
    </MainLayout>
  );
}
