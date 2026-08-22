# Documentación de la API - Swagger

La documentación de la API está disponible en: **http://localhost:5000/api/docs**

## 📚 Guía de Endpoints

### Autenticación

#### 1. Registrar Usuario
- **Método:** `POST`
- **URL:** `/api/auth/register`
- **Descripción:** Registra un nuevo usuario en el sistema
- **Body:**
  ```json
  {
    "username": "usuario123",
    "password": "contraseña123"
  }
  ```
- **Respuesta (201):**
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "username": "usuario123",
      "is_admin": false
    }
  }
  ```
- **Errores:**
  - 400: Username o password requeridos
  - 409: Username ya existe

#### 2. Iniciar Sesión
- **Método:** `POST`
- **URL:** `/api/auth/login`
- **Descripción:** Autentica un usuario y devuelve token JWT
- **Body:**
  ```json
  {
    "username": "usuario123",
    "password": "contraseña123"
  }
  ```
- **Respuesta (200):**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "usuario123",
      "is_admin": false
    }
  }
  ```
- **Errores:**
  - 400: Username o password requeridos
  - 401: Usuario o contraseña incorrectos

#### 3. Crear Administrador (solo si no existe)
- **Método:** `POST`
- **URL:** `/api/auth/create-admin`
- **Descripción:** Crea el primer administrador del sistema
- **Body:**
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Respuesta (201):**
  ```json
  {
    "message": "Admin created successfully",
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "is_admin": true
    }
  }
  ```
- **Errores:**
  - 409: Admin ya existe

#### 4. Obtener Usuario Actual
- **Método:** `GET`
- **URL:** `/api/auth/me`
- **Autenticación:** Requiere token Bearer
- **Header:**
  ```
  Authorization: Bearer {token}
  ```
- **Respuesta (200):**
  ```json
  {
    "user": {
      "id": 1,
      "username": "usuario123",
      "is_admin": false
    }
  }
  ```

#### 5. Cerrar Sesión
- **Método:** `POST`
- **URL:** `/api/auth/logout`
- **Autenticación:** Requiere token Bearer
- **Respuesta (200):**
  ```json
  {
    "message": "Logout successful"
  }
  ```

---

### Rutas Públicas

#### 1. Página de Inicio
- **Método:** `GET`
- **URL:** `/api/public/home`
- **Descripción:** Obtiene productos y categorías para la página de inicio
- **Respuesta (200):**
  ```json
  {
    "categories": [...],
    "products_by_category": {...},
    "active_discount": {...}
  }
  ```

#### 2. Menú Completo
- **Método:** `GET`
- **URL:** `/api/public/carta`
- **Descripción:** Obtiene todos los productos agrupados por categoría
- **Respuesta (200):**
  ```json
  {
    "categories": [...],
    "products_by_category": {...}
  }
  ```

#### 3. Promociones
- **Método:** `GET`
- **URL:** `/api/public/promociones`
- **Descripción:** Obtiene productos de la categoría "Promociones"
- **Respuesta (200):**
  ```json
  {
    "category": {...},
    "products": [...]
  }
  ```

#### 4. Información del Restaurante
- **Método:** `GET`
- **URL:** `/api/public/nosotros`
- **Respuesta (200):**
  ```json
  {
    "title": "Nosotros",
    "description": "Información sobre el restaurante Hazuki"
  }
  ```

#### 5. Categorías
- **Método:** `GET`
- **URL:** `/api/public/categories`
- **Descripción:** Obtiene todas las categorías
- **Respuesta (200):**
  ```json
  {
    "categories": [...]
  }
  ```

#### 6. Productos
- **Método:** `GET`
- **URL:** `/api/public/products?category_id=1`
- **Query Parameters:**
  - `category_id` (opcional): Filtrar por categoría
- **Respuesta (200):**
  ```json
  {
    "products": [...]
  }
  ```

#### 7. Descuento Activo Actual
- **Método:** `GET`
- **URL:** `/api/public/discount/current`
- **Respuesta (200):**
  ```json
  {
    "discount": {...} o null
  }
  ```

---

### Reservaciones

