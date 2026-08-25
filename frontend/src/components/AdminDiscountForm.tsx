import { useState, useEffect } from 'react';
import { Discount, discountsAPI } from '../services/adminService';
import { Icon, Icons } from '../utils/icons';

interface AdminDiscountFormProps {
  discount?: Discount;
  onSave: (discount: Discount) => void;
  onCancel: () => void;
}

export default function AdminDiscountForm({ discount, onSave, onCancel }: AdminDiscountFormProps) {
  const [title, setTitle] = useState('');
  const [percentage, setPercentage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [autoApply, setAutoApply] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (discount) {
      setTitle(discount.title);
      setPercentage(discount.percentage.toString());
      setStartDate(discount.start_date.split('T')[0]);
      setEndDate(discount.end_date.split('T')[0]);
      setStartTime(discount.start_time || '');
      setEndTime(discount.end_time || '');
      setIsActive(discount.is_active);
      setAutoApply(discount.auto_apply);
    }
  }, [discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!title.trim()) {
        setError('El título del descuento es requerido');
        setLoading(false);
        return;
      }

      if (!percentage || parseInt(percentage) <= 0 || parseInt(percentage) > 100) {
        setError('El porcentaje debe ser entre 1 y 100');
        setLoading(false);
        return;
      }

      if (!startDate || !endDate) {
        setError('Las fechas de inicio y fin son requeridas');
        setLoading(false);
        return;
      }

      const discountData = {
        title,
        percentage: parseInt(percentage),
        start_date: startDate,
        end_date: endDate,
        start_time: startTime || null,
        end_time: endTime || null,
        is_active: isActive,
        auto_apply: autoApply,
      };

      let savedDiscount: Discount;
      if (discount) {
        const response = await discountsAPI.update(discount.id, discountData);
        savedDiscount = response.data;
      } else {
        const response = await discountsAPI.create(discountData as any);
        savedDiscount = response.data;
      }

      onSave(savedDiscount);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el descuento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">
        {discount ? 'Editar Descuento' : 'Nuevo Descuento'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <Icon icon={Icons.error} className="mr-2 inline" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 font-bold mb-2">Título del Descuento *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            placeholder="Ej: Black Friday 30% OFF"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Porcentaje de Descuento (%) *</label>
          <input
            type="number"
            min="1"
            max="100"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            placeholder="30"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Fecha de Inicio *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Fecha de Fin *</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Hora de Inicio</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Hora de Fin</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
            disabled={loading}
          />
          <span className="text-gray-700 font-semibold">Descuento Activo</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoApply}
            onChange={(e) => setAutoApply(e.target.checked)}
            className="w-4 h-4"
            disabled={loading}
          />
          <span className="text-gray-700 font-semibold">Aplicar automáticamente</span>
        </label>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-hazuki-orange hover:bg-orange-700 text-white font-bold px-6 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Icon icon={Icons.check} size="sm" />
          {discount ? 'Actualizar' : 'Crear'} Descuento
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
