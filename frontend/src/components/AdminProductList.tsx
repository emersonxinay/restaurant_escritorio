import { useEffect, useState, useMemo } from 'react';
import { Product, productsAPI, Category, categoriesAPI, Station, stationsAPI } from '../services/adminService';
import AdminProductForm from './AdminProductForm';
import ProductImageThumbnail from './ProductImageThumbnail';
import { Icon, Icons } from '../utils/icons';

export default function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, categoriesRes, stationsRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        stationsAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setStations(stationsRes.data);
    } catch (err: any) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (product: Product) => {
    if (editingProduct) {
      // Update product in list with fresh data
      const updatedProducts = products.map(p =>
        p.id === product.id ? { ...product } : p
      );
      setProducts(updatedProducts);
    } else {
      // Add new product to list
      setProducts([...products, { ...product }]);
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      await productsAPI.delete(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      setError('Error al eliminar el producto');
      console.error(err);
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Sin categoría';
  };

  const handleUpdateStation = async (productId: number, stationId: string) => {
    try {
      const parsedStationId = stationId ? parseInt(stationId) : null;
      const response = await productsAPI.update(productId, { station_id: parsedStationId });
      
      // Update local state exactly as returned from backend
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, station_id: response.data.station_id } : p
      ));
      
    } catch (err: any) {
      console.error("Error updating station:", err);
      alert('Error al actualizar la estación: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (filterCategory) {
      filtered = filtered.filter(p => p.category_id === parseInt(filterCategory));
    }
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  }, [products, filterCategory, searchTerm]);

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-orange-600">Gestión de Productos</h1>
          {!showForm && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition shadow-lg"
            >
              <Icon icon={Icons.add} size="sm" />
              + Nuevo Producto
            </button>
          )}
        </div>

        {showForm && (
          <AdminProductForm
            product={editingProduct || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <Icon icon={Icons.error} className="mr-2 inline" />
            {error}
          </div>
        )}

        {!showForm && (
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-bold mb-2">Filtrar por categoría</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-bold mb-2">Buscar producto</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                />
                <Icon icon={Icons.search} size="sm" className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Icon icon={Icons.info} size="lg" className="mx-auto mb-2" />
            Cargando productos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon icon={Icons.info} size="lg" className="mx-auto mb-2" />
            {filterCategory ? 'No hay productos en esta categoría' : 'No hay productos creados aún'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Imagen</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Categoría</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Precio</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Estación KDS</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <ProductImageThumbnail
                        imageUrl={product.image_url}
                        alt={product.name}
                        size="sm"
                        showBorder={true}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-600">{product.description.substring(0, 50)}...</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getCategoryName(product.category_id)}</td>
                    <td className="px-6 py-4 font-semibold">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={product.station_id?.toString() || ''}
                        onChange={(e) => handleUpdateStation(product.id, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-orange-500 bg-white"
                      >
                        <option value="">Sin asignar</option>
                        {stations.map(st => (
                          <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(product)}
                        className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2 transition"
                      >
                        <Icon icon={Icons.edit} size="xs" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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
