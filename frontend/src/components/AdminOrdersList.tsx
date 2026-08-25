import { useEffect, useState, useMemo } from 'react';
import { Icon, Icons } from '../utils/icons';
import DeliveryMapModal from './DeliveryMapModal';
import { useOrderStore } from '../stores/orderStore';
import { Order } from '../types/models';

export default function AdminOrdersList() {
  const { orders, loading, error, fetchOrders, updateOrderStatus } = useOrderStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('no_response');
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  // When orders update, refresh selectedOrder to show real-time changes
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated && updated.status !== selectedOrder.status) {
        setSelectedOrder(updated);
      }
    }
  }, [orders]);

  const openCancelDialog = () => {
    setCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    setCancelDialogOpen(false);
  };

  const confirmCancel = async () => {
    if (!selectedOrder) return;
    await updateOrderStatus(selectedOrder.id, 'cancelled');
    closeCancelDialog();
  };

  const sendOrderViaWhatsApp = (order: Order) => {
    // Formatear el mensaje con el resumen del pedido
    let message = `*${order.customer_name}*, tu pedido ha sido recibido\n\n`;
    message += `*Número de Orden:* #${order.order_number}\n`;
    message += `*Estado:* Pendiente de Confirmación\n\n`;

    message += `*Productos:*\n`;
    (order.order_items && order.order_items.length > 0 ? order.order_items : order.items || []).forEach(item => {
      message += `• ${item.quantity}x ${item.product?.name || item.product_name} - $${((item.price || item.product?.price || 0) * item.quantity).toLocaleString('es-CL')}\n`;
    });

    message += `\n*Resumen:*\n`;
    message += `Subtotal: $${order.subtotal.toLocaleString('es-CL')}\n`;
    if (order.delivery_type === 'delivery') {
      message += `Delivery: $${order.delivery_fee.toLocaleString('es-CL')}\n`;
    }
    if (order.discount_amount > 0) {
      message += `Descuento: -$${order.discount_amount.toLocaleString('es-CL')}\n`;
    }
    message += `*Total: $${order.total.toLocaleString('es-CL')}*\n\n`;

    message += `*Tipo de Entrega:* ${order.delivery_type === 'pickup' ? 'Retiro en Local' : 'Entrega a Domicilio'}\n`;
    if (order.delivery_type === 'delivery' && order.delivery_address) {
      message += `*Dirección:* ${order.delivery_address}`;
      if (order.delivery_street_number) message += ` #${order.delivery_street_number}`;
      if (order.delivery_property_type === 'apartment' && order.delivery_apartment_number) {
        message += ` Depto. ${order.delivery_apartment_number}`;
      }
      message += `\n`;
      if (order.delivery_references) message += `*Referencias:* ${order.delivery_references}\n`;
    }

    if (order.notes) {
      message += `\n*Notas Especiales:* ${order.notes}\n`;
    }

    message += `\nConfirma que recibiste tu pedido ✓`;

    // Crear URL de WhatsApp
    const phoneNumber = order.customer_phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-400',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-400',
      preparing: 'bg-purple-100 text-purple-700 border-purple-400',
      ready: 'bg-green-100 text-green-700 border-green-400',
      on_the_way: 'bg-cyan-100 text-cyan-700 border-cyan-400',
      delivered: 'bg-emerald-100 text-emerald-700 border-emerald-400',
      cancelled: 'bg-red-100 text-red-700 border-red-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-400';
  };

  const statusLabels: { [key: string]: string } = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'En Preparación',
    ready: 'Listo',
    on_the_way: 'En Camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm)
    );
  }, [orders, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Icon icon={Icons.spinner} size="lg" className="inline mb-2" />
        <p className="text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon icon={Icons.info} size="lg" className="text-gray-400 mb-2" />
        <p className="text-gray-600">No hay pedidos aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <Icon icon={Icons.error} className="mr-2 inline" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-orange-600">Pedidos</h2>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar por N° orden, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent text-sm"
              />
              <Icon icon={Icons.search} size="sm" className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No se encontraron pedidos
              </div>
            ) : (
              filteredOrders.map(order => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                  selectedOrder?.id === order.id ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900">{order.order_number}</span>
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(order.status)}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{order.customer_name}</p>
                <p className="text-sm font-semibold text-orange-600">${order.total.toLocaleString('es-CL')}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</p>
              </button>
              ))
            )}
          </div>
        </div>

        {/* Order Details */}
        {selectedOrder && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Detalles del Pedido</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Número de Orden</p>
                <p className="text-lg font-bold text-orange-600">{selectedOrder.order_number}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold">Cliente</p>
                <p className="text-gray-900">{selectedOrder.customer_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                  <button
                    onClick={() => sendOrderViaWhatsApp(selectedOrder)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 rounded transition"
                    title="Enviar por WhatsApp"
                  >
                    <Icon icon={Icons.whatsapp} size="sm" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold">Tipo de Entrega</p>
                <p className="text-gray-900">
                  {selectedOrder.delivery_type === 'pickup' ? 'Retiro en Local' : 'Delivery a Domicilio'}
                </p>
              </div>

              {selectedOrder.delivery_type === 'delivery' && selectedOrder.delivery_address && (
                <>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold mb-2">Dirección de Entrega Completa</p>
                      <button
                        onClick={() => setMapModalOpen(true)}
                        className="w-full text-left p-3 bg-white rounded border border-blue-300 hover:bg-blue-100 transition"
                      >
                        <p className="text-gray-900 font-semibold text-sm flex items-center gap-1">
                          <Icon icon={Icons.location} size="sm" /> 
                          {selectedOrder.delivery_address}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Click para ver en el mapa</p>
                      </button>
                    </div>

                    {/* Mostrar tipo de propiedad y número */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600 font-semibold">Tipo de Propiedad</p>
                        <p className="text-sm font-bold text-gray-900">
                          {(selectedOrder as any).delivery_property_type === 'apartment' ? 'Departamento' : 'Casa'}
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600 font-semibold">Nº Dirección</p>
                        <p className="text-sm font-bold text-orange-600">
                          {(selectedOrder as any).delivery_street_number || 'N/A'}
                        </p>
                      </div>
                      {(selectedOrder as any).delivery_property_type === 'apartment' && (
                        <div className="bg-white rounded p-2 col-span-2">
                          <p className="text-xs text-gray-600 font-semibold">Nº Departamento</p>
                          <p className="text-sm font-bold text-orange-600">
                            {(selectedOrder as any).delivery_apartment_number || 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Referencias de ubicación */}
                    {(selectedOrder as any).delivery_references && (
                      <div className="bg-white rounded p-2 pt-2 border-t border-blue-200">
                        <p className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                          <Icon icon={Icons.location} size="sm" /> 
                          Referencias de Ubicación
                        </p>
                        <p className="text-sm text-gray-900 mt-1">{(selectedOrder as any).delivery_references}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-semibold">Distancia</p>
                      <p className="text-lg font-bold text-blue-800">
                        {selectedOrder.delivery_fee > 0 ? (
                          <>
                            {selectedOrder.delivery_fee >= 2200
                              ? ((selectedOrder.delivery_fee - 2000) / 200 * 0.13 + 1.5).toFixed(2)
                              : '1.5'
                            } km
                          </>
                        ) : '—'}
                      </p>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs text-orange-600 font-semibold">Tarifa Delivery</p>
                      <p className="text-lg font-bold text-orange-600">${selectedOrder.delivery_fee.toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                </>
              )}

              <div>
                <p className="text-sm text-gray-600 font-semibold">Productos ({(selectedOrder.order_items && selectedOrder.order_items.length > 0 ? selectedOrder.order_items : selectedOrder.items || []).length})</p>
                <div className="space-y-2 mt-2">
                  {(selectedOrder.order_items && selectedOrder.order_items.length > 0 ? selectedOrder.order_items : selectedOrder.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product?.name || item.product_name}</span>
                      <span className="font-semibold">${((item.price || item.product?.price || 0) * item.quantity).toLocaleString('es-CL')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas Especiales del Pedido */}
              {selectedOrder.notes && (
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
                  <p className="text-sm text-purple-700 font-bold mb-2 flex items-center gap-1">
                    <Icon icon={Icons.clipboard} size="sm" />
                    NOTAS ESPECIALES DEL PEDIDO
                  </p>
                  <p className="text-gray-900 text-sm bg-white p-2 rounded border border-purple-200">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold">Total</p>
                <p className="text-2xl font-bold text-orange-600">${selectedOrder.total.toLocaleString('es-CL')}</p>
              </div>

              <div className="pt-4 border-t">
                {selectedOrder.status === 'pending' && (
                  <>
                    <p className="text-sm text-gray-600 font-semibold mb-3">Acciones Rápidas</p>
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Icon icon={Icons.check} size="sm" />
                        Aceptar
                      </button>
                      <button
                        onClick={openCancelDialog}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Icon icon={Icons.error} size="sm" />
                        Rechazar
                      </button>
                    </div>
                  </>
                )}
                <p className="text-sm text-gray-600 font-semibold mb-3">Actualizar Estado</p>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as Order['status'])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="preparing">En Preparación</option>
                  <option value="ready">Listo</option>
                  {selectedOrder.delivery_type === 'delivery' && (
                    <option value="on_the_way">En Camino</option>
                  )}
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Dialog Modal */}
      {cancelDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-red-600">Cancelar Pedido</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                ¿Estás seguro de que deseas cancelar este pedido? ({selectedOrder?.order_number})
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Razón de Cancelación
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                >
                  <option value="no_response">Cliente no responde WhatsApp</option>
                  <option value="unavailable">Producto no disponible</option>
                  <option value="invalid_address">Dirección inválida</option>
                  <option value="other">Otra razón</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeCancelDialog}
                className="flex-1 border-2 border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:border-gray-400 transition"
              >
                No, Mantener
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition"
              >
                Sí, Cancelar
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
    </div>
  );
}
