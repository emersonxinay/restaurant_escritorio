# Hazuki Backend - Express + TypeScript

Backend de la aplicación del Restaurante Hazuki Quilín construido con Express.js y TypeScript.

## Requisitos Previos

- Node.js >= 16.x
- PostgreSQL >= 12.x
- npm o yarn

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos:

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hazuki_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=tu_clave_secreta_muy_larga
JWT_EXPIRY=7d

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=2097152

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Crear la base de datos PostgreSQL

```bash
createdb hazuki_db
```

O usa pgAdmin/DBeaver para crear la base de datos.

## Ejecución

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

### Documentación de la API

La documentación interactiva de Swagger está disponible en:

**http://localhost:5000/api/docs**

En esta interfaz puedes:
- Ver todos los endpoints disponibles
- Probar cada endpoint directamente
- Ver esquemas de request y response
- Autenticarte con tokens JWT
- Descargar la especificación OpenAPI

También puedes consultar: `backend/SWAGGER_DOCUMENTATION.md` para documentación en markdown

### Compilar TypeScript

```bash
npm run build
```

### Producción

```bash
npm start
```

## Estructura de Carpetas

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts           # Configuración Sequelize + PostgreSQL
│   │   ├── swagger.ts            # Configuración Swagger/OpenAPI
│   │   └── constants.ts          # Constantes de la aplicación
│   │
│   ├── models/                   # Modelos Sequelize
│   │   ├── User.ts
│   │   ├── Category.ts
│   │   ├── Product.ts
│   │   ├── Discount.ts
│   │   ├── Reservation.ts
│   │   └── index.ts
│   │
│   ├── routes/                   # Rutas API
│   │   ├── auth.ts               # POST register, login, create-admin, GET me
│   │   ├── public.ts             # GET home, carta, promociones, etc
│   │   ├── reservations.ts       # CRUD reservaciones
│   │   ├── orders.ts             # Órdenes y resumen
│   │   ├── admin.ts              # CRUD productos, categorías, dashboard
│   │   └── discounts.ts          # CRUD descuentos
│   │
│   ├── middleware/               # Middleware personalizado
│   │   ├── auth.ts               # Autenticación JWT + admin check
│   │   ├── upload.ts             # Multer para subidas de archivos
│   │   └── errorHandler.ts       # Manejo global de errores
│   │
│   ├── utils/
│   │   ├── imageProcessor.ts     # Validación y procesamiento de imágenes
│   │   └── validators.ts         # Validadores con express-validator
│   │
│   ├── types/
│   │   └── index.ts              # Tipos TypeScript globales
│   │
│   └── index.ts                  # Punto de entrada
│
├── uploads/                      # Carpeta de imágenes subidas (gitignored)
├── dist/                         # Código compilado (gitignored)
│
├── package.json                  # Dependencias npm
├── tsconfig.json                 # Configuración TypeScript
├── .sequelizerc                  # Configuración Sequelize CLI
├── .env                          # Variables de entorno (gitignored)
├── .env.example                  # Ejemplo de variables de entorno
├── .gitignore                    # Git ignore rules
├── README.md                     # Esta documentación
└── SWAGGER_DOCUMENTATION.md      # Documentación de endpoints (formato markdown)
```

## Endpoints API

### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/create-admin` - Crear administrador (solo si no existe)
- `GET /api/auth/me` - Obtener usuario actual (requiere token)
- `POST /api/auth/logout` - Cerrar sesión

### Públicos

- `GET /api/public/home` - Página de inicio con productos
- `GET /api/public/carta` - Menú completo
- `GET /api/public/promociones` - Promociones activas
- `GET /api/public/nosotros` - Información del restaurante
- `GET /api/public/categories` - Obtener todas las categorías
- `GET /api/public/products` - Obtener productos (con filtro opcional)
- `GET /api/public/discount/current` - Descuento activo actual

### Reservaciones (requiere autenticación)

- `POST /api/reservations` - Crear reservación
- `GET /api/reservations` - Obtener todas las reservaciones
- `GET /api/reservations/:id` - Obtener una reservación
- `DELETE /api/reservations/:id` - Eliminar reservación

### Pedidos/Órdenes

- `POST /api/orders/summary` - Obtener resumen de pedido
- `POST /api/orders` - Crear pedido

### Administración (requiere admin)

