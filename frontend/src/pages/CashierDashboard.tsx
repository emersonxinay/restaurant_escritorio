import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';
import { CashierReport, cashierAPI } from '../services/cashierService';
import { CashRegisterControl } from '../components/CashRegisterControl';
import MainLayout from '../layouts/MainLayout';
import { useAudioNotification } from '../hooks/useAudioNotification';
import { PrintableTicket } from '../components/PrintableTicket';
import CashierPOS from '../components/CashierPOS';
import { useOrderStore } from '../stores/orderStore';

interface OrderItemType {
  product?: { name: string; price: number };
  product_name?: string;
  price?: number;
  quantity: number;
  status?: string;
  notes?: string;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
}

interface Order {
  id: number;
  order_number: string;
  table_id: number;
  total: number;
  payment_status: string;
  status: string;
  delivery_type: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  notes?: string;
  order_items?: OrderItemType[];
  items?: OrderItemType[];
  payments?: Payment[];
  created_at?: string;
  waiter?: { name: string; username: string; role?: string };
  cashier?: { name: string; username: string; role?: string };
}

export default function CashierDashboard() {
  const { orders: globalOrders, fetchOrders } = useOrderStore();
  const [report, setReport] = useState<CashierReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('cash');
  // Modal & Print states
  const [modalState, setModalState] = useState<{isOpen: boolean, type: 'success'|'error'|'warning'|'confirm', title: string, message: string, onConfirm?: () => void}>({ isOpen: false, type: 'success', title: '', message: '' });
  const [printingStations, setPrintingStations] = useState(false);
  const [stations, setStations] = useState<any[]>([]);

  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewItemsModal, setViewItemsModal] = useState<{ isOpen: boolean; order: any }>({ isOpen: false, order: null });

  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [historyEndDate, setHistoryEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  const { playNotificationSound, toggleMute, isMuted } = useAudioNotification();
  const prevPendingCountRef = { current: 0 };

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipInput, setTipInput] = useState<string>('');
  const [tipType, setTipType] = useState<'percent' | 'amount'>('percent');
  
  // Mixed payment states
  const [mixedCashAmount, setMixedCashAmount] = useState<string>('');
  const [mixedCardAmount, setMixedCardAmount] = useState<string>('');
  const [mixedCardType, setMixedCardType] = useState<'debit' | 'credit'>('debit');

  const [activeTab, setActiveTab] = useState<'payments' | 'reports' | 'approve' | 'history' | 'pos'>('payments');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute derived state from global orders
  const orders = globalOrders.filter((o) => (o.payment_status !== 'paid' || o.status !== 'delivered') && o.status !== 'pending' && o.status !== 'cancelled') as any[];
  const ordersToApprove = globalOrders.filter((o) => o.status === 'pending') as any[];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await api.get('/orders', {
        params: {
          payment_status: 'paid',
          startDate: historyStartDate,
          endDate: historyEndDate,
          search: historySearchQuery
        }
      });
      setHistoryOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyStartDate, historyEndDate]);

  // Real-time search debounce
  useEffect(() => {
    if (activeTab === 'history') {
      const timer = setTimeout(() => {
        fetchHistory();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [historySearchQuery]);

  // Update selected order reference when orders change (e.g. from websockets)
  useEffect(() => {
    if (orders.length > 0) {
      if (orders.length > prevPendingCountRef.current) {
        playNotificationSound();
      }
      setSelectedOrder(prev => {
        if (prev && orders.some((o) => o.id === prev.id)) {
          return orders.find(o => o.id === prev.id) || prev;
        }
        return orders[0];
      });
    } else {
      setSelectedOrder(null);
    }
    prevPendingCountRef.current = orders.length;
  }, [globalOrders, playNotificationSound]);

  const fetchData = async (dateStr?: string) => {
    try {
      setLoading(true);
      await fetchOrders();
      const targetDate = dateStr || reportDate;
      const [reportData, stationsRes] = await Promise.all([
        cashierAPI.getTodayReport(targetDate),
        api.get('/stations')
      ]);
      setReport(reportData);
      setStations(stationsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder || !amount) {
      alert('Seleccione una orden e ingrese el monto.');
      return;
    }
    
    // Si el monto ingresado es mayor al saldo pendiente, solo cobramos el saldo
    const subtotal = Number(selectedOrder.total);
    const finalTotal = subtotal + tipAmount;

    const paidSoFar = selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
    const remaining = finalTotal - paidSoFar;
    const enteredAmount = Number(amount);

    if (enteredAmount <= 0) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Monto Inválido',
        message: 'Por favor ingrese un monto válido mayor a 0.'
      });
      return;
    }

    if (method !== 'mixed' && enteredAmount < remaining) {
      setModalState({
        isOpen: true,
        type: 'warning',
        title: 'Pago Parcial Detectado',
        message: `El monto ingresado ($${enteredAmount.toLocaleString()}) es MENOR al saldo pendiente ($${remaining.toLocaleString()}).\n\n¿Estás seguro que deseas registrar esto como un PAGO PARCIAL?`,
        onConfirm: () => {
          closeModal();
          executePayment(enteredAmount > remaining ? remaining : enteredAmount, method, remaining);
        }
      });
      return;
    }

    executePayment(enteredAmount > remaining ? remaining : enteredAmount, method, remaining);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setModalState({
      isOpen: true,
      type: 'confirm',
      title: 'Anular Pedido',
      message: `¿Estás seguro que deseas anular el pedido #${selectedOrder.order_number}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await api.patch(`/orders/${selectedOrder.id}/status`, { status: 'cancelled' });
          closeModal();
          await fetchData();
        } catch (error) {
          console.error(error);
          setModalState({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo anular el pedido.'
          });
        }
      }
    });
  };

  const executePayment = async (amountToRegister: number, finalMethod: string, remaining: number) => {
    if (!selectedOrder) return;
    try {
      if (finalMethod === 'mixed') {
        const cashToRegister = Number(mixedCashAmount);
        const cardToRegister = Number(mixedCardAmount);
        
        if (cashToRegister + cardToRegister < remaining) {
          setModalState({
            isOpen: true,
            type: 'error',
            title: 'Monto Insuficiente',
            message: 'El monto mixto total es menor al saldo pendiente.'
          });
          return;
        }

        // Registrar efectivo
        if (cashToRegister > 0) {
          await cashierAPI.processPayment(selectedOrder.id, {
            amount: cashToRegister > remaining ? remaining : cashToRegister,
            method: 'cash'
          });
        }
        
        // Registrar tarjeta
        if (cardToRegister > 0) {
          const remainingAfterCash = remaining - cashToRegister;
          if (remainingAfterCash > 0) {
            await cashierAPI.processPayment(selectedOrder.id, {
              amount: cardToRegister > remainingAfterCash ? remainingAfterCash : cardToRegister,
              method: 'card_transbank' // The backend ENUM only accepts 'cash', 'card_transbank', 'transfer', 'mixed'
            });
          }
        }
      } else {
        await cashierAPI.processPayment(selectedOrder.id, {
          amount: amountToRegister,
          method: finalMethod
        });
      }
      
      setModalState({
        isOpen: true,
        type: 'success',
        title: '¡Pago Exitoso!',
        message: 'El pago ha sido registrado correctamente.'
      });
      
      setAmount('');
      setMixedCashAmount('');
      setMixedCardAmount('');
      setSelectedOrder(null);
      fetchData();
    } catch (err: any) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error de Servidor',
        message: err.response?.data?.message || err.message || 'Ocurrió un error inesperado.'
      });
    }
  };

  // When selected order changes, reset tip to 10%
  useEffect(() => {
    if (selectedOrder) {
      const defaultTip = Math.round(Number(selectedOrder.total) * 0.1);
      setTipAmount(defaultTip);
      setTipType('percent');
      setTipInput('10');
      setAmount('');
      setMethod('cash');
    }
  }, [selectedOrder]);

  // Recalculate tip when tipInput or tipType changes
  useEffect(() => {
    if (!selectedOrder) return;
    
    if (tipInput === '') {
      setTipAmount(0);
      return;
    }

    const val = Number(tipInput);
    if (isNaN(val)) return;

    const calculatedTip = selectedOrder?.payment_status === 'paid' 
      ? Number(selectedOrder.tip_amount || 0)
      : (tipType === 'percent' 
          ? Math.round(Number(selectedOrder?.total || 0) * (val / 100))
          : val);
    setTipAmount(calculatedTip);
  }, [tipInput, tipType, selectedOrder]);

  // When tip changes and method is not cash, auto update the amount
  useEffect(() => {
    if (selectedOrder && method !== 'cash') {
      const finalTotal = Number(selectedOrder.total) + tipAmount;
      const paidSoFar = selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
      setAmount(String(finalTotal - paidSoFar));
    }
  }, [tipAmount, method, selectedOrder]);

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    if (selectedOrder) {
      const finalTotal = Number(selectedOrder.total) + tipAmount;
      const paidSoFar = selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
      const remaining = finalTotal - paidSoFar;
      
      if (newMethod === 'mixed') {
        setMixedCashAmount('');
        setMixedCardAmount(String(remaining));
      } else {
        // The useEffect above will handle setting the amount for card/transfer
      }
    }
  };

  const handleMixedCashChange = (val: string) => {
    setMixedCashAmount(val);
    if (selectedOrder) {
      const finalTotal = Number(selectedOrder.total) + tipAmount;
      const paidSoFar = selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
      const remaining = finalTotal - paidSoFar;
      const cashVal = Number(val);
      if (cashVal <= remaining) {
        setMixedCardAmount(String(remaining - cashVal));
      } else {
        setMixedCardAmount('0');
      }
    }
  };

  const handleReprintToKitchen = async () => {
    if (!selectedOrder) return;
    try {
      await cashierAPI.reprintOrder(selectedOrder.id);
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'Ticket Re-enviado',
        message: 'Ticket re-enviado a cocina correctamente. Las estaciones lo verán de nuevo.'
      });
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.response?.data?.message || error.message);
    }
  };

  const handlePrintStationTickets = () => {
    setPrintingStations(true);
    setTimeout(() => {
      window.print();
      setPrintingStations(false);
    }, 100);
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      let title = 'Pedido Rechazado';
      let message = 'El pedido ha sido rechazado correctamente.';
      let type: 'success' | 'warning' | 'error' = 'warning';
      
      if (status === 'confirmed') {
        title = 'Enviado a Cocina';
        message = 'El pedido ha sido confirmado y enviado a cocina exitosamente.';
        type = 'success';
      } else if (status === 'delivered') {
        title = 'Pedido Entregado';
        message = 'El pedido ha sido marcado como entregado exitosamente.';
        type = 'success';
      }

      setModalState({
        isOpen: true,
        type,
        title,
        message
      });
      fetchData();
    } catch (error: any) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error al procesar',
        message: error.response?.data?.message || error.message
      });
    }
  };

  if (loading) return <MainLayout><div className="text-center py-10 font-bold">Cargando caja...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Icon icon={Icons.creditCard} size="lg" className="text-orange-600" />
              Panel de Caja
            </h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleMute}
                className={`px-4 py-2 rounded-full font-bold text-sm ${isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}
              >
                {isMuted ? '🔇 Sonido Silenciado' : '🔊 Sonido Activado'}
              </button>
              <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button 
                onClick={() => setActiveTab('approve')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors relative ${activeTab === 'approve' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Aprobar Pedidos Nuevos
                {ordersToApprove.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {ordersToApprove.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'payments' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Cuentas Pendientes
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'history' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Historial de Pagos
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'reports' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Control de Caja
              </button>
              <button 
                onClick={() => setActiveTab('pos')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 ml-2`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon icon={Icons.plus} size="sm" />
                  Nuevo Pedido (POS)
                </div>
              </button>
              </div>
            </div>
          </div>

          {activeTab === 'approve' && (
            <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon icon={Icons.check} className="text-orange-500" /> 
                Aprobar Pedidos Nuevos
              </h2>
              {ordersToApprove.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Icon icon={Icons.check} size="2xl" className="mx-auto mb-3 opacity-20" />
                  <p>No hay pedidos pendientes de aprobación.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ordersToApprove.map(order => (
                    <div key={order.id} className="p-4 border rounded-lg flex flex-col gap-4 hover:bg-orange-50 transition-colors border-orange-200 bg-orange-50/30">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-lg text-gray-900 mb-1">
                            Orden #{order.order_number}
                            <span className="ml-2 text-sm font-normal text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                              {order.delivery_type === 'dine_in' ? `Mesa ${order.table_id}` : order.delivery_type === 'delivery' ? 'Delivery' : 'Para Llevar'}
                            </span>
                          </div>
                          
                          {/* Order Details */}
                          <div className="text-sm text-gray-600 mb-3 space-y-1">
                            {order.created_at && (
                              <p className="mb-2 border-b pb-1">
                                <span className="font-semibold text-gray-700">Recibido:</span>{' '}
                                {new Date(order.created_at).toLocaleDateString('es-CL')} a las {new Date(order.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                            {order.customer_name && <p><span className="font-semibold text-gray-700">Cliente:</span> {order.customer_name}</p>}
                            {order.customer_phone && <p><span className="font-semibold text-gray-700">Teléfono:</span> {order.customer_phone}</p>}
                            {order.delivery_type === 'delivery' && order.delivery_address && (
                              <p><span className="font-semibold text-gray-700">Dirección:</span> {order.delivery_address}</p>
                            )}
                            {order.notes && (
                              <p><span className="font-semibold text-orange-700">Notas:</span> {order.notes}</p>
                            )}
                          </div>

                          {/* Items List */}
                          <div className="bg-white/60 p-3 rounded-md border border-orange-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Productos:</p>
                            <ul className="space-y-1">
                              {(order.order_items && order.order_items.length > 0 ? order.order_items : order.items || []).map((item: any, idx: number) => (
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
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Rechazar
                          </button>
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            className="flex-1 sm:flex-none px-6 py-2 bg-orange-600 text-white font-bold rounded-lg shadow-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
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

          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Lista de Órdenes Pendientes */}
              <div className="bg-white rounded-xl shadow p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Cuentas Pendientes</h2>
                </div>
                <div className="mb-4">
                  <div className="relative">
                    <Icon icon={Icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size="sm" />
                    <input
                      type="text"
                      placeholder="Buscar por # orden, mesa o mesero..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
                    />
                  </div>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2 max-h-[600px] pb-2">
                  {orders.filter(order => 
                    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    (order.table_id && String(order.table_id).includes(searchQuery)) ||
                    (order.waiter?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-orange-50 transition-colors ${selectedOrder?.id === order.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between font-bold">
                        <div className="flex flex-col max-w-[70%]">
                          <span>{order.delivery_type === 'dine_in' ? `Mesa ${order.table_id}` : order.delivery_type === 'delivery' ? 'Delivery' : order.delivery_type === 'to_go' ? 'Para Llevar' : 'Retiro en Local'}</span>
                          {order.delivery_type !== 'dine_in' && order.customer_name && (
                            <span className="text-sm font-normal text-gray-600 capitalize truncate">👤 {order.customer_name}</span>
                          )}
                          {order.delivery_type === 'delivery' && order.delivery_address && (
                            <span className="text-[10px] font-normal text-gray-500 mt-0.5 leading-tight">
                              📍 {order.delivery_address}
                              {order.delivery_street_number ? ` #${order.delivery_street_number}` : ''}
                              {order.delivery_apartment_number ? ` (Depto: ${order.delivery_apartment_number})` : ''}
                            </span>
                          )}
                        </div>
                        <span className="text-right">${Number(order.total).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>Orden: #{order.order_number}</span>
                        <span className={`uppercase font-bold ${order.payment_status === 'partial' ? 'text-blue-600' : 'text-orange-600'}`}>
                          {order.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-3 border-t border-gray-100 pt-2">
                        <div className="text-[10px] text-gray-400">
                          {order.created_at ? new Date(order.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium text-right max-w-[120px] truncate">
                          Atendió: <span title={order.waiter?.name || order.cashier?.name || order.customer_name || 'Sistema'}>
                            {order.waiter?.name || order.cashier?.name || order.customer_name || 'Sistema'}
                          </span>
                          {order.waiter?.role === 'waiter' ? ' (Mesero)' : 
                           order.cashier?.role === 'cashier' ? ' (Caja)' : 
                           order.cashier?.role === 'admin' ? ' (Admin)' : 
                           order.customer_name ? ' (Cliente)' : ''}
                        </div>
                      </div>
                      {/* Kitchen Status Badge */}
                      <div className="mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          order.status === 'delivered' ? 'bg-gray-200 text-gray-600' :
                          order.status === 'ready' ? 'bg-green-100 text-green-700' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {order.status === 'delivered' ? 'ENTREGADO' :
                           order.status === 'ready' ? 'LISTO EN COCINA' :
                           order.status === 'preparing' ? 'EN PREPARACIÓN' :
                           order.status === 'confirmed' ? 'RECIBIDO (COCINA)' :
                           order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.filter(order => 
                    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    (order.table_id && String(order.table_id).includes(searchQuery)) ||
                    (order.waiter?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length === 0 && <p className="text-center text-gray-500 py-4">No se encontraron cuentas.</p>}
                </div>
              </div>

              {/* Panel de Detalle y Pago */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Gestión de Orden</h2>
                  {selectedOrder?.status === 'ready' && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                      className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Icon icon={Icons.check} size="sm" />
                      Marcar como Entregado
                    </button>
                  )}
                  {selectedOrder?.status === 'preparing' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm border border-blue-200">
                      Cocinando...
                    </span>
                  )}
                </div>
                {selectedOrder ? (
                  <div className="space-y-6">
                    <div className="bg-gray-100 p-4 rounded-lg flex flex-col gap-2">
                      <p className="font-semibold text-gray-700 mb-2 border-b pb-2 flex justify-between">
                        <span>Orden seleccionada: #{selectedOrder.order_number}</span>
                        <span className="text-orange-500">{selectedOrder.delivery_type === 'dine_in' ? `Mesa ${selectedOrder.table_id}` : selectedOrder.delivery_type === 'delivery' ? 'Delivery' : selectedOrder.delivery_type === 'to_go' ? 'Para Llevar' : 'Retiro'}</span>
                      </p>
                      
                      {selectedOrder.delivery_type !== 'dine_in' && selectedOrder.customer_name && (
                        <div className="mb-3 text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                          <p className="font-medium text-gray-800 flex items-center gap-1">
                            <Icon icon={Icons.user} size="sm" /> {selectedOrder.customer_name} {selectedOrder.customer_phone ? `(${selectedOrder.customer_phone})` : ''}
                          </p>
                          {selectedOrder.delivery_type === 'delivery' && selectedOrder.delivery_address && (
                            <p className="mt-1 flex items-start gap-1 text-gray-600">
                              <span>📍</span>
                              <span>
                                {selectedOrder.delivery_address}
                                {selectedOrder.delivery_street_number ? ` #${selectedOrder.delivery_street_number}` : ''}
                                {selectedOrder.delivery_apartment_number ? ` (Depto: ${selectedOrder.delivery_apartment_number})` : ''}
                                {selectedOrder.delivery_references ? ` - Ref: ${selectedOrder.delivery_references}` : ''}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Items List */}
                      <div className="bg-white p-3 rounded border border-gray-200 mb-2 max-h-48 overflow-y-auto">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalle de Consumo:</p>
                        <ul className="space-y-1.5">
                          {(selectedOrder.order_items && selectedOrder.order_items.length > 0 ? selectedOrder.order_items : selectedOrder.items || []).map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-800 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-xs">{item.quantity}x</span>
                                <span>{item.product?.name || item.product_name || 'Producto'}</span>
                                {item.status && (
                                  <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded font-bold uppercase ${
                                    item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                    item.status === 'preparing' ? 'bg-purple-100 text-purple-700' :
                                    item.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-500'
                                  }`}>
                                    {item.status === 'ready' ? 'Listo' : item.status === 'preparing' ? 'Preparando' : item.status === 'accepted' ? 'Recibido' : item.status}
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-500 font-medium">${((item.product?.price || item.price || 0) * item.quantity).toLocaleString()}</span>
                            </li>
                          ))}
                          {(!selectedOrder.order_items || selectedOrder.order_items.length === 0) && (!selectedOrder.items || selectedOrder.items.length === 0) && (
                            <li className="text-sm text-gray-500 italic">No se encontraron productos</li>
                          )}
                        </ul>
                      </div>

                      <div className="flex justify-between items-center text-lg text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-bold">${(Number(selectedOrder.total) - Number(selectedOrder.delivery_fee || 0)).toLocaleString()}</span>
                      </div>
                      
                      {Number(selectedOrder.delivery_fee || 0) > 0 && (
                        <div className="flex justify-between items-center text-lg text-gray-600 mt-1">
                          <span>Costo de Envío:</span>
                          <span className="font-bold text-orange-500">${Number(selectedOrder.delivery_fee).toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-lg text-gray-600">
                          <span>Propina:</span>
                          <div className="text-right">
                            <span className="font-bold text-orange-500">${tipAmount.toLocaleString()}</span>
                            {Number(selectedOrder.total) > 0 && tipAmount > 0 && (
                              <span className="text-xs text-gray-400 ml-2">
                                ({((tipAmount / Number(selectedOrder.total)) * 100).toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedOrder.payment_status !== 'paid' && (
                          <div className="flex gap-2 justify-end items-center mt-2">
                            <button 
                              onClick={() => { setTipType('percent'); setTipInput('0'); }}
                              className={`px-3 py-1 text-sm rounded border ${tipAmount === 0 ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                              0%
                            </button>
                            <button 
                              onClick={() => { setTipType('percent'); setTipInput('10'); }}
                              className={`px-3 py-1 text-sm rounded border ${tipInput === '10' && tipType === 'percent' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                              10%
                            </button>
                            
                            <div className="flex rounded border border-gray-300 overflow-hidden ml-2">
                              <button
                                onClick={() => setTipType('percent')}
                                className={`px-2 py-1 text-xs font-bold ${tipType === 'percent' ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-500'}`}
                              >
                                %
                              </button>
                              <button
                                onClick={() => setTipType('amount')}
                                className={`px-2 py-1 text-xs font-bold border-l border-gray-300 ${tipType === 'amount' ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-500'}`}
                              >
                                $
                              </button>
                              <input 
                                type="number"
                                placeholder="Valor"
                                value={tipInput}
                                onChange={(e) => setTipInput(e.target.value)}
                                className="w-20 px-2 py-1 text-sm text-right focus:outline-none focus:bg-orange-50"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-xl font-bold border-t border-gray-300 pt-2 mt-1">
                        <span>Total con propina:</span>
                        <span>${(Number(selectedOrder.total) + tipAmount).toLocaleString()}</span>
                      </div>

                      {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                        <div className="flex justify-between items-center text-green-700">
                          <span>Abonado hasta ahora:</span>
                          <span className="font-bold">
                            ${selectedOrder.payments.reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-2xl font-black text-orange-600 pt-2 border-t border-gray-300">
                        <span>Saldo Pendiente:</span>
                        <span>
                          ${((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {selectedOrder.payment_status === 'paid' ? (
                      <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500 mb-2">
                          <Icon icon={Icons.check} size="lg" />
                        </div>
                        <h3 className="text-xl font-bold text-green-800">Pedido Pagado Completo</h3>
                        <p className="text-green-700 mb-6">Este pedido ya fue pagado y no requiere más cobros.</p>
                        
                        <button 
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg flex justify-center gap-2 items-center transition-colors shadow-sm"
                        >
                          <Icon icon={Icons.check} size="sm" />
                          Marcar como Entregado
                        </button>
                      </div>
                    ) : (
                      <>
                      {method !== 'mixed' ? (
                        <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-bold text-gray-700">Monto entregado</label>
                          <div className="flex gap-1.5 items-center">
                            <span className="text-xs text-gray-500 mr-1">Dividir en:</span>
                            {[2, 3, 4, 5].map(num => (
                              <button 
                                key={num}
                                onClick={() => setAmount(String(Math.ceil(((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)) / num)))}
                                className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded hover:bg-orange-100 font-bold transition-colors"
                                title={`Dividir en ${num} partes`}
                              >
                                {num}
                              </button>
                            ))}
                            <button 
                              onClick={() => setAmount(String((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)))}
                              className="text-xs text-blue-600 font-bold hover:underline ml-2"
                            >
                              Todo (Llenar)
                            </button>
                          </div>
                        </div>
                        <input 
                          type="number" 
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-lg font-bold"
                          placeholder="Ej: 5000"
                        />
                        {Number(amount) > ((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)) && method === 'cash' && (
                          <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200 flex justify-between items-center">
                            <span className="font-bold text-blue-800">Vuelto a entregar:</span>
                            <span className="text-xl font-black text-blue-600">
                              ${(Number(amount) - ((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0))).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {Number(amount) > 0 && Number(amount) < ((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)) && (
                          <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-200 flex justify-between items-center">
                            <span className="font-bold text-red-800">Falta por cobrar (Pago Parcial):</span>
                            <span className="text-xl font-black text-red-600">
                              ${(((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)) - Number(amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Si ingresas un monto mayor al saldo en efectivo, el sistema calculará el vuelto.</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-700 mb-2">Dividir Pago (Mixto)</h3>
                        
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Efectivo</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                              <input 
                                type="number"
                                value={mixedCashAmount}
                                onChange={(e) => handleMixedCashChange(e.target.value)}
                                className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-bold text-gray-600">Tarjeta</label>
                              <select 
                                value={mixedCardType}
                                onChange={(e) => setMixedCardType(e.target.value as 'debit' | 'credit')}
                                className="text-xs border-none bg-transparent text-blue-600 font-bold focus:ring-0 cursor-pointer p-0"
                              >
                                <option value="debit">Débito</option>
                                <option value="credit">Crédito</option>
                              </select>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                              <input 
                                type="number"
                                value={mixedCardAmount}
                                onChange={(e) => setMixedCardAmount(e.target.value)}
                                className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>

                        {Number(mixedCashAmount) > ((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)) && (
                          <div className="mt-2 bg-blue-50 p-2 rounded-lg border border-blue-200 flex justify-between items-center text-sm">
                            <span className="font-bold text-blue-800">Vuelto en efectivo:</span>
                            <span className="font-black text-blue-600">
                              ${(Number(mixedCashAmount) - ((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0))).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Método de Pago</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button onClick={() => handleMethodChange('cash')} className={`p-2 rounded-lg border font-semibold text-sm ${method === 'cash' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Efectivo</button>
                        <button onClick={() => handleMethodChange('card_transbank')} className={`p-2 rounded-lg border font-semibold text-sm ${method === 'card_transbank' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Tarjeta</button>
                        <button onClick={() => handleMethodChange('transfer')} className={`p-2 rounded-lg border font-semibold text-sm ${method === 'transfer' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Transferencia</button>
                        <button onClick={() => handleMethodChange('mixed')} className={`p-2 rounded-lg border font-semibold text-sm ${method === 'mixed' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Mixto</button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={handlePayment}
                        className={`flex-1 ${Number(amount) > 0 && Number(amount) < ((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)) && method !== 'mixed' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-4 rounded-lg text-lg flex justify-center gap-2 items-center transition-colors`}
                      >
                        <Icon icon={Icons.check} size="sm" />
                        {Number(amount) > 0 && Number(amount) < ((Number(selectedOrder.total) + tipAmount) - (selectedOrder.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0)) && method !== 'mixed'
                          ? 'Procesar Pago Parcial' 
                          : 'Procesar Pago Completo'
                        }
                      </button>
                      <button 
                        onClick={() => {
                          setPrintingStations(false);
                          setTimeout(() => window.print(), 50);
                        }}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-4 px-6 rounded-lg text-lg flex justify-center gap-2 items-center transition-colors"
                        title="Imprimir Boleta"
                      >
                        <Icon icon={Icons.print} size="sm" />
                        <span className="text-xs">Boleta</span>
                      </button>

                      <button 
                        onClick={handlePrintStationTickets}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold py-4 px-6 rounded-lg text-lg flex justify-center gap-2 items-center transition-colors"
                        title="Imprimir Comandas (Físico)"
                      >
                        <Icon icon={Icons.print} size="sm" />
                        <span className="text-xs">Comandas</span>
                      </button>

                      <button 
                        onClick={handleReprintToKitchen}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-lg text-lg flex justify-center gap-2 items-center"
                        title="Re-enviar a Pantalla KDS"
                      >
                        <Icon icon={Icons.refresh} size="sm" />
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button 
                        onClick={handleCancelOrder}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-6 rounded-lg text-sm flex justify-center gap-2 items-center transition-colors border border-red-200"
                        title="Anular Pedido y limpiar de pendientes"
                      >
                        <Icon icon={Icons.close} size="sm" />
                        Anular Pedido (Limpiar)
                      </button>
                    </div>
                    </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Icon icon={Icons.plate} size="xl" className="mx-auto mb-4 opacity-50" />
                    <p>Selecciona una orden de la lista para registrar un pago.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-800">Historial de Pagos</h2>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Desde</label>
                  <input 
                    type="date" 
                    value={historyStartDate} 
                    onChange={(e) => setHistoryStartDate(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Hasta</label>
                  <input 
                    type="date" 
                    value={historyEndDate} 
                    onChange={(e) => setHistoryEndDate(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Buscador (Nombre, Correo, Teléfono, Ticket)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Buscar..."
                      value={historySearchQuery} 
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button 
                      onClick={fetchHistory}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Icon icon={Icons.search} size="sm" />
                      Buscar
                    </button>
                  </div>
                </div>
              </div>
              
              {isHistoryLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando historial...</p>
                </div>
              ) : historyOrders.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {historyOrders.map((order: any) => (
                    <div key={order.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-bold text-gray-800 block">Orden #{order.order_number}</span>
                          <span className="text-xs text-gray-500">Hora: {new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Pagado</span>
                      </div>
                      
                      <div className="space-y-1 mb-3 text-sm">
                        <p className="flex justify-between"><span className="text-gray-500">Mesa:</span> <span className="font-medium text-gray-800">{order.table_id || 'Delivery/Llevar'}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Atendido por:</span> <span className="font-medium text-gray-800">{order.waiter?.name || order.cashier?.name || 'Sistema'}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Subtotal:</span> <span className="font-medium text-gray-800">${Number(order.total).toFixed(2)}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Propina:</span> <span className="font-medium text-green-600">${Number(order.tip_amount).toFixed(2)}</span></p>
                      </div>

                      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-black text-lg text-gray-900">${(Number(order.total) + Number(order.tip_amount)).toFixed(2)}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setViewItemsModal({ isOpen: true, order: order })}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                            title="Ver detalles del pedido"
                          >
                            <Icon icon={Icons.menu} size="sm" />
                            Detalles
                          </button>
                          <button 
                            onClick={() => { setSelectedOrder(order); setTimeout(() => window.print(), 50); }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors"
                            title="Imprimir Boleta"
                          >
                            <Icon icon={Icons.print} size="sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Icon icon={Icons.check} size="xl" className="mx-auto mb-4 opacity-50" />
                  <p>No se encontraron resultados para los filtros aplicados.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && report && (
            <CashRegisterControl report={report} onUpdate={() => fetchData(reportDate)} />
          )}

          {activeTab === 'pos' && (
            <div className="mt-6">
              <CashierPOS />
            </div>
          )}
        </div>
      </div>

      {!printingStations ? (
        <PrintableTicket order={selectedOrder} type="receipt" />
      ) : (
        selectedOrder && (() => {
          const items = selectedOrder.order_items || selectedOrder.items || [];
          const groups = items.reduce((acc: any, item: any) => {
            const stationId = item.product?.station_id;
            if (!stationId) return acc;
            if (!acc[stationId]) {
              const stName = stations.find(s => s.id === stationId)?.name || `ESTACION ${stationId}`;
              acc[stationId] = { stationName: stName, items: [] };
            }
            acc[stationId].items.push(item);
            return acc;
          }, {});
          
          return Object.values(groups).map((group: any, idx: number) => (
            <div key={idx} style={{ pageBreakAfter: 'always' }}>
              <PrintableTicket order={selectedOrder} itemsOverride={group.items} type="kitchen" stationName={group.stationName} />
            </div>
          ));
        })()
      )}

      {/* Pro Custom Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 text-center ${modalState.type === 'success' ? 'bg-green-50' : modalState.type === 'error' ? 'bg-red-50' : modalState.type === 'warning' ? 'bg-orange-50' : 'bg-blue-50'}`}>
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${modalState.type === 'success' ? 'bg-green-100 text-green-600' : modalState.type === 'error' ? 'bg-red-100 text-red-600' : modalState.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {modalState.type === 'success' && <Icon icon={Icons.check} size="lg" />}
                {modalState.type === 'error' && <Icon icon={Icons.close} size="lg" />}
                {modalState.type === 'warning' && <Icon icon={Icons.alert} size="lg" />}
                {modalState.type === 'confirm' && <Icon icon={Icons.info} size="lg" />}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${modalState.type === 'success' ? 'text-green-800' : modalState.type === 'error' ? 'text-red-800' : modalState.type === 'warning' ? 'text-orange-800' : 'text-blue-800'}`}>
                {modalState.title}
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-center whitespace-pre-wrap">{modalState.message}</p>
              
              <div className="mt-8 flex gap-3 justify-center">
                {(modalState.type === 'warning' || modalState.type === 'confirm') && modalState.onConfirm ? (
                  <>
                    <button 
                      onClick={closeModal}
                      className="px-6 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={modalState.onConfirm}
                      className="px-6 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/20 transition-all active:scale-95"
                    >
                      Sí, confirmar
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={closeModal}
                    className="w-full px-6 py-3 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 shadow-md shadow-gray-900/20 transition-all active:scale-95"
                  >
                    Aceptar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Items Modal */}
      {viewItemsModal.isOpen && viewItemsModal.order && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex justify-center items-center p-4" onClick={() => setViewItemsModal({ isOpen: false, order: null })}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                Pedido #{viewItemsModal.order.order_number.split('-')[1] || viewItemsModal.order.order_number}
              </h3>
              <button onClick={() => setViewItemsModal({ isOpen: false, order: null })} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full">
                <Icon icon={Icons.close} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {(() => {
                const sourceItems = (viewItemsModal.order.order_items && viewItemsModal.order.order_items.length > 0) 
                  ? viewItemsModal.order.order_items 
                  : (viewItemsModal.order.items || []);
                  
                const items = sourceItems.map((oi: any) => ({
                  quantity: oi.quantity,
                  name: oi.product?.name || oi.name || 'Desconocido',
                  price: Number(oi.product?.price || oi.price || 0)
                }));
                
                return items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm items-center border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5 rounded text-xs">{item.quantity}x</span>
                          <span className="text-gray-800">{item.name}</span>
                        </div>
                        <span className="text-gray-500 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center text-sm">No hay detalles de productos.</p>
                );
              })()}
            </div>
            <div className="bg-gray-50 p-4 border-t flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Pedido: <span className="font-bold text-gray-900">${Number(viewItemsModal.order.total || 0).toFixed(2)}</span></span>
              <span className="text-gray-600">Propina: <span className={`font-bold ${Number(viewItemsModal.order.tip_amount || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>${Number(viewItemsModal.order.tip_amount || 0).toFixed(2)}</span></span>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
