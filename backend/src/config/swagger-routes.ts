/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "nuevo_usuario"
 *               password:
 *                 type: string
 *                 example: "contraseña123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     is_admin:
 *                       type: boolean
 *       409:
 *         description: Usuario ya existe
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión (Devuelve JWT Token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "usuario"
 *               password:
 *                 type: string
 *                 example: "contraseña123"
 *     responses:
 *       200:
 *         description: Login exitoso - Devuelve JWT Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: "JWT Token - Usar en header Authorization: Bearer {token}"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     is_admin:
 *                       type: boolean
 *       401:
 *         description: Credenciales inválidas
 */

/**
 * @swagger
 * /api/auth/create-admin:
 *   post:
 *     summary: Crear primer administrador (Devuelve JWT Token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       201:
 *         description: Admin creado exitosamente - Devuelve JWT Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin created successfully"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: "JWT Token - Usar en header Authorization: Bearer {token}"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     is_admin:
 *                       type: boolean
 *       409:
 *         description: Admin ya existe
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *       401:
 *         description: No autenticado
 */

/**
 * @swagger
 * /api/public/home:
 *   get:
 *     summary: Página de inicio con productos
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Datos de la página de inicio
 */

/**
 * @swagger
 * /api/public/carta:
 *   get:
 *     summary: Obtener menú completo
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Menú con productos por categoría
 */

/**
 * @swagger
 * /api/public/promociones:
 *   get:
 *     summary: Obtener promociones activas
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Lista de promociones
 */

/**
 * @swagger
 * /api/public/categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Lista de categorías
 */

/**
 * @swagger
 * /api/public/products:
 *   get:
 *     summary: Obtener productos
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filtrar por categoría
 *     responses:
 *       200:
 *         description: Lista de productos
 */

/**
 * @swagger
 * /api/public/discount/current:
 *   get:
 *     summary: Obtener descuento activo actual
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Descuento activo o null
 */

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Crear una reservación
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               people:
 *                 type: integer
 *               details:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reservación creada
 *       400:
 *         description: Datos inválidos
 *   get:
 *     summary: Obtener todas las reservaciones
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reservaciones
 */

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Obtener una reservación específica
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la reservación
 *       404:
 *         description: Reservación no encontrada
 *   delete:
 *     summary: Eliminar una reservación
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservación eliminada
 *       404:
 *         description: Reservación no encontrada
 */

/**
 * @swagger
 * /api/orders/summary:
 *   post:
 *     summary: Obtener resumen de pedido
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               quantities:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Resumen del pedido
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear un pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               quantities:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Pedido creado
 */

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 *       403:
 *         description: No es administrador
 *   post:
 *     summary: Crear una categoría
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada
 *       403:
 *         description: No es administrador
 */

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     summary: Actualizar una categoría
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       404:
 *         description: Categoría no encontrada
 *   delete:
 *     summary: Eliminar una categoría
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       404:
 *         description: Categoría no encontrada
 */

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos
 *       403:
 *         description: No es administrador
 *   post:
 *     summary: Crear un producto
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category_id:
 *                 type: integer
 *               image_file:
 *                 type: string
 *                 format: binary
 *               img_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Producto creado
 *       403:
 *         description: No es administrador
 */

/**
 * @swagger
 * /api/admin/products/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category_id:
 *                 type: integer
 *               image_file:
 *                 type: string
 *                 format: binary
 *               img_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: Producto no encontrado
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       404:
 *         description: Producto no encontrado
 */

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     summary: Crear un descuento
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               percentage:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *               auto_apply:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Descuento creado
 *       403:
 *         description: No es administrador
 */

/**
 * @swagger
 * /api/discounts/{id}:
 *   get:
 *     summary: Obtener un descuento específico
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del descuento
 *       404:
 *         description: Descuento no encontrado
 *   put:
 *     summary: Actualizar un descuento
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               percentage:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Descuento actualizado
 *   delete:
 *     summary: Eliminar un descuento
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Descuento eliminado
 */

/**
 * @swagger
 * /api/discounts/{id}/stop:
 *   post:
 *     summary: Detener un descuento
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Descuento detenido
 */

/**
 * @swagger
 * /api/discounts/{id}/reactivate:
 *   post:
 *     summary: Reactivar un descuento
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Descuento reactivado
 */

/**
 * @swagger
 * /api/discounts/history:
 *   get:
 *     summary: Obtener historial de descuentos
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Número de días de historial
 *     responses:
 *       200:
 *         description: Historial de descuentos
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del dashboard
 *       403:
 *         description: No es administrador
 */