#### 1. Crear Reservación
- **Método:** `POST`
- **URL:** `/api/reservations`
- **Autenticación:** Requiere token Bearer
- **Body:**
  ```json
  {
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "date": "2024-12-25",
    "time": "19:00",
    "people": 4,
    "details": "Sin picante"
  }
  ```
- **Validaciones:**
  - Fecha máximo 60 días en el futuro
  - Horarios: 13:00-17:00 o 18:00-21:30
  - No pueden haber dos reservaciones a la misma hora
- **Respuesta (201):**
  ```json
  {
    "message": "Reservation created successfully",
    "reservation": {...}
  }
  ```

#### 2. Obtener Todas las Reservaciones
- **Método:** `GET`
- **URL:** `/api/reservations`
- **Autenticación:** Requiere token Bearer
- **Respuesta (200):**
  ```json
  {
    "reservations": [...]
  }
  ```

#### 3. Obtener una Reservación
- **Método:** `GET`
- **URL:** `/api/reservations/:id`
- **Autenticación:** Requiere token Bearer
- **Respuesta (200):**
  ```json
  {
    "reservation": {...}
  }
  ```

#### 4. Eliminar Reservación
- **Método:** `DELETE`
- **URL:** `/api/reservations/:id`
- **Autenticación:** Requiere token Bearer
- **Respuesta (200):**
  ```json
  {
    "message": "Reservation deleted successfully"
  }
  ```

---

### Órdenes/Pedidos

#### 1. Resumen de Pedido
- **Método:** `POST`
- **URL:** `/api/orders/summary`
- **Body:**
  ```json
  {
    "product_ids": [1, 2, 3],
    "quantities": [1, 2, 1]
  }
  ```
- **Respuesta (200):**
  ```json
  {
    "items": [...],
    "total_price": 125.50,
    "discount": {...}
  }
  ```

#### 2. Crear Pedido
- **Método:** `POST`
- **URL:** `/api/orders`
- **Autenticación:** Requiere token Bearer
- **Body:**
  ```json
  {
    "product_ids": [1, 2],
    "quantities": [1, 2]
  }
  ```
- **Respuesta (201):**
  ```json
  {
    "message": "Order received successfully",
    "order_id": 1702834800000
  }
  ```

---

### Administración

#### Categorías

##### 1. Listar Categorías
- **Método:** `GET`
- **URL:** `/api/admin/categories`
- **Autenticación:** Requiere admin
- **Respuesta (200):**
  ```json
  {
    "categories": [...]
  }
  ```

##### 2. Crear Categoría
- **Método:** `POST`
- **URL:** `/api/admin/categories`
- **Autenticación:** Requiere admin
- **Body:**
  ```json
  {
    "name": "Bebidas"
  }
  ```
- **Respuesta (201):**
  ```json
  {
    "message": "Category created successfully",
    "category": {...}
  }
  ```

##### 3. Actualizar Categoría
- **Método:** `PUT`
- **URL:** `/api/admin/categories/:id`
- **Autenticación:** Requiere admin
- **Body:**
  ```json
  {
    "name": "Bebidas y Licores"
  }
  ```

##### 4. Eliminar Categoría
- **Método:** `DELETE`
- **URL:** `/api/admin/categories/:id`
- **Autenticación:** Requiere admin

---

#### Productos

##### 1. Listar Productos
- **Método:** `GET`
- **URL:** `/api/admin/products`
- **Autenticación:** Requiere admin

##### 2. Crear Producto
- **Método:** `POST`
- **URL:** `/api/admin/products`
- **Autenticación:** Requiere admin
- **Content-Type:** multipart/form-data
- **Body:**
  ```
  name: "Ceviche"
  description: "Ceviche peruano tradicional"
  price: 25.50
  category_id: 1
  image_file: (archivo) // opcional
  img_url: "https://..." // opcional
  ```
- **Respuesta (201):**
  ```json
  {
    "message": "Product created successfully",
    "product": {...}
  }
  ```

##### 3. Actualizar Producto
- **Método:** `PUT`
- **URL:** `/api/admin/products/:id`
- **Autenticación:** Requiere admin

