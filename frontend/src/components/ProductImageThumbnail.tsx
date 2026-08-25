import { useState, useEffect } from 'react';
import { getImageSource } from '../utils/imageOptimization';
import { Icon, Icons } from '../utils/icons';

interface ProductImageThumbnailProps {
  imageUrl?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showBorder?: boolean;
  onImageLoad?: () => void;
  key?: string | number; // Force re-render on key change
}

const sizeMap = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

/**
 * ProductImageThumbnail component for consistent thumbnail display
 * Handles:
 * - Uploaded images from /uploads folder
 * - External URLs (http/https)
 * - Fallback to default image on error
 * - Loading state with skeleton
 * - Proper sizing for different contexts
 * - Cache busting for updated images
 */
export default function ProductImageThumbnail({
  imageUrl,
  alt,
  size = 'sm',
  className = '',
  showBorder = false,
  onImageLoad,
  key,
}: ProductImageThumbnailProps) {
  const [imageSrc, setImageSrc] = useState<string>(getImageSource(imageUrl, true));
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Force fresh load with cache busting timestamp
    const src = getImageSource(imageUrl, true);
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [imageUrl, key]);

  const sizeClass = sizeMap[size];
  const borderClass = showBorder ? 'border border-gray-300' : '';

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onImageLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    // If we haven't already tried the default, use it
    if (imageSrc !== getImageSource(undefined)) {
      setImageSrc(getImageSource(undefined));
    }
  };

  return (
    <div className={`${sizeClass} ${borderClass} rounded overflow-hidden bg-gray-100 flex-shrink-0 ${className}`}>
      {isLoading && !hasError && (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          <Icon icon={Icons.image} size="xs" className="text-gray-400" />
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={handleLoad}
        onError={handleError}
      />

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-lg"><Icon icon={Icons.image} size="sm" className="text-hazuki-orange" /></div>
      )}
    </div>
  );
}
