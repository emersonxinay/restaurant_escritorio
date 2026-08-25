# Hazuki Frontend - React + Vite + Tailwind CSS

Frontend de la aplicación del Restaurante Hazuki Quilín construido con React 18, Vite y Tailwind CSS.

## Requisitos Previos

- Node.js >= 16.x
- npm o yarn
- Backend corriendo en `http://localhost:5000` (ver backend README)

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus variables:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Hazuki Quilin
```

## Ejecución

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

El Vite proxy automáticamente enruta `/api/*` a `http://localhost:5000/api/*`

### Build para producción

```bash
npm run build
```

Genera los archivos optimizados en la carpeta `dist/`

### Preview de producción

```bash
npm run preview
```

## Estructura de Carpetas

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   ├── pages/           # Páginas (rutas principales)
│   │   ├── HomePage.tsx
│   │   ├── auth/
│   │   ├── reservations/
│   │   ├── orders/
│   │   ├── admin/
│   │   └── ...
│   ├── layouts/         # Layouts (MainLayout, AdminLayout)
│   ├── hooks/           # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePublic.ts
│   │   └── ...
│   ├── stores/          # Zustand stores (estado global)
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── ...
│   ├── lib/            # Utilidades
│   │   ├── api.ts      # Cliente HTTP (axios)
│   │   └── ...
│   ├── App.tsx         # Componente principal
│   ├── main.tsx        # Punto de entrada
│   └── index.css       # Estilos globales
├── index.html
├── vite.config.ts      # Configuración Vite
├── tailwind.config.js  # Configuración Tailwind
├── postcss.config.js
├── package.json
└── tsconfig.json
```

## Características

### Autenticación

- ✅ Registro de usuarios
- ✅ Login/Logout
- ✅ Creación de administrador (primera vez)
- ✅ Gestión de tokens JWT con Zustand
- ✅ Rutas protegidas

### Carrito de Compras

- ✅ Agregar/remover productos
- ✅ Actualizar cantidades
- ✅ Persistencia en localStorage
- ✅ Contador de items en navbar

### Reservaciones

- ✅ Formulario de reservación con validaciones
- ✅ Confirmación con código QR
- ✅ Historial de reservaciones
- ✅ Validación de fechas y horarios

### Panel de Administración

- ✅ Dashboard con estadísticas
- ✅ CRUD de productos con subida de imágenes
- ✅ CRUD de categorías
- ✅ Gestión de descuentos
- ✅ Historial de descuentos

### SEO

- ✅ React Helmet para meta tags dinámicos
- ✅ Open Graph
- ✅ Schema.org JSON-LD
- ✅ Sitemap

### Responsividad

- ✅ Mobile first design
- ✅ Breakpoints tailwind (sm, md, lg, xl)
- ✅ Menú hamburguesa en mobile

## Gestión de Estado (Zustand)

### authStore

```typescript
{
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login(token, user)
  logout()
  setUser(user)
}
```

Uso:
```typescript
import { useAuthStore } from '@/stores/authStore'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthStore()
}
```

### cartStore

```typescript
{
  items: CartItem[]
  addItem(item)
  removeItem(id)
  updateQuantity(id, quantity)
  clearCart()
  getTotalPrice()
  getTotalItems()
}
```

Uso:
```typescript
import { useCartStore } from '@/stores/cartStore'

function Cart() {
  const { items, getTotalPrice } = useCartStore()
}
```

## Hooks Personalizados

### useAuth()

```typescript
const {
  user,
  token,
  isAuthenticated,
  isAdmin,
  register,
  login,
  logout,
  createAdmin,
  getMe
} = useAuth()
```

### usePublic()

```typescript
const {
  categories,
  products,
  loading,
  error,
  fetchHome,
  fetchCarta,
  fetchPromociones,
  fetchProducts,
  fetchCategories
} = usePublic()
```

## Cliente HTTP (API)

El módulo `lib/api.ts` configura axios con:

- Base URL automática desde `VITE_API_URL`
- Interceptor de autenticación (agrega token automáticamente)
- Interceptor de errores (logout si token expira)

```typescript
import api from '@/lib/api'

// GET
const response = await api.get('/public/products')

// POST
const response = await api.post('/auth/login', { username, password })

// PUT
const response = await api.put('/admin/products/1', { name, price })

// DELETE
const response = await api.delete('/admin/products/1')
```

## Tailwind CSS

### Colores personalizados

```css
primary: #FF6B35  (Naranja)
secondary: #004E89 (Azul)
accent: #F7931E   (Dorado)
```

### Componentes Tailwind personalizados

Definidos en `src/index.css`:

```html
<!-- Botones -->
<button class="btn-primary">Botón primario</button>
<button class="btn-secondary">Botón secundario</button>
<button class="btn-ghost">Botón ghost</button>

<!-- Inputs -->
<input class="input-field" type="text" />

<!-- Cards -->
<div class="card">Contenido</div>

<!-- Badge -->
<span class="badge">Nuevo</span>
```

## Páginas Disponibles

### Públicas
- `/` - Página de inicio
- `/carta` - Menú completo
- `/promociones` - Promociones activas
- `/nosotros` - Información del restaurante
- `/login` - Iniciar sesión
- `/register` - Registrarse
- `/create-admin` - Crear administrador (si no existe)

### Protegidas (requiere login)
- `/reserve` - Hacer una reservación
- `/reservations` - Ver mis reservaciones
- `/reservations/:id` - Confirmar reservación
- `/order` - Crear pedido
- `/order-summary` - Resumen del pedido

### Admin (requiere admin)
- `/admin/dashboard` - Panel principal
- `/admin/products` - Gestionar productos
- `/admin/categories` - Gestionar categorías
- `/admin/discounts` - Gestionar descuentos

## Scripts Disponibles

```bash
npm run dev        # Ejecutar en desarrollo
npm run build      # Compilar para producción
npm run preview    # Ver build en local
npm run lint       # Verificar código
```

## Implementación de Componentes Pendientes

Para completar la migración, es necesario crear los siguientes componentes:

### Componentes de Páginas

- [x] HomePage
- [ ] CartaPage
- [ ] PromocionesPage
- [ ] NosotrosPage
- [ ] auth/LoginPage
- [ ] auth/RegisterPage
- [ ] auth/CreateAdminPage
- [ ] reservations/ReservePage
- [ ] reservations/ReservationsPage
- [ ] reservations/ReservationConfirmPage
- [ ] orders/OrderPage
- [ ] orders/OrderSummaryPage
- [ ] admin/AdminDashboard
- [ ] admin/AdminProducts
- [ ] admin/AdminCategories
- [ ] admin/AdminDiscounts

Cada componente de página debe:
1. Usar hooks personalizados para obtener datos
2. Manejar estados de loading y error
3. Usar Zustand para estado global
4. Implementar validaciones con react-hook-form o similar

### Componentes Reutilizables

Además de Navbar y Footer, crear:

- ProductCard
- CategorySelector
- DiscountBadge
- ReservationForm
- ProductForm
- DiscountForm
- LoadingSpinner
- ErrorAlert
- ConfirmDialog
- etc.

## Validaciones de Formularios

Se recomienda usar `react-hook-form` para validaciones complejas:

```bash
npm install react-hook-form
```

Ejemplo:
```typescript
import { useForm } from 'react-hook-form'

function LoginPage() {
  const { register, handleSubmit, errors } = useForm()

  const onSubmit = async (data) => {
    await login(data.username, data.password)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username', { required: true })} />
      {errors.username && <span>Este campo es requerido</span>}
    </form>
  )
}
```

## Testing

Para agregar tests, instala dependencias:

```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

## Errores Comunes

### Error CORS
- Asegúrate de que el backend está corriendo en puerto 5000
- Verifica que `CORS_ORIGIN` en backend sea correcto

### Token no se persiste
- Zustand persist está habilitado en authStore
- Los datos se guardan en localStorage automáticamente

### Imágenes no cargan
- Verifica que las imágenes estén en `backend/uploads/`
- El endpoint `/uploads` debe estar configurado en el backend

## Migración desde Flask Templates

Los templates originales de Jinja2 se han convertido a componentes React:

**Conversión de Jinja2 → React:**
- `{% for item in items %}` → `.map()`
- `{% if condition %}` → `{condition && <Component />}`
- `{{ variable }}` → `{variable}`
- `{% extends "base.html" %}` → Layouts (MainLayout, AdminLayout)
- Filtros Jinja2 → Hooks personalizados

## Deployment

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

Configura en Vercel:
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables en Vercel dashboard

### Netlify

```bash
npm install -D netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages

Requiere cambios en vite.config.ts para la ruta base.

## Performance

- ✅ Code splitting automático con Vite
- ✅ Lazy loading de rutas con React.lazy
- ✅ Optimización de imágenes
- ✅ Minificación automática en build
- ✅ Tree shaking de dependencies no usadas

## Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.

## Licencia

ISC
