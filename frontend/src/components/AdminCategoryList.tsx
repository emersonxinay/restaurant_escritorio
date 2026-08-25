import { useEffect, useState, useMemo } from 'react';
import { Category, categoriesAPI } from '../services/adminService';
import AdminCategoryForm from './AdminCategoryForm';
import { Icon, Icons } from '../utils/icons';

export default function AdminCategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = useMemo(() => {
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err: any) {
      setError('Error al cargar las categorías');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (category: Category | Category[]) => {
    if (editingCategory && !Array.isArray(category)) {
      setCategories(categories.map(c => c.id === category.id ? category : c));
    } else {
      if (Array.isArray(category)) {
        setCategories([...categories, ...category]);
      } else {
        setCategories([...categories, category]);
      }
    }
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return;

    try {
      await categoriesAPI.delete(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      setError('Error al eliminar la categoría');
      console.error(err);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-orange-600">Gestión de Categorías</h1>
          {!showForm && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition shadow-lg"
            >
              <Icon icon={Icons.add} size="sm" />
              + Nueva Categoría
            </button>
          )}
        </div>

        {showForm && (
          <AdminCategoryForm
            category={editingCategory || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingCategory(null);
            }}
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar categoría..."
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
          Cargando categorías...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Icon icon={Icons.info} size="lg" className="mx-auto mb-2" />
          No hay categorías creadas aún
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Creada</th>
                <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEdit(category)}
                      className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2 transition"
                    >
                      <Icon icon={Icons.edit} size="xs" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
