import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';
import AdminUserForm from './AdminUserForm';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  station_id?: number;
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      String(user.id).includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      console.error(err);
      alert('Error al actualizar el rol del usuario');
    }
  };

  const handleStatusChange = async (userId: number, currentStatus: boolean) => {
    if (!window.confirm(`¿Estás seguro de que deseas ${currentStatus ? 'desactivar' : 'activar'} a este usuario?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al cambiar el estado del usuario');
    }
  };

  const roles = [
    { value: 'customer', label: 'Cliente' },
    { value: 'admin', label: 'Administrador' },
    { value: 'cashier', label: 'Cajero' },
    { value: 'waiter', label: 'Mesero' },
    { value: 'kitchen', label: 'Cocina' },
    { value: 'bar', label: 'Barra' },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-orange-600">Gestión de Usuarios y Roles</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Buscar por nombre, email o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
            />
            <Icon icon={Icons.search} size="sm" className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowForm(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Icon icon={Icons.plus} size="sm" />
            Nuevo
          </button>
        </div>
      </div>

      {showForm && (
        <AdminUserForm 
          initialData={editingUser || undefined}
          onSave={() => {
            setShowForm(false);
            setEditingUser(null);
            fetchUsers();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <Icon icon={Icons.error} className="mr-2 inline" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <div className="text-center py-12">Cargando usuarios...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Rol</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-600">#{user.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {user.name || user.username || <span className="text-gray-400 italic">No especificado</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.email || <span className="text-gray-400 italic">No especificado</span>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusChange(user.id, user.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-1 ${
                          user.is_active 
                            ? 'bg-green-100 text-green-700 border-green-300 hover:bg-red-100 hover:text-red-700 hover:border-red-300'
                            : 'bg-red-100 text-red-700 border-red-300 hover:bg-green-100 hover:text-green-700 hover:border-green-300'
                        }`}
                        title={user.is_active ? 'Click para desactivar' : 'Click para activar'}
                      >
                        {user.is_active ? (
                          <><div className="w-2 h-2 rounded-full bg-green-500"></div> Activo</>
                        ) : (
                          <><div className="w-2 h-2 rounded-full bg-red-500"></div> Inactivo</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        disabled={!user.is_active}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`px-3 py-1 border rounded-lg font-bold text-sm focus:outline-none focus:border-orange-600 ${
                          !user.is_active ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-500' :
                          user.role === 'admin' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                          user.role === 'customer' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                          'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        {roles.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowForm(true);
                        }}
                        className="text-orange-600 hover:text-orange-900 transition flex items-center gap-1 font-semibold"
                        title="Editar datos del usuario"
                      >
                        <Icon icon={Icons.edit} size="sm" /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
