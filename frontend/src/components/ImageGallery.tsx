import { useState, useEffect } from 'react';
import { productsAPI } from '../services/adminService';
import { Icon, Icons } from '../utils/icons';
import { formatFileSize, getImageSource } from '../utils/imageOptimization';

interface Image {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
  used: boolean;
}

interface ImageGalleryProps {
  onSelectImage: (filename: string, url: string) => void;
  selectedImage?: string;
  allowUpload?: boolean;
  onUploadImage?: (file: File) => Promise<string>;
}

export default function ImageGallery({
  onSelectImage,
  selectedImage,
  allowUpload = true,
  onUploadImage
}: ImageGalleryProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE || (!!(window as any).__TAURI_INTERNALS__ ? 'http://localhost:14234' : window.location.origin);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(`${apiBase}/api/admin/images`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Failed to fetch images: ${response.status}`);
      const data = await response.json();
      setImages(data.images);
      setError('');
    } catch (err: any) {
      setError(err.message);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      let uploadedUrl: string;

      if (onUploadImage) {
        uploadedUrl = await onUploadImage(file);
      } else {
        // Default upload using the API
        const response = await productsAPI.upload(file);
        uploadedUrl = response.data.url;
      }

      // Refresh images list
      await fetchImages();

      // Select the newly uploaded image
      const filename = uploadedUrl.split('/').pop() || uploadedUrl;
      onSelectImage(filename, uploadedUrl);
      setShowUpload(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al subir imagen');
    }
  };

  const handleDeleteImage = async (filename: string) => {
    if (!confirm(`¿Eliminar imagen "${filename}"?`)) return;

    setDeleting(filename);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE || (!!(window as any).__TAURI_INTERNALS__ ? 'http://localhost:14234' : window.location.origin);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(`${apiBase}/api/admin/images/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      // Refresh images list
      await fetchImages();
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectImage = (filename: string, url: string) => {
    onSelectImage(filename, url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-700">Galería de Imágenes</h3>
        {allowUpload && (
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
          >
            <Icon icon={Icons.download} size="xs" />
            {showUpload ? 'Cancelar' : 'Subir Nueva'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm flex items-center gap-2">
          <Icon icon={Icons.error} size="sm" />
          {error}
        </div>
      )}

      {showUpload && (
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
          <label className="cursor-pointer flex items-center justify-center gap-2">
            <Icon icon={Icons.download} size="sm" className="text-blue-600" />
            <span className="text-blue-600 font-semibold">Selecciona una imagen</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">Cargando imágenes...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 text-gray-600">No hay imágenes subidas</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
          {images.map((image) => (
            <div
              key={image.filename}
              onClick={() => handleSelectImage(image.filename, image.url)}
              className={`relative rounded-lg overflow-hidden cursor-pointer transition transform hover:scale-105 ${
                selectedImage === image.filename
                  ? 'ring-4 ring-orange-500 scale-105'
                  : 'border-2 border-gray-200'
              }`}
            >
              <img
                src={getImageSource(image.filename)}
                alt={image.filename}
                className="w-full h-32 object-cover bg-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/logofavicon3.png';
                }}
              />

              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition flex items-end">
                <div className="w-full p-2 text-white text-xs bg-black/80">
                  <p className="truncate font-semibold">{image.filename}</p>
                  <p className="text-gray-300">{formatFileSize(image.size)}</p>
                  {image.used && (
                    <p className="text-green-400 text-xs mt-1"><Icon icon={Icons.check} size="xs" className="inline" /> En uso</p>
                  )}
                </div>
              </div>

              {!image.used && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image.filename);
                  }}
                  disabled={deleting === image.filename}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 hover:opacity-100 transition disabled:opacity-50"
                  title="Eliminar imagen no utilizada"
                >
                  <Icon icon={Icons.close} size="xs" />
                </button>
              )}

              {deleting === image.filename && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white">Eliminando...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        <p>Haz clic en una imagen para seleccionarla</p>
        <p>Puedes eliminar imágenes que no estén en uso (sin marca de check)</p>
      </div>
    </div>
  );
}
