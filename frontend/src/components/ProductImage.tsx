import { useState, useEffect } from 'react';
import { getImageSource } from '../utils/imageOptimization';
import { Icon, Icons } from '../utils/icons';

interface ProductImageProps {
  imageUrl?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  showFallbackIcon?: boolean;
  onImageLoad?: () => void;
  onImageError?: () => void;
  key?: string | number; // Force re-render on key change
}

/**
 * ProductImage component with fallback support and error handling
 * Handles:
 * - Uploaded images from /uploads folder
 * - External URLs (http/https)
 * - Fallback to default image on error
 * - Loading state
 * - Fallback icon emoji
 * - Cache busting for updated images
 */
export default function ProductImage({
  imageUrl,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-full overflow-hidden bg-gray-200',
  showFallbackIcon = true,
  onImageLoad,
  onImageError,
  key,
}: ProductImageProps) {
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

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onImageLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    // Only use default image if we haven't already
    if (imageSrc !== getImageSource(undefined)) {
      setImageSrc(getImageSource(undefined));
    }
    onImageError?.();
  };

  return (
    <div className={containerClassName}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <Icon icon={Icons.image} size="lg" className="text-gray-400" />
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
      />

      {hasError && showFallbackIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-hazuki/10 pointer-events-none">
          <span className="text-4xl text-hazuki-orange"><Icon icon={Icons.image} size="lg" /></span>
        </div>
      )}
    </div>
  );
}
