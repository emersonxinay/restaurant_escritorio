import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';

interface Order {
  id: number;
  total: number;
  delivery_type: 'pickup' | 'delivery';
  status: string;
  created_at: string;
  items: any[];
  delivery_fee: number;
  subtotal: number;
  discount_amount: number;
}

type Period = 'today' | 'week' | 'month' | 'year';

export default function AnalyticsDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para filtrar por período
  const getFilteredOrders = (orderList: Order[]) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return orderList.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= now;
    });
  };

  // Datos filtrados
  const filteredOrders = getFilteredOrders(orders);
  const completedOrders = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'ready');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');

  // ==================== KPIs CRÍTICOS ====================
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (parseFloat(o.total as any) || 0), 0);
  const totalOrders = filteredOrders.length;
  const completedOrdersCount = completedOrders.length;
  const completionRate = totalOrders > 0 ? parseFloat(((completedOrdersCount / totalOrders) * 100).toFixed(1)) : 0;
  const avgTicket = completedOrdersCount > 0 ? parseFloat((totalRevenue / completedOrdersCount).toFixed(0)) : 0;
  const cancelRate = totalOrders > 0 ? parseFloat(((cancelledOrders.length / totalOrders) * 100).toFixed(1)) : 0;

  // Análisis por tipo de entrega
  const pickupOrders = completedOrders.filter(o => o.delivery_type === 'pickup');
  const deliveryOrders = completedOrders.filter(o => o.delivery_type === 'delivery');
  const pickupRevenue = pickupOrders.reduce((sum, o) => sum + (parseFloat(o.total as any) || 0), 0);
  const deliveryRevenue = deliveryOrders.reduce((sum, o) => sum + (parseFloat(o.total as any) || 0), 0);

  // Análisis financiero
  const totalDeliveryFees = deliveryOrders.reduce((sum, o) => sum + (parseFloat(o.delivery_fee as any) || 0), 0);
  const totalSubtotal = completedOrders.reduce((sum, o) => sum + (parseFloat(o.subtotal as any) || 0), 0);
  const totalDiscounts = completedOrders.reduce((sum, o) => sum + (parseFloat(o.discount_amount as any) || 0), 0);
  const costOfDelivery = totalDeliveryFees; // Costo aproximado
  const netMargin = totalRevenue - costOfDelivery;
  const marginPercent = totalRevenue > 0 ? parseFloat(((netMargin / totalRevenue) * 100).toFixed(1)) : 0;

  // Productos más vendidos
  const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
      }
      productSales[item.product_name].quantity += item.quantity;
      productSales[item.product_name].revenue += item.price * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Análisis diario
  const dailySales: { [key: string]: number } = {};
  completedOrders.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('es-CL');
    dailySales[date] = (dailySales[date] || 0) + (parseFloat(order.total as any) || 0);
  });

  const avgDailySales = Object.values(dailySales).length > 0
    ? parseFloat((Object.values(dailySales).reduce((a, b) => a + b) / Object.values(dailySales).length).toFixed(0))
    : 0;

  // Decisiones recomendadas basadas en datos
  const recommendations: any[] = [];

  if (cancelRate > 15) {
    recommendations.push({
      type: 'warning',
      title: 'Tasa de cancelación alta',
      message: `${cancelRate}% de pedidos cancelados. Revisar: tiempo de preparación, disponibilidad de stock.`
    });
  }

  if (deliveryOrders.length > pickupOrders.length && marginPercent < 30) {
    recommendations.push({
      type: 'warning',
      title: 'Margen bajo en delivery',
      message: `Margen: ${marginPercent}%. Considerar aumentar tarifa de delivery o reducir costos de operación.`
    });
  }

  if (completedOrdersCount > 0 && avgTicket < 15000) {
    recommendations.push({
      type: 'info',
      title: 'Ticket promedio bajo',
      message: `$${Math.round(avgTicket).toLocaleString('es-CL')} CLP. Estrategia: combos, upsell, ofertas en productos de alto margen.`
    });
  }

  if (topProducts.length > 0) {
    recommendations.push({
      type: 'success',
      title: `Estrella del menú: ${topProducts[0].name}`,
      message: `${topProducts[0].quantity} unidades vendidas. Aumentar stock y promocionar.`
    });
  }

  if (period !== 'today' && Object.values(dailySales).length > 1) {
    const maxDay = Math.max(...Object.values(dailySales));
    const minDay = Math.min(...Object.values(dailySales));
    if (minDay > 0) {
      const variance = parseFloat((((maxDay - minDay) / minDay) * 100).toFixed(0));
      if (variance > 50) {
        recommendations.push({
          type: 'info',
          title: 'Variación de demanda',
          message: `Diferencia entre mejores y peores días: ${variance}%. Estrategia: promociones en días bajos.`
        });
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Icon icon={Icons.spinner} size="lg" className="inline mb-2 animate-spin" />
        <p className="text-gray-600">Analizando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Período */}
      <div className="flex gap-2 flex-wrap">
        {(['today', 'week', 'month', 'year'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              period === p
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {p === 'today' && 'Hoy'}
            {p === 'week' && 'Últimos 7 días'}
            {p === 'month' && 'Últimos 30 días'}
            {p === 'year' && 'Último año'}
          </button>
        ))}
      </div>

      {/* KPIs PRINCIPALES - Lo que importa al dueño */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas Totales */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300">
          <p className="text-sm text-green-700 font-bold mb-2 flex items-center gap-1">
            <Icon icon={Icons.moneyBill} size="sm" />
            INGRESOS TOTALES
          </p>
          <p className="text-3xl font-black text-green-800">${totalRevenue.toLocaleString('es-CL')}</p>
          <p className="text-xs text-green-600 mt-2">{completedOrdersCount} pedidos completados</p>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
          <p className="text-sm text-blue-700 font-bold mb-2 flex items-center gap-1">
            <Icon icon={Icons.bullseye} size="sm" />
            TICKET PROMEDIO
          </p>
          <p className="text-3xl font-black text-blue-800">${avgTicket.toLocaleString('es-CL')}</p>
          <p className="text-xs text-blue-600 mt-2">Por pedido completado</p>
        </div>

        {/* Tasa de Completitud */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-300">
          <p className="text-sm text-purple-700 font-bold mb-2 flex items-center gap-1">
            <Icon icon={Icons.check} size="sm" />
            TASA DE COMPLETITUD
          </p>
          <p className="text-3xl font-black text-purple-800">{completionRate}%</p>
          <p className="text-xs text-purple-600 mt-2">Canceladas: {cancelRate}%</p>
        </div>

        {/* Margen Neto */}
        <div className={`rounded-lg p-6 border-2 ${
          marginPercent > 30
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300'
            : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
        }`}>
          <p className={`text-sm font-bold mb-2 ${
            marginPercent > 30 ? 'text-emerald-700' : 'text-red-700'
          }`}><Icon icon={Icons.chartBar} size="sm" className="mr-1" /> MARGEN NETO</p>
          <p className={`text-3xl font-black ${
            marginPercent > 30 ? 'text-emerald-800' : 'text-red-800'
          }`}>{marginPercent}%</p>
          <p className={`text-xs mt-2 ${
            marginPercent > 30 ? 'text-emerald-600' : 'text-red-600'
          }`}>${Math.round(netMargin).toLocaleString('es-CL')} neto</p>
        </div>
      </div>

      {/* ANÁLISIS DE VENTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pickup vs Delivery */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon={Icons.store} size="sm" />
            PICKUP vs 
            <Icon icon={Icons.car} size="sm" />
            DELIVERY
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold">Retiro en Local</span>
                <span className="text-sm font-bold">${pickupRevenue.toLocaleString('es-CL')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className="bg-blue-600 h-2 rounded"
                  style={{ width: `${totalRevenue > 0 ? (pickupRevenue / totalRevenue) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{pickupOrders.length} pedidos</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold">Delivery a Domicilio</span>
                <span className="text-sm font-bold">${deliveryRevenue.toLocaleString('es-CL')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className="bg-orange-600 h-2 rounded"
                  style={{ width: `${totalRevenue > 0 ? (deliveryRevenue / totalRevenue) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{deliveryOrders.length} pedidos</p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <Icon icon={Icons.lightbulb} size="sm" className="mr-1 text-yellow-500" /> <span className="font-semibold">Insight:</span> {
                  pickupRevenue > deliveryRevenue
                    ? 'Retiro es más rentable. Promocionar recogida rápida.'
                    : 'Delivery es creciente. Optimizar logística y tarifas.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Productos Top 5 */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon={Icons.star} size="sm" className="text-yellow-500" />
            TOP 5 PRODUCTOS
          </h3>
          <div className="space-y-2">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{idx + 1}. {product.name}</p>
                  <p className="text-xs text-gray-600">{product.quantity} unidades vendidas</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">${product.revenue.toLocaleString('es-CL')}</p>
                </div>
              </div>
            ))}
          </div>
          {topProducts.length === 0 && (
            <p className="text-center text-gray-500 py-6">Sin datos</p>
          )}
        </div>
      </div>

      {/* ANÁLISIS OPERACIONAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon={Icons.chartLine} size="sm" className="text-blue-500" />
            PROMEDIO DIARIO
          </h3>
          <p className="text-3xl font-black text-blue-600">${avgDailySales.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-600 mt-2">{Object.keys(dailySales).length} días con ventas</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon={Icons.car} size="sm" className="text-red-500" />
            COSTO DELIVERY
          </h3>
          <p className="text-3xl font-black text-red-600">${costOfDelivery.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-600 mt-2">{deliveryOrders.length} entregas realizadas</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon={Icons.chartBar} size="sm" className="text-yellow-500" />
            DESCUENTOS OTORGADOS
          </h3>
          <p className="text-3xl font-black text-yellow-600">${totalDiscounts.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-600 mt-2">{parseFloat(((totalDiscounts/totalSubtotal)*100).toFixed(1))}% del subtotal</p>
        </div>
      </div>

      {/* RECOMENDACIONES INTELIGENTES */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Icon icon={Icons.bullseye} size="sm" className="text-purple-500" />
            RECOMENDACIONES BASADAS EN DATOS
          </h3>
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-4 border-l-4 ${
                rec.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-400'
                  : rec.type === 'success'
                  ? 'bg-green-50 border-green-400'
                  : 'bg-blue-50 border-blue-400'
              }`}
            >
              <p className="font-bold text-sm text-gray-800">{rec.title}</p>
              <p className="text-sm text-gray-700 mt-1">{rec.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Resumen Ejecutivo */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Icon icon={Icons.clipboard} size="sm" />
          RESUMEN EJECUTIVO
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-300 mb-2">
              <span className="font-bold">Período:</span> {
                period === 'today' ? 'Hoy' :
                period === 'week' ? 'Últimos 7 días' :
                period === 'month' ? 'Últimos 30 días' : 'Último año'
              }
            </p>
            <p className="text-gray-300 mb-2">
              <span className="font-bold">Total de pedidos:</span> {totalOrders}
            </p>
            <p className="text-gray-300">
              <span className="font-bold">Ingresos:</span> ${totalRevenue.toLocaleString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-gray-300 mb-2">
              <span className="font-bold">Completados:</span> {completedOrdersCount} ({completionRate}%)
            </p>
            <p className="text-gray-300 mb-2">
              <span className="font-bold">Cancelados:</span> {cancelledOrders.length} ({cancelRate}%)
            </p>
            <p className="text-gray-300">
              <span className="font-bold">Pendientes:</span> {pendingOrders.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
