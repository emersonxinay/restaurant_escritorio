import { Outlet, Link } from 'react-router-dom';
import { LogOut, BarChart3, Package, Tag, Percent } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminLayout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Hazuki Admin</h1>
        </div>

        <nav className="mt-8">
          <Link
            to="/admin/dashboard"
            className="flex items-center px-6 py-3 hover:bg-blue-700 transition"
          >
            <BarChart3 className="mr-3" />
            Dashboard
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center px-6 py-3 hover:bg-blue-700 transition"
          >
            <Package className="mr-3" />
            Productos
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center px-6 py-3 hover:bg-blue-700 transition"
          >
            <Tag className="mr-3" />
            Categorías
          </Link>
          <Link
            to="/admin/discounts"
            className="flex items-center px-6 py-3 hover:bg-blue-700 transition"
          >
            <Percent className="mr-3" />
            Descuentos
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
          >
            <LogOut className="mr-2" size={20} />
            Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
