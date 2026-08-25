import { useState, useEffect } from 'react';
import { Icon, Icons } from '../utils/icons';
import { formatFileSize, getImageSource } from '../utils/imageOptimization';

interface ImageData {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
  used: boolean;
}

interface ImageGalleryStats {
  images: ImageData[];
  total: number;
  used: number;
  unused: number;
}

interface ImageSelectorProps {
  onSelectImage: (filename: string) => void;
  selectedImage?: string;
  allowDelete?: boolean;
}

export default function ImageSelector({
  onSelectImage,
  selectedImage,
  allowDelete = true,
}: ImageSelectorProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [stats, setStats] = useState<ImageGalleryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [filterUnused, setFilterUnused] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/images', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data: ImageGalleryStats = await response.json();
      setImages(data.images);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error loading images');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (filename: string) => {
    if (!window.confirm(`¿Eliminar imagen "${filename}"?`)) {
      return;
    }

    setDeleting(filename);
    setDeleteError('');

    try {
      const response = await fetch(`/api/admin/images/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to delete image'
        );
      }

      // Remove image from list
      setImages((prev) => prev.filter((img) => img.filename !== filename));

      // Update stats
      if (stats) {
        const deletedImage = images.find((img) => img.filename === filename);
        setStats({
          ...stats,
          total: stats.total - 1,
          used: deletedImage?.used ? stats.used - 1 : stats.used,
          unused: !deletedImage?.used ? stats.unused - 1 : stats.unused,
        });
      }
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const filteredImages = filterUnused
    ? images.filter((img) => !img.used)
    : images;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Galería de Imágenes</h3>
        <button
          type="button"
          onClick={fetchImages}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          title="Recargar"
        >
          <Icon icon={Icons.refresh} size="sm" />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-gray-600">Total</p>
            <p className="text-lg font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-gray-600">En uso</p>
            <p className="text-lg font-bold text-green-600">{stats.used}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <p className="text-gray-600">No usado</p>
            <p className="text-lg font-bold text-orange-600">{stats.unused}</p>
          </div>
        </div>
      )}

      {/* Filter Toggle */}
      {stats && stats.unused > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="filterUnused"
            checked={filterUnused}
            onChange={(e) => setFilterUnused(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="filterUnused" className="text-sm text-gray-700 cursor-pointer">
            Mostrar solo no utilizadas ({stats.unused})
          </label>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          <Icon icon={Icons.error} className="mr-2 inline" />
          {error}
        </div>
      )}

      {deleteError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 text-sm">
          <Icon icon={Icons.alert} className="mr-2 inline" />
          {deleteError}
        </div>
      )}

      {/* Image Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Cargando imágenes...</div>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Icon icon={Icons.image} size="xl" className="mx-auto mb-2 text-gray-300" />
          <p>
            {filterUnused
              ? 'No hay imágenes sin usar'
              : 'No hay imágenes aún'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.filename}
              className={`relative group rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                selectedImage === image.filename
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectImage(image.filename)}
            >
              {/* Image Container */}
              <div className="bg-gray-100 aspect-square overflow-hidden">
                <img
                  src={getImageSource(image.filename, false)}
                  alt={image.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>

              {/* Overlay with info and actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex flex-col justify-between p-2">
                {/* Status badges */}
                <div className="flex gap-2">
                  {selectedImage === image.filename && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Seleccionada
                    </span>
                  )}
                  {image.used && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                      En uso
                    </span>
                  )}
                </div>

                {/* Delete Button - Only show for unused images when hovering */}
                {allowDelete && !image.used && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.filename);
                    }}
                    disabled={deleting === image.filename}
                    className="self-end bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white p-2 rounded-full transition"
                    title="Eliminar imagen"
                  >
                    <Icon
                      icon={Icons.trash}
                      size="sm"
                    />
                  </button>
                )}
              </div>

              {/* File info at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition">
                <p className="truncate" title={image.filename}>
                  {image.filename}
                </p>
                <p className="text-gray-300">
                  {formatFileSize(image.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh hint */}
      {!loading && filteredImages.length > 0 && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          Haz clic en una imagen para seleccionarla • Las imágenes en uso no se pueden eliminar
        </p>
      )}
    </div>
  );
}