##### 4. Eliminar Producto
- **Método:** `DELETE`
- **URL:** `/api/admin/products/:id`
- **Autenticación:** Requiere admin

---

#### Descuentos

##### 1. Crear Descuento
- **Método:** `POST`
- **URL:** `/api/discounts`
- **Autenticación:** Requiere admin
- **Body:**
  ```json
  {
    "title": "Black Friday",
    "percentage": 30,
    "start_date": "2024-11-24",
    "end_date": "2024-11-26",
    "start_time": "00:00",
    "end_time": "23:59",
    "auto_apply": true
  }
  ```
- **Validaciones:**
  - Porcentaje: 5-50%
    - Fecha inicio no puede ser anterior a hoy
    - Fecha inicio no puede ser más de 30 días en el futuro
    - No puede haber descuentos superpuestos

##### 2. Obtener Descuento
- **Método:** `GET`
- **URL:** `/api/discounts/:id`
- **Autenticación:** Requiere admin

##### 3. Actualizar Descuento
- **Método:** `PUT`
- **URL:** `/api/discounts/:id`
- **Autenticación:** Requiere admin
- **Nota:** Solo si está en estado "programmed"

##### 4. Detener Descuento
- **Método:** `POST`
- **URL:** `/api/discounts/:id/stop`
- **Autenticación:** Requiere admin

##### 5. Reactivar Descuento
- **Método:** `POST`
- **URL:** `/api/discounts/:id/reactivate`
- **Autenticación:** Requiere admin

##### 6. Eliminar Descuento
- **Método:** `DELETE`
- **URL:** `/api/discounts/:id`
- **Autenticación:** Requiere admin
- **Nota:** No puede eliminar descuentos activos

##### 7. Historial de Descuentos
- **Método:** `GET`
- **URL:** `/api/discounts/history?days=30`
- **Autenticación:** Requiere admin
- **Query Parameters:**
  - `days` (opcional): Días de historial (default: 30)
- **Respuesta (200):**
  ```json
  {
    "history": [...],
    "upcoming": [...]
  }
  ```

---

#### Dashboard

##### 1. Obtener Estadísticas del Dashboard
- **Método:** `GET`
- **URL:** `/api/admin/dashboard`
- **Autenticación:** Requiere admin
- **Respuesta (200):**
  ```json
  {
    "stats": {
      "categories_count": 10,
      "products_count": 50,
      "reservations_count": 25,
      "users_count": 100
    },
    "active_discount": {...}
  }
  ```

---

## 🔐 Autenticación

### Bearer Token
Todos los endpoints protegidos requieren un token JWT en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Roles
- **Usuario regular:** Puede usar rutas públicas y crear reservaciones
- **Admin:** Acceso completo a todas las rutas

---

## 📊 Códigos de Respuesta

| Código | Significado |
|--------|------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Falta autenticación |
| 403 | Forbidden - Insuficientes permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: duplicado) |
| 500 | Internal Server Error - Error del servidor |

---

## 📝 Ejemplo de Flujo Completo

### 1. Registro
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan",
    "password": "pass123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan",
    "password": "pass123"
  }'
```

Guardar el token devuelto.

### 3. Hacer Reservación
```bash
curl -X POST http://localhost:5000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Juan",
    "email": "juan@email.com",
    "date": "2024-12-25",
    "time": "19:00",
    "people": 4,
    "details": "Mesa junto a la ventana"
  }'
```

---

## 🧪 Testing con Postman/Insomnia

1. Importar desde `/api/docs` (descarga OpenAPI JSON)
2. Crear variable `token` en el environment
3. Usar en headers: `Authorization: Bearer {{token}}`
4. Actualizar token después de login

---

## 📚 Ver Documentación Interactiva

Abre tu navegador en: **http://localhost:5000/api/docs**

Aquí puedes:
- ✅ Ver todos los endpoints
- ✅ Probar cada endpoint
- ✅ Ver esquemas de request/response
- ✅ Descargar OpenAPI JSON
- ✅ Guardar tokens en sesión

---

**Última actualización:** Noviembre 2024
**Versión:** 2.0 (Express + TypeScript)
