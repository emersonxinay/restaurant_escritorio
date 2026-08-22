# 📥 Importar Productos Masivamente

## Requisitos

1. Backend corriendo en puerto 3000
2. Base de datos sincronizada
3. Modelo `Category` actualizado con soporte para `parent_id`

---

## 🚀 Pasos

### 1. Detener el backend (si está corriendo)
```bash
# En la terminal del backend
Ctrl+C
```

### 2. Ejecutar el script de importación
```bash
cd /Users/emersonespinoza/Documents/proyectos/restaurant_hazuki_quilin/backend

# Compilar y ejecutar
npx tsx import-script.ts
```

### 3. Esperar a que termine
El script mostrará:
```
✓ Importación completada
  - Productos creados: 150
  - Errores: 0
  - Total categorías: 25
```

### 4. Reiniciar el backend
```bash
npm run dev
```

### 5. Verificar en Admin
- Ve a `http://localhost:5173/admin`
- Abre "Productos"
- Deberías ver todos los productos organizados por categoría

---

## 📊 Estructura de Categorías

```
Peruvian Food
├── Appetizers (Entradas)
├── Salads (Ensaladas)
├── Vegetarian Dishes
├── Pastas
├── Main Courses (Platos de Fondo)
└── Ceviches

Sushi
├── Vegetarian Rolls
├── Special Rolls
├── Philadelphia Rolls
├── Tempura Rolls
├── Nikkei Rolls
├── Japanese Dishes
├── Hosomaki
├── Nigiri
├── Sashimi
├── Sin Arroz (Rice-less)
├── Para Acompañar (Sides)
├── Gyosas
├── California Rolls
└── Colaciones (Combos)

Promotions
└── (sin subcategorías)

Beverages
└── (sin subcategorías)
```

---

## ⚠️ Notas Importantes

1. **El script creará:**
   - 4 categorías principales
   - 20 subcategorías
   - 155 productos

2. **Los productos se crean sin imágenes** (puedes agregarlas después en la galería)

3. **Los precios están en pesos chilenos** (puedes editarlos en Admin)

4. **Si ejecutas el script dos veces** no duplicará productos (usa `findOrCreate`)

---

## 🔧 Si Algo Falla

### Error: "Cannot find module"
```bash
npm install
npm run dev
# Luego ejecutar el import
```

### Error: "Database connection failed"
Verifica que PostgreSQL esté corriendo:
```bash
# En Mac/Linux
pg_isready -h localhost -p 5432
```

### Error: "Column parent_id does not exist"
El modelo fue actualizado pero la BD no se sincronizó. El backend auto sincronizará al arrancar.

---

## ✨ Después de Importar

1. **Agregar imágenes:** Usa la galería de Admin
2. **Editar precios:** Haz clic en cada producto
3. **Organizar menú:** Ahora puedes mostrar el menú por categorías jerárquicas

---

¿Necesitas ayuda? Revisa los logs del script para detalles específicos.
