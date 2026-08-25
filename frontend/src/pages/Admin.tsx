import { useEffect, useState } from 'react';
import { Navigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import AdminCategoryList from '../components/AdminCategoryList';
import AdminProductList from '../components/AdminProductList';
import AdminDiscountList from '../components/AdminDiscountList';
import AdminOrdersList from '../components/AdminOrdersList';
import AdminReservationsList from '../components/AdminReservationsList';
import AdminStationsList from '../components/AdminStationsList';
import AdminTablesList from '../components/AdminTablesList';
import AdminUsersList from '../components/AdminUsersList';
import AdminAuditLogs from '../components/AdminAuditLogs';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import AdminReports from './AdminReports';
import { Icon, Icons } from '../utils/icons';

interface DashboardStats {
  categories_count: number;
  products_count: number;
  reservations_count: number;
  users_count: number;
  active_discount?: {
    title: string;
    percentage: number;
  };
}

function AdminDashboard({ stats, loading }: { stats: DashboardStats | null, loading: boolean }) {
  return (
    <div>
      {loading ? (
        <div className="text-center py-12">Cargando estadísticas...</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-100 rounded-lg p-6">
              <h3 className="text-gray-600 font-bold mb-2">Categorías</h3>
              <p className="text-4xl font-bold text-blue-600">{stats.categories_count}</p>
            </div>

            <div className="bg-green-100 rounded-lg p-6">
              <h3 className="text-gray-600 font-bold mb-2">Productos</h3>
              <p className="text-4xl font-bold text-green-600">{stats.products_count}</p>
            </div>

            <div className="bg-purple-100 rounded-lg p-6">
              <h3 className="text-gray-600 font-bold mb-2">Reservaciones</h3>
              <p className="text-4xl font-bold text-purple-600">{stats.reservations_count}</p>
            </div>

            <div className="bg-yellow-100 rounded-lg p-6">
              <h3 className="text-gray-600 font-bold mb-2">Usuarios</h3>
              <p className="text-4xl font-bold text-yellow-600">{stats.users_count}</p>
            </div>
          </div>

          {stats?.active_discount && (
            <div className="bg-red-100 border-2 border-red-500 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Descuento Activo</h3>
              <p className="text-2xl font-bold text-red-600">
                {stats.active_discount.title} - {stats.active_discount.percentage}% OFF
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const isActive = (path: string) => {
    if (path === '' && location.pathname === '/admin') return true;
    if (path !== '' && location.pathname.startsWith(`/admin/${path}`)) return true;
    return false;
  };

  const tabClasses = (path: string) =>
    `flex items-center gap-2 px-6 py-3 font-semibold transition whitespace-nowrap ${
      isActive(path)
        ? 'bg-hazuki-orange text-white border-b-2 border-hazuki-orange'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6">Panel Administrativo</h1>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b-2 border-gray-200 mb-8 overflow-x-auto bg-white rounded-t-lg">
          <Link to="/admin" className={tabClasses('')}>
            <Icon icon={Icons.cog} size="sm" />
            Inicio
          </Link>
          <Link to="/admin/analytics" className={tabClasses('analytics')}>
            <Icon icon={Icons.chartBar} size="sm" />
            Analítica
          </Link>
          <Link to="/admin/categories" className={tabClasses('categories')}>
            <Icon icon={Icons.list} size="sm" />
            Categorías
          </Link>
          <Link to="/admin/products" className={tabClasses('products')}>
            <Icon icon={Icons.plate} size="sm" />
            Productos
          </Link>
          <Link to="/admin/discounts" className={tabClasses('discounts')}>
            <Icon icon={Icons.star} size="sm" />
            Descuentos
          </Link>
          <Link to="/admin/orders" className={tabClasses('orders')}>
            <Icon icon={Icons.cart} size="sm" />
            Pedidos
          </Link>
          <Link to="/admin/reservations" className={tabClasses('reservations')}>
            <Icon icon={Icons.calendar} size="sm" />
            Reservas
          </Link>
          <Link to="/admin/stations" className={tabClasses('stations')}>
            <Icon icon={Icons.cog} size="sm" />
            Estaciones
          </Link>
          <Link to="/admin/tables" className={tabClasses('tables')}>
            <Icon icon={Icons.plate} size="sm" />
            Mesas
          </Link>
          <Link to="/admin/users" className={tabClasses('users')}>
            <Icon icon={Icons.users} size="sm" />
            Usuarios
          </Link>
          <Link to="/admin/reports" className={tabClasses('reports')}>
            <Icon icon={Icons.list} size="sm" />
            Finanzas
          </Link>
          <Link to="/admin/audit-logs" className={tabClasses('audit-logs')}>
            <Icon icon={Icons.menu} size="sm" />
            Logs
          </Link>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<AdminDashboard stats={stats} loading={loading} />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="categories" element={<AdminCategoryList />} />
        <Route path="products" element={<AdminProductList />} />
        <Route path="discounts" element={<AdminDiscountList />} />
        <Route path="orders" element={<AdminOrdersList />} />
        <Route path="reservations" element={<AdminReservationsList />} />
        <Route path="stations" element={<AdminStationsList />} />
        <Route path="tables" element={<AdminTablesList />} />
        <Route path="users" element={<AdminUsersList />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Routes>
    </MainLayout>
  );
}
