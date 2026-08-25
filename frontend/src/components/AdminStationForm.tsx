import { useState, useEffect } from 'react';
import { Station, stationsAPI } from '../services/adminService';
import { Icon, Icons } from '../utils/icons';

interface AdminStationFormProps {
  station?: Station;
  onSave: (station: Station) => void;
  onCancel: () => void;
}

export default function AdminStationForm({ station, onSave, onCancel }: AdminStationFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [printerIp, setPrinterIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (station) {
      setName(station.name);
      setDescription(station.description || '');
      setPrinterIp(station.printer_ip || '');
    }
  }, [station]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name.trim()) {
        throw new Error('El nombre de la estación es obligatorio');
      }

      const data = { 
        name: name.trim(), 
        description: description.trim(), 
        printer_ip: printerIp.trim() 
      };

      if (station) {
        const response = await stationsAPI.update(station.id, data);
        onSave(response.data);
      } else {
        const response = await stationsAPI.create(data);
        onSave(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar la estación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">
        {station ? 'Editar Estación' : 'Nueva Estación'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <Icon icon={Icons.error} className="mr-2" size="sm" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-bold mb-2">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            required
            placeholder="Ej: Cocina Caliente"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">IP de la Impresora (Opcional)</label>
          <input
            type="text"
            value={printerIp}
            onChange={(e) => setPrinterIp(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            placeholder="192.168.1.100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 font-bold mb-2">Descripción (Opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-hazuki-orange hover:bg-orange-700 text-white font-bold px-6 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Icon icon={Icons.check} size="sm" />
          {station ? 'Actualizar' : 'Crear'} Estación
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold px-6 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Icon icon={Icons.close} size="sm" />
          Cancelar
        </button>
      </div>
    </form>
  );
}
