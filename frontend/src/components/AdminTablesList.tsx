import { useState, useEffect, useMemo } from 'react';
import { Table, tablesAPI } from '../services/adminService';
import { Icon, Icons } from '../utils/icons';
import AdminTableForm from './AdminTableForm';

export default function AdminTablesList() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | undefined>();

  const filteredTables = useMemo(() => {
    return tables.filter(table => 
      String(table.number).includes(searchTerm.toLowerCase()) ||
      table.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tables, searchTerm]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await tablesAPI.getAll();
      setTables(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (savedTable: Table) => {
    if (editingTable) {
      setTables(tables.map(t => t.id === savedTable.id ? savedTable : t));
    } else {
      setTables([...tables, savedTable]);
    }
    setShowForm(false);
    setEditingTable(undefined);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta mesa?')) return;
    try {
      await tablesAPI.delete(id);
      setTables(tables.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar la mesa');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Gestión de Mesas</h2>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {!showForm && (
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar por número o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              />
              <Icon icon={Icons.search} size="sm" className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          )}
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-hazuki-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
            >
              <Icon icon={Icons.plus} size="sm" />
              Nueva Mesa
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <AdminTableForm 
          table={editingTable}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingTable(undefined);
          }}
        />
      )}
      
      {!showForm && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map(table => (
            <div key={table.id} className={`rounded-lg shadow p-4 text-center border-t-4 relative group ${
              table.status === 'available' ? 'border-green-500 bg-green-50' :
              table.status === 'occupied' ? 'border-red-500 bg-red-50' : 'border-gray-500 bg-gray-50'
            }`}>
              {/* Overlay with actions on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <button 
                  onClick={() => handleEdit(table)}
                  className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50 transition"
                  title="Editar"
                >
                  <Icon icon={Icons.edit} size="sm" />
                </button>
                <button 
                  onClick={() => handleDelete(table.id)}
                  className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition"
                  title="Eliminar"
                >
                  <Icon icon={Icons.delete} size="sm" />
                </button>
              </div>

              <Icon icon={Icons.plate} size="lg" className="mx-auto mb-2 text-gray-600" />
              <h3 className="text-xl font-bold">Mesa {table.number}</h3>
              <p className="text-sm text-gray-600">Cap: {table.capacity}</p>
              <p className="text-xs font-semibold mt-2 uppercase">{table.status}</p>
            </div>
          ))}
        </div>
      )}
      {!showForm && tables.length === 0 && <p className="text-gray-500 text-center py-8">No hay mesas registradas.</p>}
    </div>
  );
}