#### Categorías
- `GET /api/admin/categories` - Listar categorías
- `POST /api/admin/categories` - Crear categoría
- `PUT /api/admin/categories/:id` - Actualizar categoría
- `DELETE /api/admin/categories/:id` - Eliminar categoría

#### Productos
- `GET /api/admin/products` - Listar productos
- `POST /api/admin/products` - Crear producto (con subida de imagen)
- `PUT /api/admin/products/:id` - Actualizar producto
- `DELETE /api/admin/products/:id` - Eliminar producto

#### Descuentos
- `POST /api/discounts` - Crear descuento
- `GET /api/discounts/:id` - Obtener descuento
- `PUT /api/discounts/:id` - Actualizar descuento
- `POST /api/discounts/:id/stop` - Detener descuento
- `POST /api/discounts/:id/reactivate` - Reactivar descuento
- `DELETE /api/discounts/:id` - Eliminar descuento
- `GET /api/discounts/history` - Historial de descuentos

#### Dashboard
- `GET /api/admin/dashboard` - Estadísticas del dashboard

## Modelos de Base de Datos

### User
```typescript
{
  id: number (PK)
  username: string (unique)
  password_hash: string
  is_admin: boolean
}
```

### Category
```typescript
{
  id: number (PK)
  name: string (unique)
}
```

### Product
```typescript
{
  id: number (PK)
  name: string
  description: string
  price: float
  image_url: string
  category_id: number (FK)
}
```

### Discount
```typescript
{
  id: number (PK)
  title: string
  percentage: number (5-50)
  start_date: date
  end_date: date
  start_time: time (opcional)
  end_time: time (opcional)
  is_active: boolean
  auto_apply: boolean
  status: enum (programmed, active, expired, cancelled)
  created_by_admin_id: number (FK)
  created_at: datetime
  updated_at: datetime
}
```

### Reservation
```typescript
{
  id: number (PK)
  name: string
  email: string
  date: date
  time: time
  people: number
  details: string
  qr_code: text (base64)
}
```

## Autenticación

El backend usa JWT (JSON Web Tokens) para autenticación:

1. El usuario se registra o inicia sesión
2. El servidor devuelve un token JWT
3. El cliente incluye el token en el header `Authorization: Bearer {token}`
4. El servidor valida el token en cada request protegido

## Subida de Archivos

- Ubicación: `uploads/`
- Formatos permitidos: PNG, JPG, JPEG, GIF, WEBP
- Tamaño máximo: 2MB
- Los archivos se guardan con timestamp para evitar colisiones

## Validaciones

- Las fechas de reservación deben estar entre hoy y 60 días en el futuro
- Los horarios de reservación válidos son: 13:00-17:00 y 18:00-21:30
- Los descuentos tienen porcentaje entre 5% y 50%
- No se pueden crear descuentos que se solapen entre sí

## Scripts Disponibles

```bash
npm run dev          # Ejecutar en modo desarrollo con hot reload
npm run build        # Compilar TypeScript a JavaScript
npm start            # Ejecutar la versión compilada
npm run typecheck    # Verificar tipos TypeScript
```

## Errores Comunes

### Error de conexión a BD
- Verifica que PostgreSQL esté corriendo
- Comprueba las credenciales en `.env`
- Asegúrate de que la BD existe

### Puerto 5000 ya en uso
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Token expirado
- Los tokens por defecto expiran en 7 días
- El usuario necesita iniciar sesión de nuevo

## Migración desde Flask

Este proyecto es la migración de una aplicación Flask original a Express.js con TypeScript.

**Cambios principales:**
- ORM: SQLAlchemy → Sequelize
- Autenticación: Flask-Login → JWT
- Validaciones: Jinja2 filters → Middleware
- Estructura: Monolítica → Separado por rutas

**Todas las funcionalidades se mantienen:**
- ✅ Autenticación y autorización
- ✅ CRUD de productos y categorías
- ✅ Sistema de reservaciones con QR
- ✅ Sistema de descuentos avanzado
- ✅ Subida de imágenes
- ✅ Validaciones complejas

## Deployment

### Vercel
```bash
vercel deploy
```

### Heroku
```bash
heroku create nombre-app
git push heroku main
```

### Docker
```bash
docker build -t hazuki-backend .
docker run -p 5000:5000 hazuki-backend
```

## Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.

## Licencia

ISC
