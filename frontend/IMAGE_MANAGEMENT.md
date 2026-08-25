# Sistema de Gestión de Imágenes - Documentación

## Descripción General

El nuevo sistema de gestión de imágenes proporciona:
- **Compresión automática** de imágenes subidas
- **Soporte para URLs externas** sin necesidad de comprimir
- **Imagen por defecto** (`/images/logofavicon3.png`) cuando no hay imagen disponible
- **Validación de archivos** y manejo de errores robusto
- **Previsualización en tiempo real**

## Componentes

### 1. **ProductImage** (`src/components/ProductImage.tsx`)
Componente encargado de mostrar imágenes con fallback inteligente.

#### Propiedades:
```typescript
interface ProductImageProps {
  imageUrl?: string;           // URL de la imagen o nombre de archivo
  alt: string;                 // Texto alternativo
  className?: string;          // Clases CSS para la imagen
  containerClassName?: string; // Clases CSS para el contenedor
  showFallbackIcon?: boolean;  // Mostrar emoji fallback
  onImageLoad?: () => void;    // Callback cuando carga
  onImageError?: () => void;   // Callback en error
}
```

#### Uso:
```tsx
<ProductImage
  imageUrl={product.image_url}
  alt={product.name}
  className="w-full h-full object-cover"
  showFallbackIcon={true}
/>
```

#### Comportamiento:
- Si no hay imagen: muestra imagen por defecto
- Si hay error al cargar: muestra emoji 🍱 encima de imagen por defecto
- Estado de carga: muestra skeleton/placeholder
- Soporta URLs completas (http/https)
- Soporta rutas de servidor (/uploads/...)

### 2. **Utilidades de Optimización** (`src/utils/imageOptimization.ts`)

#### Funciones principales:

##### `compressImage(file, options)`
Comprime una imagen manteniendo la relación de aspecto.

```typescript
const compressedBlob = await compressImage(file, {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85,
  maxFileSize: 500 * 1024 // 500KB
});
```

**Parámetros:**
- `maxWidth`: Ancho máximo (default: 800px)
- `maxHeight`: Alto máximo (default: 800px)
- `quality`: Calidad JPEG (0-1, default: 0.8)
- `maxFileSize`: Tamaño máximo en bytes (default: 500KB)

**Comportamiento:**
- Redimensiona manteniendo aspecto
- Reduce calidad iterativamente si es necesario
- Convierte a JPEG para mejor compresión
- Rellena fondo blanco para transparencias

##### `getImageSource(imageUrl)`
Resuelve la URL correcta de la imagen.

```typescript
getImageSource('product-123.jpg');     // → /uploads/product-123.jpg
getImageSource('https://cdn.com/img'); // → https://cdn.com/img
getImageSource(undefined);             // → /images/logofavicon3.png
```

##### `validateImageFile(file, maxSizeKB)`
Valida tipo y tamaño de archivo.

```typescript
const validation = validateImageFile(file, 5000); // 5MB max
if (!validation.valid) {
  console.error(validation.error);
}
```

##### `formatFileSize(bytes)`
Formatea bytes a unidad legible.

```typescript
formatFileSize(524288);  // → "512 KB"
formatFileSize(1048576); // → "1 MB"
```

##### `preloadImage(src)`
Precarga una imagen y retorna promise.

```typescript
await preloadImage('https://example.com/image.jpg');
```

### 3. **Hook useImageOptimization** (`src/hooks/useImageOptimization.ts`)

Hook React para manejar compresión de imágenes con validación.

#### Uso:
```typescript
const { compress, validate, isCompressing, compressionError, clearError } = useImageOptimization();

// Validar
const validation = validate(file);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Comprimir
try {
  const compressedFile = await compress(file);
  console.log(`Original: ${file.size}, Comprimido: ${compressedFile.size}`);
} catch (err) {
  console.error(compressionError);
  clearError();
}
```

