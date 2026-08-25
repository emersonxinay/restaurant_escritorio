import { useEffect, useState, useMemo } from 'react';
import { Discount, discountsAPI } from '../services/adminService';
import AdminDiscountForm from './AdminDiscountForm';
import { Icon, Icons } from '../utils/icons';

export default function AdminDiscountList() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDiscounts = useMemo(() => {
    return discounts.filter(discount => 
      discount.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [discounts, searchTerm]);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await discountsAPI.getAll();
      setDiscounts(response.data);
    } catch (err: any) {
      setError('Error al cargar los descuentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (discount: Discount) => {
    if (editingDiscount) {
      setDiscounts(discounts.map(d => d.id === discount.id ? discount : d));
    } else {
      setDiscounts([...discounts, discount]);
    }
    setShowForm(false);
    setEditingDiscount(null);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este descuento?')) return;

    try {
      await discountsAPI.delete(id);
      setDiscounts(discounts.filter(d => d.id !== id));
    } catch (err: any) {
      setError('Error al eliminar el descuento');
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700' },
      programmed: { bg: 'bg-blue-100', text: 'text-blue-700' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-700' },
    };
    const color = colors[status] || colors.programmed;
    return `${color.bg} ${color.text}`;
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-orange-600">Gestión de Descuentos</h1>
          {!showForm && (
            <button
              onClick={() => {
                setEditingDiscount(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition shadow-lg"
            >
              <Icon icon={Icons.add} size="sm" />
              + Nuevo Descuento
            </button>
          )}
        </div>

        {showForm && (
          <AdminDiscountForm
            discount={editingDiscount || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingDiscount(null);
            }}
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar descuento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
            />
            <Icon icon={Icons.search} size="sm" className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <Icon icon={Icons.error} className="mr-2 inline" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Icon icon={Icons.info} size="lg" className="mx-auto mb-2" />
            Cargando descuentos...
          </div>
        ) : discounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon icon={Icons.info} size="lg" className="mx-auto mb-2" />
            No hay descuentos creados aún
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Título</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Descuento</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Período</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">{discount.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold text-sm">
                        -{discount.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        {formatDate(discount.start_date)} a {formatDate(discount.end_date)}
                      </div>
                      {discount.start_time && discount.end_time && (
                        <div className="text-gray-600">
                          {discount.start_time} - {discount.end_time}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${getStatusBadge(discount.status)}`}>
                        {discount.status === 'active' ? 'Activo' : discount.status === 'programmed' ? 'Programado' : 'Vencido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2 transition"
                      >
                        <Icon icon={Icons.edit} size="xs" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id)}
                        className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                      >
                        <Icon icon={Icons.trash} size="xs" />
                        Eliminar
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
