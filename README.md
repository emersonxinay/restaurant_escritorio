# Hazuki POS

Aplicación de Punto de Venta (POS) para restaurantes, construida con **Tauri**, **React**, un backend interno en **Node.js** (Sidecar) y **SQLite**.

## Arquitectura
Esta aplicación es 100% autónoma. No requiere que el cliente final instale Node.js ni un motor de base de datos.
- **Frontend:** React + TypeScript (Vite).
- **Backend:** Node.js empaquetado como Sidecar dentro de la aplicación de Tauri.
- **Base de Datos:** SQLite local, persistente en la carpeta de datos de la aplicación del usuario.
  - La primera vez que se ejecuta, la aplicación copia una base de datos base (precargada) a la ruta de datos del sistema operativo.
  - Si la base de datos existe, no se sobrescribe, garantizando que los datos nunca se pierdan.

## Requisitos para Desarrollo
Si deseas clonar y continuar desarrollando esta aplicación, necesitas tener instalado:
- Node.js (v18 o superior)
- Rust (para compilar Tauri)
- Las dependencias de desarrollo de Tauri según tu sistema operativo (Xcode en Mac, Build Tools en Windows).

## ¿Cómo ejecutar el entorno de desarrollo?

1. Clona el repositorio y entra en la carpeta principal.
2. Navega a la carpeta del frontend y descarga las dependencias:
   ```bash
   cd frontend
   npm install
   ```
3. Navega a la carpeta del backend y descarga las dependencias:
   ```bash
   cd ../backend
   npm install
   ```
4. Vuelve a la carpeta del frontend para correr el entorno de desarrollo de Tauri:
   ```bash
   cd ../frontend
   npm run tauri dev
   ```
   *Esto iniciará la aplicación en modo desarrollo. El backend Node.js arrancará automáticamente gracias a Tauri, y cualquier cambio en el frontend se refrescará en tiempo real.*

## ¿Cómo compilar para Producción (Release)?

Para generar el instalador de la aplicación (`.app` en Mac, `.exe` en Windows), ejecuta el siguiente comando desde la carpeta `frontend`:

```bash
npm run tauri build
```

Una vez que termine, Tauri habrá empaquetado tanto tu React como tu ejecutable de Node.js y SQLite en un solo instalador.
- **En Mac**, encontrarás tu aplicación en: `frontend/src-tauri/target/release/bundle/macos/`
- **En Windows**, encontrarás tu instalador en: `frontend/src-tauri/target/release/bundle/nsis/`

---
*Nota: Asegúrate de que las variables de entorno o la configuración de API apunten siempre a `127.0.0.1` en lugar de `localhost` para garantizar total compatibilidad de red interna en todos los sistemas operativos (Windows 7+ y macOS modernos).*
