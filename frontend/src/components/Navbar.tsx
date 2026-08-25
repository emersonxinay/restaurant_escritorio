import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon, Icons } from '../utils/icons';

export default function Navbar() {
  const { isAuthenticated, logout, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleLabel = (role?: string) => {
    switch(role) {
      case 'admin': return 'Administrador';
      case 'cashier': return 'Caja';
      case 'waiter': return 'Mesero';
      case 'kitchen': return 'Cocina';
      case 'bar': return 'Barra';
      case 'customer': return 'Cliente';
      default: return '';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Izquierda */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-orange-600 text-lg transform group-hover:scale-110 transition-transform border-2 border-orange-700">
              H
            </div>
            <div className="hidden xl:block">
              <span className="font-black text-2xl text-white">HAZUKI</span>
              <p className="text-xs text-orange-100">Sushi - Comida Peruana</p>
            </div>
          </Link>

          {/* Desktop Menu - Centro */}
          <div className="hidden xl:flex gap-2 xl:gap-4 items-center mx-auto">
            <Link
              to="/"
              className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200"
            >
              <Icon icon={Icons.home} size="sm" className="mr-1 inline" />
              Home
            </Link>
            <Link
              to="/nosotros"
              className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200"
            >
              <Icon icon={Icons.utensils} size="sm" className="mr-1 inline" />
              Nosotros
            </Link>
            <Link
              to="/carta"
              className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200"
            >
              <Icon icon={Icons.plate} size="sm" className="mr-1 inline" />
              Carta
            </Link>
            <Link
              to="/promociones"
              className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200"
            >
              <Icon icon={Icons.star} size="sm" className="mr-1 inline" />
              Promociones
            </Link>
            <Link
              to="/reservas"
              className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200"
            >
              <Icon icon={Icons.calendar} size="sm" className="mr-1 inline" />
              Reservas
            </Link>
            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200 bg-orange-700/40 flex items-center gap-1"
              >
                <Icon icon={Icons.cog} size="sm" className="inline" />
                Admin
              </Link>
            )}
            {isAuthenticated && user?.role === 'cashier' && (
              <Link to="/cashier" className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200 bg-orange-700/40 flex items-center gap-1">
                <Icon icon={Icons.creditCard} size="sm" className="inline" />
                Caja
              </Link>
            )}
            {isAuthenticated && (user?.role === 'waiter' || user?.role === 'admin' || user?.role === 'cashier') && (
              <Link to="/waiter" className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200 bg-orange-700/40 flex items-center gap-1">
                <Icon icon={Icons.users} size="sm" className="inline" />
                Salón (Mesas)
              </Link>
            )}
            {isAuthenticated && (user?.role === 'kitchen' || user?.role === 'bar') && (
              <Link to="/kds" className="font-bold text-white hover:bg-orange-700/30 px-4 py-2 rounded-lg transition-all duration-200 bg-orange-700/40 flex items-center gap-1">
                <Icon icon={Icons.list} size="sm" className="inline" />
                KDS
              </Link>
            )}
          </div>

          {/* Derecha - Login y Redes */}
          <div className="hidden xl:flex gap-4 items-center">
            {/* Social Icons */}
            <a
              href="tel:+56958184425"
              className="text-white hover:scale-110 transition"
              title="Llamar"
            >
              <Icon icon={Icons.phone} size="lg" />
            </a>
            <a
              href="https://wa.me/56958184425"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:scale-110 transition"
              title="WhatsApp"
            >
              <Icon icon={Icons.whatsapp} size="lg" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:scale-110 transition"
              title="Instagram"
            >
              <Icon icon={Icons.instagram} size="lg" />
            </a>

            {isAuthenticated && user ? (
              <div className="relative group">
                <button className="bg-orange-700 hover:bg-orange-800 text-white font-bold px-4 xl:px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 max-w-[180px] xl:max-w-[250px]">
                  <Icon icon={Icons.user} size="sm" className="shrink-0" />
                  <span className="truncate">{user.name || user.username}</span>
                  {user.role !== 'customer' && <span className="text-orange-200 text-sm shrink-0 hidden lg:inline">({getRoleLabel(user.role)})</span>}
                </button>

                {/* User Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {isAdmin && <p className="text-xs text-orange-600 font-bold">Admin</p>}
                  </div>

                  <Link
                    to="/mis-reservas"
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 flex items-center gap-2"
                  >
                    <Icon icon={Icons.calendar} size="sm" />
                    Mis Reservas
                  </Link>

                  <Link
                    to="/mis-pedidos"
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 flex items-center gap-2"
                  >
                    <Icon icon={Icons.cart} size="sm" />
                    Mis Pedidos
                  </Link>

                  <Link
                    to="/checkout"
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 flex items-center gap-2"
                  >
                    <Icon icon={Icons.cart} size="sm" />
                    Carrito
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-orange-600 hover:bg-orange-50 font-semibold flex items-center gap-2 border-t"
                    >
                      <Icon icon={Icons.cog} size="sm" />
                      Panel Admin
                    </Link>
                  )}
                  {user.role === 'cashier' && (
                    <Link to="/cashier" className="block px-4 py-2 text-orange-600 hover:bg-orange-50 font-semibold flex items-center gap-2 border-t">
                      <Icon icon={Icons.creditCard} size="sm" /> Caja
                    </Link>
                  )}
                  {user.role === 'waiter' && (
                    <Link to="/waiter" className="block px-4 py-2 text-orange-600 hover:bg-orange-50 font-semibold flex items-center gap-2 border-t">
                      <Icon icon={Icons.users} size="sm" /> Salón
                    </Link>
                  )}
                  {(user.role === 'kitchen' || user.role === 'bar') && (
                    <Link to="/kds" className="block px-4 py-2 text-orange-600 hover:bg-orange-50 font-semibold flex items-center gap-2 border-t">
                      <Icon icon={Icons.list} size="sm" /> KDS
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 border-t font-semibold"
                  >
                    <Icon icon={Icons.logout} size="sm" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-orange-700 hover:bg-orange-800 text-white font-bold px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Icon icon={Icons.user} size="sm" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-orange-700 border-t-2 border-orange-800">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all"
            >
              <Icon icon={Icons.home} size="sm" />
              Home
            </Link>
            <Link
              to="/nosotros"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all"
            >
              <Icon icon={Icons.utensils} size="sm" />
              Nosotros
            </Link>
            <Link
              to="/carta"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all"
            >
              <Icon icon={Icons.plate} size="sm" />
              Carta
            </Link>
            <Link
              to="/promociones"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all"
            >
              <Icon icon={Icons.star} size="sm" />
              Promociones
            </Link>
            <Link
              to="/reservas"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all"
            >
              <Icon icon={Icons.calendar} size="sm" />
              Reservas
            </Link>

            {isAuthenticated && (
              <Link
                to="/mis-pedidos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all bg-orange-600"
              >
                <Icon icon={Icons.cart} size="sm" />
                Mis Pedidos
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all bg-orange-600"
              >
                <Icon icon={Icons.cog} size="sm" />
                Admin
              </Link>
            )}
            
            {isAuthenticated && user?.role === 'cashier' && (
              <Link to="/cashier" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all bg-orange-600">
                <Icon icon={Icons.creditCard} size="sm" /> Caja
              </Link>
            )}
            
            {isAuthenticated && user?.role === 'waiter' && (
              <Link to="/waiter" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all bg-orange-600">
                <Icon icon={Icons.users} size="sm" /> Salón
              </Link>
            )}
            
            {isAuthenticated && (user?.role === 'kitchen' || user?.role === 'bar') && (
              <Link to="/kds" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-semibold text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-all bg-orange-600">
                <Icon icon={Icons.list} size="sm" /> KDS
              </Link>
            )}

            <div className="border-t border-orange-600 pt-4 space-y-3">
              <div className="flex gap-4 justify-center">
                <a
                  href="tel:+56958184425"
                  className="text-white hover:scale-110 transition"
                >
                  <Icon icon={Icons.phone} size="xl" />
                </a>
                <a
                  href="https://wa.me/56958184425"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:scale-110 transition"
                >
                  <Icon icon={Icons.whatsapp} size="xl" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:scale-110 transition"
                >
                  <Icon icon={Icons.instagram} size="xl" />
                </a>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full bg-orange-800 hover:bg-orange-900 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Icon icon={Icons.logout} size="sm" />
                  Salir
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 text-center bg-orange-800 hover:bg-orange-900 text-white font-bold py-3 rounded-lg transition-all"
                >
                  <Icon icon={Icons.user} size="sm" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
