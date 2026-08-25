import { useState, useEffect, useMemo } from 'react';
import { Station, stationsAPI } from '../services/adminService';
import { Icon, Icons } from '../utils/icons';
import AdminStationForm from './AdminStationForm';

export default function AdminStationsList() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | undefined>();

  const filteredStations = useMemo(() => {
    return stations.filter(station => 
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (station.description && station.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stations, searchTerm]);

  // Formularios simplificados para el ejemplo
  
  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await stationsAPI.getAll();
      setStations(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las estaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (savedStation: Station) => {
    if (editingStation) {
      setStations(stations.map(s => s.id === savedStation.id ? savedStation : s));
    } else {
      setStations([...stations, savedStation]);
    }
    setShowForm(false);
    setEditingStation(undefined);
  };

  const handleEdit = (station: Station) => {
    setEditingStation(station);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta estación?')) return;
    try {
      await stationsAPI.delete(id);
      setStations(stations.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar la estación');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Gestión de Estaciones (Cocina/Bar)</h2>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {!showForm && (
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar estación..."
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
              Nueva Estación
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <AdminStationForm 
          station={editingStation}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingStation(undefined);
          }}
        />
      )}
      
      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map(station => (
            <div key={station.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{station.name}</h3>
                <p className="text-gray-600 mb-4">{station.description || 'Sin descripción'}</p>
                {station.printer_ip && (
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <Icon icon={Icons.print} size="sm" /> IP: {station.printer_ip}
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleEdit(station)}
                  className="text-blue-500 hover:text-blue-700 p-2 flex items-center gap-1"
                >
                  <Icon icon={Icons.edit} size="sm" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(station.id)}
                  className="text-red-500 hover:text-red-700 p-2 flex items-center gap-1"
                >
                  <Icon icon={Icons.delete} size="sm" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!showForm && stations.length === 0 && <p className="text-gray-500 text-center py-8">No hay estaciones registradas.</p>}
    </div>
  );
}
