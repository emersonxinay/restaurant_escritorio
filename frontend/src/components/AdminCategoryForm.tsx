import { useState, useEffect } from 'react';
import { Category, categoriesAPI } from '../services/adminService';
import { Icon, Icons } from '../utils/icons';

interface AdminCategoryFormProps {
  category?: Category;
  onSave: (category: Category | Category[]) => void;
  onCancel: () => void;
}


export default function AdminCategoryForm({ category, onSave, onCancel }: AdminCategoryFormProps) {
  const [mode, setMode] = useState<'main' | 'sub'>('main'); // main = principal, sub = subcategoría
  const [name, setName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]); // Para agregar múltiples subcategorías
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMainCategories();
    if (category) {
      setName(category.name);
      // Si la categoría a editar tiene parent_id, es una subcategoría
      if (category.parent_id) {
        setMode('sub');
        setParentCategoryId(category.parent_id);
      }
    }
  }, [category]);

  const fetchMainCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      // Filtrar solo categorías principales (sin parent_id o parent_id null)
      const mainCats = response.data.filter((cat: any) => !cat.parent_id);
      setMainCategories(mainCats);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddSubcategory = () => {
    if (!newSubcategoryName.trim()) {
      setError('El nombre de la subcategoría es requerido');
      return;
    }
    if (subcategories.includes(newSubcategoryName.trim())) {
      setError('Esta subcategoría ya fue agregada');
      return;
    }
    setSubcategories([...subcategories, newSubcategoryName.trim()]);
    setNewSubcategoryName('');
    setError('');
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!name.trim()) {
        setError('El nombre es requerido');
        setLoading(false);
        return;
      }

      if (category) {
        // Editar categoría existente
        const response = await categoriesAPI.update(category.id, { name });
        const savedCategory = response.data;
        setSuccess('Categoría actualizada exitosamente');
        setTimeout(() => onSave(savedCategory), 1500);
      } else if (mode === 'main') {
        // Crear categoría principal
        const mainCatResponse = await categoriesAPI.create({ name });
        const savedMainCategory = mainCatResponse.data;

        // Si hay subcategorías a crear, crearlas todas
        let savedCategories: Category[] = [savedMainCategory];
        if (subcategories.length > 0) {
          for (const subName of subcategories) {
            const subResponse = await categoriesAPI.create({
              name: subName,
              parent_id: savedMainCategory.id
            });
            savedCategories.push(subResponse.data);
          }
        }

        setSuccess(
          `Categoría principal creada${subcategories.length > 0 ? ` con ${subcategories.length} subcategoría(s)` : ''} exitosamente`
        );
        setTimeout(() => onSave(savedCategories), 1500);
      } else {
        // Crear subcategoría
        if (!parentCategoryId) {
          setError('Debes seleccionar una categoría principal');
          setLoading(false);
          return;
        }

        const response = await categoriesAPI.create({
          name,
          parent_id: parentCategoryId
        });
        const savedCategory = response.data;
        setSuccess('Subcategoría creada exitosamente');
        setTimeout(() => onSave(savedCategory), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">
        {category ? 'Editar Categoría' : 'Nueva Categoría'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <Icon icon={Icons.error} size="sm" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <Icon icon={Icons.success} size="sm" />
          {success}
        </div>
      )}

      {/* Si está editando, no mostrar opciones de modo */}
      {!category && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-gray-700 font-bold mb-3">Tipo de Categoría *</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="main"
                checked={mode === 'main'}
                onChange={() => {
                  setMode('main' as const);
                  setParentCategoryId(null);
                }}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-gray-700">Categoría Principal (ej: Sushi, Comida Peruana)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="sub"
                checked={mode === 'sub'}
                onChange={() => setMode('sub' as const)}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-gray-700">Subcategoría (ej: Entradas, Rolls)</span>
            </label>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Nombre *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
          placeholder={mode === 'main' ? 'Ej: Sushi, Comida Peruana' : 'Ej: Entradas, Rolls, Ceviches'}
          disabled={loading || !!category}
        />
      </div>

      {/* Opciones si es subcategoría */}
      {!category && mode === 'sub' && (
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">Categoría Principal *</label>
          <select
            value={parentCategoryId || ''}
            onChange={(e) => setParentCategoryId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            disabled={loading}
          >
            <option value="">Selecciona una categoría principal</option>
            {mainCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Agregar subcategorías si es creación de categoría principal */}
      {!category && mode === 'main' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-3">
            <Icon icon={Icons.add} size="sm" className="inline mr-2" />
            Agregar Subcategorías (Opcional)
          </h3>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubcategory();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
              placeholder="Nombre de la subcategoría"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleAddSubcategory}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              <Icon icon={Icons.add} size="sm" />
            </button>
          </div>

          {/* Lista de subcategorías agregadas */}
          {subcategories.length > 0 && (
            <div className="space-y-2">
              {subcategories.map((sub, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                  <span className="text-gray-700">{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubcategory(index)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Icon icon={Icons.trash} size="sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-hazuki-orange hover:bg-orange-700 text-white font-bold px-6 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Icon icon={Icons.check} size="sm" />
          {category ? 'Actualizar' : 'Crear'} Categoría
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
