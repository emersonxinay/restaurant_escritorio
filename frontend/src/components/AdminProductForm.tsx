import { useState, useEffect, useMemo } from 'react';
import { Product, productsAPI, Category, categoriesAPI, Station, stationsAPI } from '../services/adminService';
import { Icon, Icons } from '../utils/icons';
import { useImageOptimization } from '../hooks/useImageOptimization';
import { formatFileSize, preloadImage, getImageSource } from '../utils/imageOptimization';
import ImageGallery from './ImageGallery';

interface AdminProductFormProps {
  product?: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

export default function AdminProductForm({ product, onSave, onCancel }: AdminProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mainCategoryId, setMainCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [stationId, setStationId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageLoadingMessage, setImageLoadingMessage] = useState('');
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const [compressedFileSize, setCompressedFileSize] = useState<number | null>(null);
  const [imageMode, setImageMode] = useState<'gallery' | 'upload' | 'url'>('gallery');
  const [imageUpdated, setImageUpdated] = useState(false);
  const { compress, isCompressing, compressionError, clearError } = useImageOptimization();

  // Calculate main categories and subcategories from all categories
  const mainCategories = useMemo(() => {
    return allCategories.filter(cat => !cat.parent_id);
  }, [allCategories]);

  const subcategories = useMemo(() => {
    if (!mainCategoryId) return [];
    return allCategories.filter(cat => cat.parent_id === parseInt(mainCategoryId));
  }, [mainCategoryId, allCategories]);

  useEffect(() => {
    fetchCategories();
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setSubcategoryId(product.category_id.toString());
      setStationId(product.station_id?.toString() || '');
      setImageUrl(product.image_url || '');
      if (product.image_url) {
        // Use getImageSource to get correct URL
        setImagePreview(getImageSource(product.image_url));
      }
    }
  }, [product]);

  // When product is loaded or subcategoryId changes, find and set the main category
  useEffect(() => {
    if (subcategoryId) {
      const subcategory = allCategories.find(cat => cat.id === parseInt(subcategoryId));
      if (subcategory && subcategory.parent_id) {
        setMainCategoryId(subcategory.parent_id.toString());
      }
    }
  }, [subcategoryId, allCategories]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setAllCategories(response.data);
      const stationsResponse = await stationsAPI.getAll();
      setStations(stationsResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearError();
    setImageLoadingMessage('Comprimiendo imagen...');
    setOriginalFileSize(file.size);

    try {
      // Compress the image
      const compressedFile = await compress(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
        maxFileSize: 500 * 1024, // 500KB
      });

      setCompressedFileSize(compressedFile.size);
      setImageFile(compressedFile);
      setImageUpdated(true); // Mark image as updated

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageLoadingMessage('');
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setImageLoadingMessage('');
      // Error is handled by the hook
    }
  };

  const handleImageUrlChange = async (url: string) => {
    setImageUrl(url);
    if (!url.trim()) return;

    clearError();
    setImageLoadingMessage('Cargando imagen...');

    try {
      // Validate URL format
      new URL(url);

      // Preload image to verify it's valid
      await preloadImage(url);
      setImagePreview(url);
      setImageFile(null);
      setOriginalFileSize(null);
      setCompressedFileSize(null);
      setImageUpdated(true); // Mark image as updated
      setImageLoadingMessage('');
    } catch (err) {
      setImageLoadingMessage('Error: URL no válida o imagen no accesible');
    }
  };

  const handleImageSelected = (filename: string, url: string) => {
    setImageUrl(filename);
    setImagePreview(url);
    setImageFile(null);
    setImageUpdated(true);
  };

  const uploadImage = async () => {
    // If no file selected, return empty or existing URL
    if (!imageFile) return imageUrl;

    setUploadingImage(true);
    try {
      const response = await productsAPI.upload(imageFile);
      // Extract filename from URL response
      const urlParts = response.data.url.split('/');
      const filename = urlParts[urlParts.length - 1];
      return filename;
    } catch (err: any) {
      setError('Error al subir la imagen');
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!name.trim()) {
        setError('El nombre del producto es requerido');
        setLoading(false);
        return;
      }

      if (!mainCategoryId) {
        setError('Debes seleccionar una categoría principal');
        setLoading(false);
        return;
      }

      if (!subcategoryId) {
        setError('Debes seleccionar una subcategoría');
        setLoading(false);
        return;
      }

      if (!price || parseFloat(price) <= 0) {
        setError('El precio debe ser mayor a 0');
        setLoading(false);
        return;
      }

      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage();
      }

      const productData = {
        name,
        description: description || undefined,
        price: parseFloat(price),
        category_id: parseInt(subcategoryId),
        station_id: stationId ? parseInt(stationId) : null,
        image_url: finalImageUrl || undefined,
      };

      let savedProduct: Product;
      if (product) {
        const response = await productsAPI.update(product.id, productData);
        savedProduct = response.data;
      } else {
        const response = await productsAPI.create(productData as any);
        savedProduct = response.data;
      }

