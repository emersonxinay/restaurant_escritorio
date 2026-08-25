import { useState, useCallback } from 'react';
import {
  compressImage,
  blobToFile,
  validateImageFile,
  ImageOptimizationOptions,
  formatFileSize,
} from '../utils/imageOptimization';

interface UseImageOptimizationReturn {
  compress: (file: File, options?: ImageOptimizationOptions) => Promise<File>;
  validate: (file: File) => { valid: boolean; error?: string };
  isCompressing: boolean;
  compressionError: string | null;
  clearError: () => void;
}

/**
 * Hook for image optimization with compression and validation
 */
export const useImageOptimization = (): UseImageOptimizationReturn => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionError, setCompressionError] = useState<string | null>(null);

  const validate = useCallback((file: File) => {
    return validateImageFile(file);
  }, []);

  const compress = useCallback(
    async (file: File, options?: ImageOptimizationOptions): Promise<File> => {
      setIsCompressing(true);
      setCompressionError(null);

      try {
        // Validate first
        const validation = validate(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Compress the image
        const compressedBlob = await compressImage(file, options);
        const originalSize = file.size;
        const compressedSize = compressedBlob.size;
        const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0);

        console.log(
          `Image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${reduction}% reduction)`
        );

        // Convert blob to file maintaining original filename
        const compressedFile = blobToFile(compressedBlob, file.name);
        return compressedFile;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error comprimiendo imagen';
        setCompressionError(errorMessage);
        throw error;
      } finally {
        setIsCompressing(false);
      }
    },
    [validate]
  );

  const clearError = useCallback(() => {
    setCompressionError(null);
  }, []);

  return {
    compress,
    validate,
    isCompressing,
    compressionError,
    clearError,
  };
};
