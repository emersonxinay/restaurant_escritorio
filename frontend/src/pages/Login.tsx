import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Icon, Icons } from '../utils/icons';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;

      login(user, token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate(user.is_admin ? '/admin' : '/menu');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-orange-600">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center font-black text-white text-xl">
              H
            </div>
            <h1 className="text-3xl font-black text-orange-600 ml-3">HAZUKI</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-2">
              <Icon icon={Icons.error} size="sm" className="mt-1 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                <Icon icon={Icons.user} size="sm" />
                Usuario o Correo
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                placeholder="Tu nombre de usuario o email"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                <Icon icon={Icons.lock} size="sm" />
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                placeholder="Tu contraseña"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Icon icon={Icons.check} size="sm" />
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-orange-600 hover:text-orange-700 font-bold">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
