import { useState, useEffect } from 'react';
import { Table, tablesAPI } from '../services/adminService';
import { Icon, Icons } from '../utils/icons';

interface AdminTableFormProps {
  table?: Table;
  onSave: (table: Table) => void;
  onCancel: () => void;
}

export default function AdminTableForm({ table, onSave, onCancel }: AdminTableFormProps) {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (table) {
      setTableNumber(table.number.toString());
      setCapacity(table.capacity.toString());
    }
  }, [table]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const parsedNumber = parseInt(tableNumber);
      const parsedCapacity = parseInt(capacity);

      if (isNaN(parsedNumber) || parsedNumber <= 0) {
        throw new Error('El número de mesa debe ser un número válido mayor a 0');
      }

      if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
        throw new Error('La capacidad debe ser un número válido mayor a 0');
      }

      const data = { number: parsedNumber, capacity: parsedCapacity };

      if (table) {
        const response = await tablesAPI.update(table.id, data);
        onSave(response.data);
      } else {
        const response = await tablesAPI.create(data);
        onSave(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar la mesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">
        {table ? 'Editar Mesa' : 'Nueva Mesa'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <Icon icon={Icons.error} className="mr-2" size="sm" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-bold mb-2">Número de Mesa *</label>
          <input
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            required
            min="1"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Capacidad (Personas) *</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            required
            min="1"
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
          {table ? 'Actualizar' : 'Crear'} Mesa
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
