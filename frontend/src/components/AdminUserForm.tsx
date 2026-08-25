import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';

interface AdminUserFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    station_id?: number;
  };
}

export default function AdminUserForm({ onSave, onCancel, initialData }: AdminUserFormProps) {
  const [formData, setFormData] = useState({
    username: initialData?.username || '',
    password: '', // blank for edit unless they want to change it
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'waiter',
    station_id: initialData?.station_id || undefined
  });
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { value: 'customer', label: 'Cliente' },
    { value: 'admin', label: 'Administrador' },
    { value: 'cashier', label: 'Cajero' },
    { value: 'waiter', label: 'Mesero' },
    { value: 'kitchen', label: 'Cocina' },
    { value: 'bar', label: 'Barra' },
  ];

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await api.get('/stations');
        setStations(response.data);
      } catch (err) {
        console.error('Error loading stations', err);
      }
    };
    fetchStations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) {
      setError('El usuario es requerido');
      return;
    }
    
    if (!initialData && !formData.password) {
      setError('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      setLoading(true);
      setError('');
      if (initialData) {
        // Prepare payload: only send password if it's not empty
        const payload: any = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }
        await api.put(`/admin/users/${initialData.id}`, payload);
      } else {
        await api.post('/admin/users', formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${initialData ? 'actualizar' : 'crear'} el usuario`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-orange-600 p-4 flex justify-between items-center text-white">
          <h3 className="text-xl font-bold">{initialData ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
          <button onClick={onCancel} className="text-white hover:text-gray-200">
            <Icon icon={Icons.error} size="sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Usuario de Login *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              placeholder="Ej: juan_perez"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Contraseña {initialData ? '(Dejar en blanco para no cambiar)' : '*'}
            </label>
            <input
              type="password"
              required={!initialData}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              placeholder={initialData ? "Dejar en blanco para mantener actual" : "Min. 6 caracteres"}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              placeholder="Ej: Juan Perez"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              placeholder="juan@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {(formData.role === 'kitchen' || formData.role === 'bar') && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estación Asignada (Opcional)</label>
              <select
                value={formData.station_id || ''}
                onChange={(e) => setFormData({ ...formData, station_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              >
                <option value="">-- Ver Todas (Sin Filtro) --</option>
                {stations.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Si seleccionas una estación, el panel KDS solo mostrará los productos asignados a ella.</p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (initialData ? 'Actualizar Usuario' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