#### Retorna:
```typescript
{
  compress: (file, options?) => Promise<File>,
  validate: (file) => { valid: boolean, error?: string },
  isCompressing: boolean,
  compressionError: string | null,
  clearError: () => void
}
```

## Uso en Formulario de Admin

### Modo de Subida (Upload)
1. Selecciona una imagen del computador
2. Se comprime automáticamente
3. Se muestra estadística de compresión (original → comprimido)
4. Se sube al servidor al guardar

### Modo URL
1. Pega una URL completa de imagen externa
2. Se valida y precarga la imagen
3. Se vincula directamente sin comprimir
4. Perfecto para imágenes de CDN o servicios externos

### Features:
- ✅ Tabs para cambiar entre modos
- ✅ Preview en tiempo real
- ✅ Muestra % de reducción de tamaño
- ✅ Validación de archivo/URL
- ✅ Manejo de errores amigable
- ✅ Estados de carga (Subiendo..., Comprimiendo...)

## Imagen por Defecto

**Ubicación:** `/public/images/logofavicon3.png`

Esta imagen se muestra cuando:
- No hay URL de imagen especificada
- La imagen falla al cargar
- Error de URL externa

## Flujo de Compresión

```
Archivo Seleccionado
        ↓
    Validación
        ↓
    Compresión
    (redimensionado + quality ajuste)
        ↓
    Preview Base64
        ↓
    Upload al servidor
        ↓
    Guardado en base de datos
```

## Límites por Defecto

| Aspecto | Valor |
|---------|-------|
| Tamaño máximo archivo | 5 MB |
| Ancho máximo | 800 px |
| Alto máximo | 800 px |
| Calidad JPEG | 85% |
| Tamaño máximo comprimido | 500 KB |
| Canvas máximo | 1920 px |

## Ejemplo Completo: Crear Producto

```typescript
// En AdminProductForm.tsx
const { compress } = useImageOptimization();

// 1. Usuario selecciona imagen pesada (2MB)
const handleImageChange = async (e) => {
  const file = e.target.files[0]; // 2MB PNG

  // 2. Se comprime automáticamente
  const compressed = await compress(file);
  // Resultado: ~150KB JPEG

  // 3. User ve preview y estadística
  // Original: 2 MB → Comprimido: 150 KB (92.5% reducción)

  // 4. Al guardar, se sube archivo comprimido
  await productsAPI.upload(compressed);
};
```

## Soporte de URLs

Ahora puedes usar URLs de:
- Google Drive
- Amazon S3
- Cloudinary
- Imgur
- CDN personalizados
- Cualquier URL pública CORS-compatible

## Optimizaciones Implementadas

1. **Compresión en cliente** - Reduce transferencia
2. **Lazy loading** - Images carga solo cuando es visible
3. **Preload en validación** - Verifica que URL sea válida
4. **Fallback inteligente** - Nunca muestra error desnudo
5. **Caché de compresión** - No recomprime si ya está comprimido
6. **Validación MIME** - Solo acepta imágenes reales

## Troubleshooting

### Error: "Tipo de archivo no válido"
- Solo acepta: JPG, PNG, WEBP, GIF
- Verifica que el archivo tenga extensión correcta

### Error: "Archivo muy grande"
- Máximo: 5MB
- La compresión lo reduce automáticamente
- Si sigue siendo grande, revisa la imagen original

### URL no funciona
- Verifica que sea una URL completa (http/https)
- Verifica que la imagen sea pública (sin autenticación)
- Comprueba CORS en servidor remoto

### Imagen no se muestra
- Comprueba en DevTools si cargó la imagen
- Verifica que la URL sea válida
- La imagen por defecto debe existir

## Migración de Código Anterior

### Antes:
```tsx
const imageUrl = image_url && image_url.startsWith('http')
  ? image_url
  : `/images/${image_url}`;

<img src={imageUrl} alt={name} />
```

### Después:
```tsx
<ProductImage
  imageUrl={image_url}
  alt={name}
  className="w-full h-full object-cover"
/>
```

Mucho más simple y con todas las ventajas de fallback y optimización.