      // Show success message
      const message = imageUpdated
        ? `${product ? 'Producto actualizado' : 'Producto creado'} con imagen ${imageMode === 'url' ? 'externa' : 'comprimida'} exitosamente!`
        : `${product ? 'Producto actualizado' : 'Producto creado'} exitosamente!`;
      setSuccess(message);

      // Reset image updated flag
      setImageUpdated(false);

      // Call parent handler
      onSave(savedProduct);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">
        {product ? 'Editar Producto' : 'Nuevo Producto'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <Icon icon={Icons.error} className="mr-2 inline" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <Icon icon={Icons.success} size="sm" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column */}
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
              placeholder="Ej: Roll California"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Categoría Principal *</label>
            <select
              value={mainCategoryId}
              onChange={(e) => {
                setMainCategoryId(e.target.value);
                setSubcategoryId(''); // Reset subcategory when main category changes
              }}
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

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Subcategoría *</label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
              disabled={loading || !mainCategoryId}
            >
              <option value="">
                {mainCategoryId ? 'Selecciona una subcategoría' : 'Selecciona primero una categoría principal'}
              </option>
              {subcategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Estación (KDS)</label>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
              disabled={loading}
            >
              <option value="">Sin estación asignada</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Precio ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
              placeholder="0.00"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
              placeholder="Describe el producto"
              rows={4}
              disabled={loading}
            />
          </div>
        </div>

        {/* Right Column - Image */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">Imagen</label>

          {/* Image Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setImageMode('gallery')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition text-sm ${
                imageMode === 'gallery'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Icon icon={Icons.download} size="xs" className="inline mr-1" />
              Galería
            </button>
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition text-sm ${
                imageMode === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Icon icon={Icons.download} size="xs" className="inline mr-1" />
              Nueva
            </button>
            <button
              type="button"
              onClick={() => setImageMode('url')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition text-sm ${
                imageMode === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Icon icon={Icons.link} size="xs" className="inline mr-1" />
              URL
            </button>
          </div>

          {/* Gallery Mode */}
          {imageMode === 'gallery' && (
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <ImageGallery
                onSelectImage={handleImageSelected}
                selectedImage={imageUrl}
                allowUpload={true}
              />
            </div>
          )}

          {/* Upload New Mode */}
          {imageMode === 'upload' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              {imagePreview && imageFile ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setOriginalFileSize(null);
                      setCompressedFileSize(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                    disabled={loading || isCompressing}
                  >
                    <Icon icon={Icons.close} size="sm" />
                  </button>

                  {originalFileSize && compressedFileSize && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded text-center">
                      <p>Original: {formatFileSize(originalFileSize)}</p>
                      <p>Comprimido: {formatFileSize(compressedFileSize)}</p>
                      <p className="text-green-400 font-bold">
                        Reducción: {Math.round(((originalFileSize - compressedFileSize) / originalFileSize) * 100)}%
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon icon={Icons.download} size="xl" className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 mb-2">Arrastra una imagen aquí</p>
                  <label className="cursor-pointer">
                    <span className="text-orange-600 font-bold hover:underline">o selecciona una</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={loading || uploadingImage || isCompressing}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Máx. 5MB - Se comprimirá automáticamente</p>
                </div>
              )}
            </div>
          )}

          {/* URL Mode */}
          {imageMode === 'url' && (
            <div className="space-y-3">
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={imageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                disabled={loading}
              />
              {imagePreview && !isCompressing && imageLoadingMessage !== 'Error: URL no válida o imagen no accesible' && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                    disabled={loading}
                  >
                    <Icon icon={Icons.close} size="sm" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500">Las URLs externas se vinculan directamente (sin compresión)</p>
            </div>
          )}

          {/* Loading and Error Messages */}
          {imageLoadingMessage && (
            <div className={`text-sm mt-2 ${
              imageLoadingMessage.startsWith('Error') ? 'text-red-600' : 'text-blue-600'
            }`}>
              {imageLoadingMessage}
            </div>
          )}

          {compressionError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mt-2 text-sm">
              {compressionError}
            </div>
          )}

          {uploadingImage && (
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
              <Icon icon={Icons.spinner} size="sm" className="inline-block animate-spin" />
              Subiendo imagen...
            </p>
          )}

          {isCompressing && (
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
              <Icon icon={Icons.spinner} size="sm" className="inline-block animate-spin" />
              Comprimiendo imagen...
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="flex items-center gap-2 bg-hazuki-orange hover:bg-orange-700 text-white font-bold px-6 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Icon icon={Icons.check} size="sm" />
          {product ? 'Actualizar' : 'Crear'} Producto
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || uploadingImage}
          className="flex items-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold px-6 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Icon icon={Icons.close} size="sm" />
          Cancelar
        </button>
      </div>
    </form>
  );
}
