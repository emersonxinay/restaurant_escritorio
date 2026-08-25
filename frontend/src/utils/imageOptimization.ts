/**
 * Image optimization utilities for product images
 * Handles compression, format conversion, and quality optimization
 */

const DEFAULT_IMAGE = '/images/logofavicon3.png';
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
const MAX_CANVAS_SIZE = 1920; // Maximum canvas dimension

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  maxFileSize?: number;
}

/**
 * Compresses an image file and returns a compressed blob
 */
export const compressImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxFileSize = MAX_IMAGE_SIZE,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Ensure we don't exceed canvas limits
        if (width > MAX_CANVAS_SIZE) {
          height = Math.round((height * MAX_CANVAS_SIZE) / width);
          width = MAX_CANVAS_SIZE;
        }
        if (height > MAX_CANVAS_SIZE) {
          width = Math.round((width * MAX_CANVAS_SIZE) / height);
          height = MAX_CANVAS_SIZE;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Fill with white background for transparency handling
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try to compress with different quality levels until size requirement is met
        let currentQuality = quality;
        const maxAttempts = 5;
        let attempt = 0;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not create image blob'));
                return;
              }

              // If file is small enough, use it
              if (blob.size <= maxFileSize || attempt >= maxAttempts - 1) {
                resolve(blob);
                return;
              }

              // Try again with lower quality
              attempt++;
              currentQuality = quality * (1 - attempt * 0.15);
              tryCompress();
            },
            'image/jpeg',
            currentQuality
          );
        };

        tryCompress();
      };

      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Could not read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Converts blob to File
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
};

/**
 * Gets the appropriate image source with fallback
 * Handles:
 * - No image: returns default
 * - Full URLs (http/https): returns as-is with cache busting
 * - Root paths (/): prepends backend base URL if needed
 * - Relative paths: returns as /uploads/filename with backend URL
 * - Adds timestamp query param to bypass browser cache on updates
 */
export const getImageSource = (
  imageUrl: string | undefined,
  cacheBust: boolean = true
): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return DEFAULT_IMAGE;
  }

  const trimmedUrl = imageUrl.trim();
  let finalUrl = '';
  const IS_TAURI = typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || window.location.hostname === 'tauri.localhost' || window.location.protocol === 'tauri:');
  const apiBase = (import.meta as any).env?.VITE_API_BASE || (IS_TAURI ? 'http://localhost:14234' : window.location.origin);

  // If it's a full URL (starts with http or https), use as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    finalUrl = trimmedUrl;
  }
  // If it's a path starting with / (like /uploads/file.jpg), prepend API base
  else if (trimmedUrl.startsWith('/')) {
    finalUrl = `${apiBase}${trimmedUrl}`;
  }
  // If it's a data URL (base64 image), use as is (no cache bust needed)
  else if (trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }
  // Otherwise, treat as uploaded image filename in uploads folder
  else {
    finalUrl = `${apiBase}/uploads/${trimmedUrl}`;
  }

  // Add cache busting parameter to force fresh load on updates
  // This ensures edited images show immediately, not cached version
  if (cacheBust && !finalUrl.includes('data:')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}t=${Date.now()}`;
  }

  return finalUrl;
};

/**
 * Formats file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validates image file
 */
export const validateImageFile = (
  file: File,
  maxSizeKB: number = 5000
): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no válido. Usa: JPG, PNG, WEBP o GIF',
    };
  }

  const maxBytes = maxSizeKB * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Archivo muy grande. Máximo: ${maxSizeKB}KB (tu archivo: ${formatFileSize(file.size)})`,
    };
  }

  return { valid: true };
};

/**
 * Preloads an image and returns a promise that resolves when loaded
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Gets optimal image size for container
 */
export const getOptimalImageSize = (containerWidth: number): number => {
  if (containerWidth <= 300) return 300;
  if (containerWidth <= 600) return 600;
  if (containerWidth <= 900) return 900;
  return 1200;
};
