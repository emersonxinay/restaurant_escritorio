import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';
import { waiterAPI, WaiterStats } from '../services/waiterService';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout';
import { useCartStore } from '../stores/cartStore';
import { useNavigate } from 'react-router-dom';
import { useAudioNotification } from '../hooks/useAudioNotification';
import { useOrderStore } from '../stores/orderStore';
import { WaiterPaymentModal } from '../components/WaiterPaymentModal';

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
  active_order?: any;
}

interface OrderItemType {
  product?: { name: string; price: number };
  product_name?: string;
  price?: number;
  quantity: number;
}

export default function WaiterDashboard() {
  const { user } = useAuth();
  const { orders: globalOrders, fetchOrders, updateOrderStatusLocally } = useOrderStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [stats, setStats] = useState<WaiterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tables' | 'tracker' | 'stats' | 'approve'>('tables');
  const { clearCart, setTableId } = useCartStore();
  const navigate = useNavigate();
  const { playNotificationSound, isMuted, toggleMute } = useAudioNotification();
  const prevReadyCountRef = { current: 0 };
  const prevApproveCountRef = { current: 0 };
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Derived state
  const allOrders = globalOrders;
  const ordersToApprove = globalOrders.filter((o: any) => o.status === 'pending' && o.delivery_type === 'dine_in');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const readyOrdersCount = globalOrders.filter((o: any) => o.status === 'ready').length;
    
    if (ordersToApprove.length > prevApproveCountRef.current || readyOrdersCount > prevReadyCountRef.current) {
      playNotificationSound();
    }
    
    prevApproveCountRef.current = ordersToApprove.length;
    prevReadyCountRef.current = readyOrdersCount;
  }, [globalOrders, playNotificationSound]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchOrders();
      const [tablesRes, statsData] = await Promise.all([
        api.get('/tables'),
        waiterAPI.getStats()
      ]);
      setTables(tablesRes.data);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTable = (tableId: number) => {
    clearCart();
    setTableId(tableId);
    navigate('/menu');
  };

  const handleDeliverOrder = async (orderId: number) => {
    try {
      setLoading(true);
      await waiterAPI.updateOrderStatus(orderId, 'delivered');
      updateOrderStatusLocally(orderId, 'delivered');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverItem = async (itemId: number) => {
    try {
      setLoading(true);
      await api.patch(`/kds/items/${itemId}/status`, { status: 'delivered' });
      await fetchData(); // Refresh data
    } catch (err) {
      console.error(err);
      alert('Error al confirmar el plato.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (tableId: number) => {
    try {
      const response = await api.get(`/tables/${tableId}/active-order`);
      if (response.data && response.data.id) {
        setSelectedOrder(response.data);
      } else {
        alert('No se encontró un pedido activo para esta mesa.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al obtener el pedido: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <MainLayout><div className="text-center py-10 font-bold">Cargando dashboard...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <Icon icon={Icons.users} size="lg" className="text-orange-600" />
                Hola, {user?.name || user?.username}
              </h1>
              <p className="text-gray-500 mt-1">Panel de Control de Mesero</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleMute}
                className={`px-4 py-2 rounded-full font-bold text-sm ${isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}
              >
                {isMuted ? '🔇 Silenciado' : '🔊 Sonido'}
              </button>
              <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button 
                onClick={() => setActiveTab('approve')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors relative ${activeTab === 'approve' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Aprobar Pedidos (Mesas)
                {ordersToApprove.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {ordersToApprove.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'tables' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Mapa de Mesas
              </button>
              <button 
                onClick={() => setActiveTab('tracker')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'tracker' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Seguimiento (Kanban)
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'stats' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Mis Propinas e Historial
              </button>
              </div>
            </div>
          </div>

          {activeTab === 'approve' && (
            <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon icon={Icons.check} className="text-orange-500" /> 
                Aprobar Pedidos de Mesas
              </h2>
              {ordersToApprove.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Icon icon={Icons.check} size="2xl" className="mx-auto mb-3 opacity-20" />
                  <p>No hay pedidos de mesas pendientes de aprobación.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ordersToApprove.map(order => (
                    <div key={order.id} className="p-4 border rounded-lg flex flex-col gap-4 hover:bg-orange-50 transition-colors border-orange-200 bg-orange-50/30">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-lg text-gray-900 mb-1 flex items-center justify-between">
                            <div>
                              Orden #{order.order_number}
                              <span className="ml-2 text-sm font-normal text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                {order.delivery_type === 'dine_in' ? `Mesa ${order.table_id}` : order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}
                              </span>
                            </div>
                            <span className="text-xs font-normal bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1 border border-gray-200">
                              <Icon icon={Icons.users} className="w-3 h-3" />
                              {order.waiter?.name || order.customer_name || 'Desconocido'}
                            </span>
                          </div>
                          
                          {/* Order Details */}
                          <div className="text-sm text-gray-600 mb-3 space-y-1">
                            {order.customer_name && <p><span className="font-semibold text-gray-700">Cliente:</span> {order.customer_name}</p>}
                            {order.notes && (
                              <p><span className="font-semibold text-orange-700">Notas:</span> {order.notes}</p>
                            )}
                          </div>

                          {/* Items List */}
                          <div className="bg-white/60 p-3 rounded-md border border-orange-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Productos:</p>
                            <ul className="space-y-1">
                              {(order.order_items && order.order_items.length > 0 ? order.order_items : order.items || []).map((item: OrderItemType, idx: number) => (
                                <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                                  <span className="font-bold text-orange-600 min-w-[20px]">{item.quantity}x</span>
                                  <span>{item.product?.name || item.product_name || 'Producto'}</span>
                                </li>
                              ))}
                              {(!order.order_items || order.order_items.length === 0) && (!order.items || order.items.length === 0) && (
                                <li className="text-sm text-gray-500 italic">No hay productos registrados</li>
                              )}
                            </ul>
                          </div>

                          <div className="text-gray-900 font-black text-lg mt-3">Total: ${Number(order.total).toLocaleString()}</div>
                        </div>
                        
                        <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                          <button 
                            onClick={async () => {
                              try {
                                await api.put(`/orders/${order.id}/status`, { status: 'cancelled' });
                                alert('Pedido rechazado y cancelado.');
                                fetchData();
                              } catch (e: any) { alert(e.message); }
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors text-center"
                          >
                            Rechazar
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await api.put(`/orders/${order.id}/status`, { status: 'confirmed' });
                                alert('Pedido aprobado y enviado a cocina.');
                                fetchData();
                              } catch (e: any) { alert(e.message); }
                            }}
                            className="flex-1 sm:flex-none px-6 py-2 bg-orange-600 text-white font-bold rounded-lg shadow-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-center"
                          >
                            Aceptar y Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracker' && (
            <div className="bg-transparent">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Icon icon={Icons.menu} className="text-orange-500" /> 
                  Seguimiento Kanban de Pedidos
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
                {/* Columna: Entrando */}
                <div className="bg-gray-100 rounded-lg p-3 min-w-[250px]">
                  <h3 className="font-bold text-gray-700 border-b-2 border-yellow-400 pb-2 mb-3">
                    Entrando <span className="bg-gray-200 text-xs px-2 py-1 rounded-full float-right">{allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length}</span>
                  </h3>
                  <div className="space-y-3">
                    {allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').map(order => (
                      <div key={order.id} className="bg-white p-3 rounded shadow-sm border-l-4 border-yellow-400 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/order-confirmation/' + order.id)}>
                        <div className="font-bold flex justify-between items-start">
                          <span>{order.delivery_type === 'dine_in' ? `Mesa ${order.table_id}` : order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}</span>
                          <span className="text-[10px] font-normal bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-200 truncate max-w-[100px]" title={order.waiter?.name || order.customer_name || 'Desconocido'}>
                            <Icon icon={Icons.users} className="w-2 h-2 shrink-0" />
                            <span className="truncate">{order.waiter?.name || order.customer_name || 'Desconocido'}</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-xs text-gray-500">#{order.order_number}</div>
                          <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 
                            order.payment_status === 'partial' ? 'bg-blue-100 text-blue-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.payment_status === 'paid' ? 'Pagado' : order.payment_status === 'partial' ? 'Parcial' : 'Pendiente Pago'}
                          </div>
                        </div>
                        <div className="my-2 bg-gray-50 p-2 rounded text-xs space-y-1 border border-gray-100">
                          {(order.order_items && order.order_items.length > 0 ? order.order_items : order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center gap-1 border-b border-gray-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                              <div className="flex gap-1">
                                <span className="font-bold text-gray-700">{item.quantity}x</span>
                                <span className={`text-gray-800 line-clamp-1 ${item.status === 'delivered' ? 'line-through text-gray-400' : ''}`}>{item.product?.name || item.product_name || 'Producto'}</span>
                              </div>
                              <div className="flex shrink-0">
                                {item.status === 'ready' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeliverItem(item.id); }} className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600 font-bold">Recibir</button>
                                )}
                                {item.status === 'delivered' && (
                                  <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded font-bold">✓ Listo</span>
                                )}
                                {item.status === 'preparing' && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">Cocinando</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {order.notes && (
                            <div className="mt-1 pt-1 border-t border-orange-100">
                              <span className="text-orange-700 font-bold">Nota: </span>
                              <span className="text-orange-600 italic break-words">{order.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] text-gray-500 mb-2 flex flex-col gap-0.5 px-1">
                          <div className="flex justify-between">
                            <span>Creación:</span>
                            <span>{order.created_at ? new Date(order.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                          </div>
                          {(order.status === 'preparing' || order.status === 'ready' || order.status === 'delivered') && order.updated_at && (
                            <div className="flex justify-between">
                              <span>Cocina/Barra:</span>
                              <span>{new Date(order.updated_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs bg-yellow-100 text-yellow-800 inline-block px-2 rounded mt-1">Esperando Cocina</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna: Preparando */}
                <div className="bg-gray-100 rounded-lg p-3 min-w-[250px]">
                  <h3 className="font-bold text-gray-700 border-b-2 border-blue-400 pb-2 mb-3">
                    Preparando <span className="bg-gray-200 text-xs px-2 py-1 rounded-full float-right">{allOrders.filter(o => o.status === 'preparing').length}</span>
                  </h3>
                  <div className="space-y-3">
                    {allOrders.filter(o => o.status === 'preparing').map(order => (
                      <div key={order.id} className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-400 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/order-confirmation/' + order.id)}>
                        <div className="font-bold flex justify-between items-start">
                          <span>{order.delivery_type === 'dine_in' ? `Mesa ${order.table_id}` : order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}</span>
                          <span className="text-[10px] font-normal bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-200 truncate max-w-[100px]" title={order.waiter?.name || order.customer_name || 'Desconocido'}>
                            <Icon icon={Icons.users} className="w-2 h-2 shrink-0" />
                            <span className="truncate">{order.waiter?.name || order.customer_name || 'Desconocido'}</span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">#{order.order_number}</div>
                        <div className="my-2 bg-gray-50 p-2 rounded text-xs space-y-1 border border-gray-100">
                          {(order.order_items && order.order_items.length > 0 ? order.order_items : order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center gap-1 border-b border-gray-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                              <div className="flex gap-1">
                                <span className="font-bold text-gray-700">{item.quantity}x</span>
                                <span className={`text-gray-800 line-clamp-1 ${item.status === 'delivered' ? 'line-through text-gray-400' : ''}`}>{item.product?.name || item.product_name || 'Producto'}</span>
                              </div>
                              <div className="flex shrink-0">
                                {item.status === 'ready' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeliverItem(item.id); }} className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600 font-bold">Recibir</button>
                                )}
                                {item.status === 'delivered' && (
                                  <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded font-bold">✓ Listo</span>
                                )}
                                {item.status === 'preparing' && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">Cocinando</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {order.notes && (
                            <div className="mt-1 pt-1 border-t border-orange-100">
                              <span className="text-orange-700 font-bold">Nota: </span>
                              <span className="text-orange-600 italic break-words">{order.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs bg-blue-100 text-blue-800 inline-block px-2 rounded mt-1">En Cocina/Barra</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna: Listos */}
                <div className="bg-gray-100 rounded-lg p-3 min-w-[250px]">
                  <h3 className="font-bold text-gray-700 border-b-2 border-green-500 pb-2 mb-3">
                    Listos <span className="bg-gray-200 text-xs px-2 py-1 rounded-full float-right">{allOrders.filter(o => o.status === 'ready').length}</span>
                  </h3>
                  <div className="space-y-3">
                    {allOrders.filter(o => o.status === 'ready').map(order => (
                      <div key={order.id} className="bg-white p-3 rounded shadow-sm border-l-4 border-green-500 relative cursor-pointer hover:shadow-md transition" onClick={() => navigate('/order-confirmation/' + order.id)}>
                        <div className="font-bold flex justify-between items-start">
                          <span>{order.delivery_type === 'dine_in' ? `Mesa ${order.table_id}` : order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}</span>
                          <span className="text-[10px] font-normal bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-200 truncate max-w-[100px]" title={order.waiter?.name || order.customer_name || 'Desconocido'}>
                            <Icon icon={Icons.users} className="w-2 h-2 shrink-0" />
                            <span className="truncate">{order.waiter?.name || order.customer_name || 'Desconocido'}</span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">#{order.order_number}</div>
                        <div className="my-2 bg-gray-50 p-2 rounded text-xs space-y-1 border border-gray-100">
                          {(order.order_items && order.order_items.length > 0 ? order.order_items : order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center gap-1 border-b border-gray-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                              <div className="flex gap-1">
                                <span className="font-bold text-gray-700">{item.quantity}x</span>
                                <span className={`text-gray-800 line-clamp-1 ${item.status === 'delivered' ? 'line-through text-gray-400' : ''}`}>{item.product?.name || item.product_name || 'Producto'}</span>
                              </div>
                              <div className="flex shrink-0">
                                {item.status === 'ready' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeliverItem(item.id); }} className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600 font-bold">Recibir</button>
                                )}
                                {item.status === 'delivered' && (
                                  <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded font-bold">✓ Listo</span>
                                )}
                                {item.status === 'preparing' && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">Cocinando</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {order.notes && (
                            <div className="mt-1 pt-1 border-t border-orange-100">
                              <span className="text-orange-700 font-bold">Nota: </span>
                              <span className="text-orange-600 italic break-words">{order.notes}</span>
                            </div>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeliverOrder(order.id); }} className="w-full bg-green-500 text-white text-xs font-bold py-1 rounded hover:bg-green-600 transition">Marcar Entregado</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna: Historial */}
                <div className="bg-gray-100 rounded-lg p-3 min-w-[250px]">
                  <h3 className="font-bold text-gray-700 border-b-2 border-gray-400 pb-2 mb-3">
                    Historial (Hoy) <span className="bg-gray-200 text-xs px-2 py-1 rounded-full float-right">{allOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled').length}</span>
                  </h3>
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {allOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled').map(order => (
                      <div key={order.id} className={`bg-white p-3 rounded shadow-sm border-l-4 ${order.status === 'delivered' ? 'border-gray-400 opacity-75' : 'border-red-500'}`}>
                        <div className="font-bold flex justify-between">
                          <span className="flex flex-col">
                            <span>{order.delivery_type === 'dine_in' ? `Mesa ${order.table_id}` : order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}</span>
                            <span className="text-[10px] font-normal bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-200 w-max mt-1" title={order.waiter?.name || order.customer_name || 'Desconocido'}>
                              <Icon icon={Icons.users} className="w-2 h-2 shrink-0" />
                              <span className="truncate max-w-[80px]">{order.waiter?.name || order.customer_name || 'Desconocido'}</span>
                            </span>
                          </span>
                          <span className={`text-xs px-1 rounded h-max ${order.status === 'delivered' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'}`}>{order.status === 'delivered' ? 'Entregado' : 'Rechazado/Cancelado'}</span>
                        </div>
                        <div className="flex justify-between items-start mb-1 mt-1">
                          <div className="text-xs text-gray-500">#{order.order_number}</div>
                          <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 
                            order.payment_status === 'partial' ? 'bg-blue-100 text-blue-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.payment_status === 'paid' ? 'Pagado' : order.payment_status === 'partial' ? 'Parcial' : 'Pendiente Pago'}
                          </div>
                        </div>
                        
                        {/* Check for rejected reasons in items */}
                        {order.status === 'cancelled' && order.order_items?.some((i:any) => i.status === 'rejected') && (
                          <div className="text-xs bg-red-50 text-red-800 p-1 mt-1 rounded border border-red-100">
                            <strong>Motivos de rechazo:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {order.order_items.filter((i:any) => i.status === 'rejected' && i.rejected_reason).map((i:any, idx:number) => (
                                <li key={idx}>{i.product?.name}: {i.rejected_reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="my-2 bg-gray-50 p-2 rounded text-xs space-y-1 border border-gray-100">
                          {(order.order_items && order.order_items.length > 0 ? order.order_items : order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center gap-1 border-b border-gray-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                              <div className="flex gap-1">
                                <span className="font-bold text-gray-700">{item.quantity}x</span>
                                <span className={`text-gray-800 line-clamp-1 ${item.status === 'delivered' ? 'line-through text-gray-400' : ''}`}>{item.product?.name || item.product_name || 'Producto'}</span>
                              </div>
                              <div className="flex shrink-0">
                                {item.status === 'ready' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeliverItem(item.id); }} className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600 font-bold">Recibir</button>
                                )}
                                {item.status === 'delivered' && (
                                  <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded font-bold">✓ Listo</span>
                                )}
                                {item.status === 'preparing' && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">Cocinando</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {order.notes && (
                            <div className="mt-1 pt-1 border-t border-gray-200">
                              <span className="text-gray-700 font-bold">Nota: </span>
                              <span className="text-gray-600 italic break-words">{order.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] text-gray-500 mb-2 flex flex-col gap-0.5 px-1">
                          <div className="flex justify-between">
                            <span>Creación:</span>
                            <span>{order.created_at ? new Date(order.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                          </div>
                          {(order.status === 'preparing' || order.status === 'ready' || order.status === 'delivered') && order.updated_at && (
                            <div className="flex justify-between">
                              <span>Cocina/Barra:</span>
                              <span>{new Date(order.updated_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {tables.map(table => (
                <div 
                  key={table.id} 
                  className={`rounded-2xl shadow-lg p-6 text-center cursor-pointer transition-transform hover:scale-105 border-t-8 ${
                    table.status === 'available' ? 'border-green-500 bg-white' :
                    table.status === 'occupied' ? 'border-red-500 bg-red-50' : 'border-gray-500 bg-gray-100'
                  }`}
                >
                  <div className="text-4xl mb-2">🍽️</div>
                  <h3 className="text-2xl font-black text-gray-800">Mesa {table.number}</h3>
                  <p className="text-sm text-gray-500 mt-1">Sillas: {table.capacity}</p>
                  
                  {table.status !== 'available' && table.active_order && (
                    <div className="mt-2 text-xs font-bold px-2 py-1 rounded bg-white bg-opacity-50 text-gray-700">
                      {table.active_order.status !== 'delivered' && table.active_order.payment_status !== 'paid' 
                        ? '⏳ Falta Cocina/Entrega y Pago' 
                        : table.active_order.status !== 'delivered' 
                          ? '⏳ Falta Cocina/Entrega' 
                          : '⏳ Falta Pago (Caja)'}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    {table.status === 'available' ? (
                      <button 
                        onClick={() => handleOpenTable(table.id)}
                        className="bg-green-100 text-green-700 font-bold px-4 py-2 rounded-lg w-full text-sm hover:bg-green-200 transition-colors"
                      >
                        Abrir Mesa
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleViewOrder(table.id)}
                        className="bg-red-100 text-red-700 font-bold px-4 py-2 rounded-lg w-full text-sm hover:bg-red-200 transition-colors"
                      >
                        Ver Pedido
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tables.length === 0 && <p className="col-span-full text-center text-gray-500 text-lg">No hay mesas configuradas. Habla con el administrador.</p>}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Stats Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center">
                  <div className="bg-green-100 text-green-600 p-4 rounded-full mr-4">
                    <Icon icon={Icons.dollar} size="xl" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Propinas de Hoy</p>
                    <p className="text-3xl font-black text-gray-800">${stats.total_tips.toFixed(2)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center">
                  <div className="bg-blue-100 text-blue-600 p-4 rounded-full mr-4">
                    <Icon icon={Icons.checkCircle} size="xl" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Pedidos Completados</p>
                    <p className="text-3xl font-black text-gray-800">{stats.completed_orders_count}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center">
                  <div className="bg-orange-100 text-orange-600 p-4 rounded-full mr-4">
                    <Icon icon={Icons.document} size="xl" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Pedidos Tomados</p>
                    <p className="text-3xl font-black text-gray-800">{stats.orders_count}</p>
                  </div>
                </div>
              </div>

              {/* Recent Orders History */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">Historial Reciente (Hoy)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                      <tr>
                        <th className="px-6 py-3 font-medium">N° Pedido</th>
                        <th className="px-6 py-3 font-medium">Mesa/Tipo</th>
                        <th className="px-6 py-3 font-medium">Estado</th>
                        <th className="px-6 py-3 font-medium text-right">Total</th>
                        <th className="px-6 py-3 font-medium text-right">Propina</th>
                        <th className="px-6 py-3 font-medium text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.recent_orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{order.order_number}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {order.table ? `Mesa ${order.table.number}` : order.delivery_type}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium">${order.total}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">
                            ${order.tip_amount ? Number(order.tip_amount).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {order.status === 'ready' && (
                              <button 
                                onClick={() => handleDeliverOrder(order.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-xs transition"
                              >
                                Entregar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {stats.recent_orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No has tomado ningún pedido hoy.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Mesa {selectedOrder.table_id || 'N/A'}</h2>
                <p className="text-sm font-semibold text-orange-600 mt-1">Pedido #{selectedOrder.order_number}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <Icon icon={Icons.close} size="lg" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Detalles del Pedido</h3>
              <div className="space-y-4">
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-sm mr-2">{item.quantity}x</span>
                        {item.product?.name || item.product_name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Estado: <span className={`font-semibold ${
                          item.status === 'delivered' ? 'text-green-600' :
                          item.status === 'ready' ? 'text-blue-600' :
                          'text-orange-500'
                        }`}>{item.status.toUpperCase()}</span>
                      </p>
                    </div>
                    <div className="font-bold text-gray-900">
                      ${(item.quantity * (item.price || item.product?.price || 0)).toLocaleString('es-CL')}
                    </div>
                  </div>
                ))}
                {(!selectedOrder.order_items || selectedOrder.order_items.length === 0) && (
                  <p className="text-gray-500 italic">No hay productos en este pedido.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-gray-600 font-bold">Total del Pedido</span>
              <span className="text-3xl font-black text-orange-600">${Number(selectedOrder.total || 0).toLocaleString('es-CL')}</span>
            </div>
            
            <div className="p-4 bg-white border-t border-gray-100 grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition"
              >
                Cerrar Modal
              </button>
              <button
                onClick={() => {
                  navigate(`/order-confirmation/${selectedOrder.id}`);
                }}
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition"
              >
                Ver Comanda / Recibo
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
              >
                Cobrar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedOrder && (
        <WaiterPaymentModal
          order={selectedOrder}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
            fetchData();
            // Assuming websocket handles order state updates to close this gracefully if needed
          }}
        />
      )}
    </MainLayout>
  );
}
