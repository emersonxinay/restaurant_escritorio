import React, { useEffect, useState, useRef } from 'react';
import MainLayout from '../layouts/MainLayout';
import { OrderItemKDS } from '../services/kdsService';
import { useAudioNotification } from '../hooks/useAudioNotification';
import { PrintableTicket } from '../components/PrintableTicket';
import { useKdsStore } from '../stores/kdsStore';

const KDS: React.FC = () => {
  const { items, loading, error, fetchItems, updateItemStatus } = useKdsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { playNotificationSound, toggleMute, isMuted } = useAudioNotification();
  const [printingData, setPrintingData] = useState<{order: any, items: any[]}|null>(null);
  const prevPendingCountRef = useRef(0);

  // Group items by order
  const getGroupedOrders = (statusFilter: string[], desc = false) => {
    const query = searchQuery.toLowerCase().trim();
    const filteredItems = items.filter(i => {
      if (!statusFilter.includes(i.status)) return false;
      
      if (query) {
        const orderNum = i.order.order_number || '';
        const tableName = i.order.table ? `mesa ${i.order.table.number}` : i.order.delivery_type;
        const customerName = i.order.customer_name || '';
        const productName = i.product.name || '';
        
        return orderNum.toLowerCase().includes(query) || 
               tableName.toLowerCase().includes(query) ||
               customerName.toLowerCase().includes(query) ||
               productName.toLowerCase().includes(query);
      }
      return true;
    });
    const grouped = filteredItems.reduce((acc, item) => {
      if (!acc[item.order.id]) {
        acc[item.order.id] = {
          order: item.order,
          items: [],
          created_at: item.created_at,
          status: item.status // Use the status of the first item as the group status
        };
      }
      acc[item.order.id].items.push(item);
      return acc;
    }, {} as Record<number, { order: any, items: OrderItemKDS[], created_at: string, status: string }>);
    return Object.values(grouped).sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return desc ? -diff : diff;
    });
  };

  const handleUpdateOrderItemsStatus = async (orderItems: OrderItemKDS[], status: string, reason?: string) => {
    try {
      // Update all items in this order group
      await Promise.all(orderItems.map(item => updateItemStatus(item.id, status, reason)));
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const currentPendingCount = items.filter(i => i.status === 'pending').length;
    if (currentPendingCount > prevPendingCountRef.current) {
      playNotificationSound();
    }
    prevPendingCountRef.current = currentPendingCount;
  }, [items, playNotificationSound]);

  const handleUpdateStatus = async (id: number, status: string, reason?: string) => {
    try {
      await updateItemStatus(id, status, reason);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handlePrintComanda = (order: any, items: any[]) => {
    setPrintingData({ order, items });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (loading) return <MainLayout><div className="text-center py-10 font-bold">Cargando KDS...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="flex-1 p-2 md:p-6 h-[calc(100vh-280px)] min-h-[600px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-800">Panel de Cocina (KDS)</h1>
            <p className="text-gray-500 mt-1">Gestión de pedidos en tiempo real</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar pedido, mesa o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-lg border border-gray-300 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              onClick={toggleMute}
              className={`px-4 py-2 rounded-full font-bold text-sm ${isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}
            >
              {isMuted ? '🔇 Sonido Silenciado' : '🔊 Sonido Activado'}
            </button>
            <div className="flex gap-2">
              <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold border shadow-sm">
                Pendientes: {getGroupedOrders(['pending']).length}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          
          {/* Columna: Entrando (Pendientes) */}
          <div className="bg-gray-100 rounded-xl p-4 flex flex-col h-full min-h-0">
            <h2 className="font-bold text-gray-700 border-b-2 border-yellow-400 pb-2 mb-4 flex justify-between items-center shrink-0">
              Entrando
              <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">{getGroupedOrders(['pending']).length}</span>
            </h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {getGroupedOrders(['pending']).map(group => (
                <div key={group.order.id} className="bg-white rounded-lg shadow-sm border-l-4 border-yellow-400 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">Orden {group.order.order_number}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {new Date(group.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-gray-500">
                      {group.order.table ? `Mesa ${group.order.table.number}` : group.order.delivery_type}
                    </div>
                    <button 
                      onClick={() => handlePrintComanda(group.order, group.items)}
                      className="text-[10px] bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 font-bold"
                      title="Imprimir Comanda"
                    >
                      🖨️ Imprimir
                    </button>
                  </div>
                  {group.order.notes && (
                    <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded mb-2 font-semibold">
                      📝 Nota general: {group.order.notes}
                    </div>
                  )}
                  {group.order.order_items && group.order.order_items.length > group.items.length && (
                    <div className="bg-orange-100 text-orange-800 text-xs p-2 rounded mb-2 font-semibold flex items-center gap-1">
                      <span>⚠️</span> Comparte {group.order.order_items.length - group.items.length} ítem(s) con otra estación
                    </div>
                  )}
                  <div className="bg-yellow-50 p-2 rounded mb-3 space-y-2">
                    {group.items.map(item => (
                      <div key={item.id} className="border-b border-yellow-200 pb-2 last:border-0 last:pb-0">
                        <div className="font-bold text-gray-800 flex items-start justify-between">
                          <div className="flex items-start">
                            <span className="bg-gray-800 text-white rounded w-6 h-6 inline-flex items-center justify-center mr-2 text-sm shrink-0 mt-0.5">{item.quantity}x</span> 
                            <span>{item.product.name}</span>
                          </div>
                          <button onClick={() => handleUpdateStatus(item.id, 'accepted')} title="Aceptar solo este plato" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-bold ml-2 shrink-0">✓ Aceptar</button>
                        </div>
                        {item.notes && <div className="text-red-500 text-xs mt-1 font-medium italic ml-8">Nota: {item.notes}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateOrderItemsStatus(group.items, 'accepted')} className="flex-1 bg-blue-500 text-white py-2 rounded text-sm font-semibold hover:bg-blue-600">Aceptar Todo</button>
                    <button onClick={() => {
                      const reason = prompt("Razón de rechazo:");
                      if(reason) handleUpdateOrderItemsStatus(group.items, 'rejected', reason);
                    }} className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm font-semibold hover:bg-red-200">Rechazar</button>
                  </div>
                </div>
              ))}
              {getGroupedOrders(['pending']).length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">No hay pedidos nuevos</div>
              )}
            </div>
          </div>

          {/* Columna: En Preparación */}
          <div className="bg-gray-100 rounded-xl p-4 flex flex-col h-full min-h-0">
            <h2 className="font-bold text-gray-700 border-b-2 border-blue-400 pb-2 mb-4 flex justify-between items-center shrink-0">
              En Preparación
              <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">{getGroupedOrders(['accepted', 'preparing']).length}</span>
            </h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {getGroupedOrders(['accepted', 'preparing']).map(group => (
                <div key={group.order.id} className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${group.status === 'preparing' ? 'border-purple-500' : 'border-blue-400'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">Orden {group.order.order_number}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {new Date(group.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {group.order.customer_name && (
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Cliente: {group.order.customer_name}
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-gray-500">
                      {group.order.table ? `Mesa ${group.order.table.number}` : group.order.delivery_type}
                    </div>
                    <button 
                      onClick={() => handlePrintComanda(group.order, group.items)}
                      className="text-[10px] bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 font-bold"
                      title="Imprimir Comanda"
                    >
                      🖨️ Imprimir
                    </button>
                  </div>
                  {group.order.notes && (
                    <div className="bg-blue-100 text-blue-800 text-xs p-2 rounded mb-2 font-semibold">
                      📝 Nota general: {group.order.notes}
                    </div>
                  )}
                  {group.order.order_items && group.order.order_items.length > group.items.length && (
                    <div className="bg-orange-100 text-orange-800 text-xs p-2 rounded mb-2 font-semibold flex items-center gap-1">
                      <span>⚠️</span> Comparte {group.order.order_items.length - group.items.length} ítem(s) con otra estación
                    </div>
                  )}
                  <div className="bg-blue-50 p-2 rounded mb-3 space-y-2">
                    {group.items.map(item => (
                      <div key={item.id} className="border-b border-blue-200 pb-2 last:border-0 last:pb-0">
                        <div className="font-bold text-gray-800 flex items-start justify-between">
                          <div className="flex items-start">
                            <span className="bg-gray-800 text-white rounded w-6 h-6 inline-flex items-center justify-center mr-2 text-sm shrink-0 mt-0.5">{item.quantity}x</span> 
                            <span>{item.product.name}</span>
                          </div>
                          {item.status === 'accepted' ? (
                            <button onClick={() => handleUpdateStatus(item.id, 'preparing')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 font-bold ml-2 shrink-0">Cocinar</button>
                          ) : (
                            <button onClick={() => handleUpdateStatus(item.id, 'ready')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold ml-2 shrink-0">✓ Listo</button>
                          )}
                        </div>
                        {item.notes && <div className="text-red-500 text-xs mt-1 font-medium italic ml-8">Nota: {item.notes}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {group.status === 'accepted' ? (
                      <button onClick={() => handleUpdateOrderItemsStatus(group.items, 'preparing')} className="w-full bg-purple-500 text-white py-2 rounded text-sm font-semibold hover:bg-purple-600">Empezar a Cocinar Todo</button>
                    ) : (
                      <button onClick={() => handleUpdateOrderItemsStatus(group.items, 'ready')} className="w-full bg-green-500 text-white py-2 rounded text-sm font-semibold hover:bg-green-600">Todo Terminado (Listo)</button>
                    )}
                  </div>
                </div>
              ))}
              {getGroupedOrders(['accepted', 'preparing']).length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">Nada en preparación</div>
              )}
            </div>
          </div>

          {/* Columna: Listos */}
          <div className="bg-gray-100 rounded-xl p-4 flex flex-col h-full min-h-0">
            <h2 className="font-bold text-gray-700 border-b-2 border-green-400 pb-2 mb-4 flex justify-between items-center shrink-0">
              Listos (Esperando Mesero)
              <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">{getGroupedOrders(['ready']).length}</span>
            </h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {getGroupedOrders(['ready']).map(group => (
                <div key={group.order.id} className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">Orden {group.order.order_number}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {new Date(group.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {group.order.customer_name && (
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Cliente: {group.order.customer_name}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mb-2">
                    {group.order.table ? `Mesa ${group.order.table.number}` : group.order.delivery_type}
                  </div>
                  {group.order.notes && (
                    <div className="bg-green-100 text-green-800 text-xs p-2 rounded mb-2 font-semibold">
                      📝 Nota general: {group.order.notes}
                    </div>
                  )}
                  {group.order.order_items && group.order.order_items.length > group.items.length && (
                    <div className="bg-orange-100 text-orange-800 text-xs p-2 rounded mb-2 font-semibold flex items-center gap-1">
                      <span>⚠️</span> Comparte {group.order.order_items.length - group.items.length} ítem(s) con otra estación
                    </div>
                  )}
                  <div className="bg-green-50 p-2 rounded space-y-2">
                    {group.items.map(item => (
                      <div key={item.id} className="border-b border-green-200 pb-2 last:border-0 last:pb-0">
                        <div className="font-bold text-gray-800 flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="bg-gray-800 text-white rounded w-6 h-6 inline-flex items-center justify-center mr-2 text-sm shrink-0">{item.quantity}x</span> 
                            <span>{item.product.name}</span>
                          </div>
                          <button onClick={() => handleUpdateStatus(item.id, 'delivered')} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 font-bold ml-2 shrink-0">Entregar</button>
                        </div>
                        {item.notes && <div className="text-red-500 text-xs mt-1 font-medium italic ml-8">Nota: {item.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {getGroupedOrders(['ready']).length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">No hay platos listos pendientes de recoger</div>
              )}
            </div>
          </div>

          {/* Columna: Historial (Hoy) */}
          <div className="bg-gray-100 rounded-xl p-4 flex flex-col h-full min-h-0">
            <h2 className="font-bold text-gray-700 border-b-2 border-gray-400 pb-2 mb-4 flex justify-between items-center shrink-0">
              Historial (Hoy)
              <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">{getGroupedOrders(['delivered', 'rejected']).length}</span>
            </h2>
            <div className="space-y-4 opacity-75 flex-1 overflow-y-auto pr-1">
              {getGroupedOrders(['delivered', 'rejected'], true).map(group => (
                <div key={group.order.id} className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${group.status === 'rejected' ? 'border-red-500' : 'border-gray-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">Orden {group.order.order_number}</span>
                    <span className="text-xs text-white bg-gray-500 px-2 py-1 rounded">
                      {group.status === 'rejected' ? 'Rechazado' : 'Entregado'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    <div className="font-bold text-gray-700">
                      {group.order.customer_name ? group.order.customer_name : 'Sin nombre'} 
                      <span className="font-normal"> • {group.order.table ? `Mesa ${group.order.table.number}` : group.order.delivery_type}</span>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span>Recibido: {new Date(group.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {group.items[0]?.updated_at && (
                        <span>Entregado: {new Date(group.items[0].updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded space-y-2">
                    {group.items.map(item => (
                      <div key={item.id} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div className="font-bold text-gray-600 flex items-center">
                          <span className="bg-gray-400 text-white rounded w-6 h-6 inline-flex items-center justify-center mr-2 text-sm shrink-0">{item.quantity}x</span> 
                          <span className={item.status === 'rejected' ? 'line-through' : ''}>{item.product.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {getGroupedOrders(['delivered', 'rejected']).length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">No hay pedidos en el historial de hoy</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {printingData && <PrintableTicket order={printingData.order} itemsOverride={printingData.items} type="kitchen" stationName="COCINA / BARRA" />}
    </MainLayout>
  );
};

export default KDS;
