import { URL } from 'url';

const predefinedImages = [
  'logohazukifavicon.png', '40piezas.jpg', 'aji_de_gallina.jpg',
  'cevicheroll-hazuki.jpg', 'logofavicon.png', 'logofavicon1.png',
  'logofavicon3.png', 'logonavhazuki.png', 'sashimi.jpg', 'tempuras.jpg'
];

export const validateImageUrl = (imageUrl: string): string => {
  if (!imageUrl) {
    return 'logofavicon.png';
  }

  // URL externa completa
  if (imageUrl.startsWith('http')) {
    try {
      const parsed = new URL(imageUrl);

      // Verificar que no sea localhost o IP privada
      if (
        parsed.hostname.startsWith('localhost') ||
        parsed.hostname.startsWith('127.0.0.1') ||
        parsed.hostname.startsWith('192.168.') ||
        parsed.hostname.startsWith('10.')
      ) {
        return 'logofavicon.png';
      }

      // Verificar extensión
      const extensionMatch = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(parsed.pathname);
      if (!extensionMatch) {
        return 'logofavicon.png';
      }

      return imageUrl;
    } catch {
      return 'logofavicon.png';
    }
  }

  // Ruta estática completa
  if (imageUrl.startsWith('/static') || imageUrl.startsWith('./static')) {
    return imageUrl;
  }

  // Solo nombre de archivo
  const sanitized = imageUrl.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!/^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|gif|webp)$/i.test(sanitized)) {
    return 'logofavicon.png';
  }

  return sanitized;
};

export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) {
    return '/images/logofavicon3.png';
  }

  // If it's a full HTTP URL, return as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // If it's already a path starting with /, return as-is
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // If it's a predefined image, serve from /images
  if (predefinedImages.includes(imageUrl)) {
    return `/images/${imageUrl}`;
  }

  // Default: serve uploaded file from /uploads endpoint
  return `/uploads/${imageUrl}`;
};

export const processImageUpload = (
  filename: string | undefined,
  imageUrl: string | undefined
): string => {
  if (filename) {
    return filename;
  }

  if (imageUrl) {
    return validateImageUrl(imageUrl);
  }

  return 'logofavicon.png';
};
