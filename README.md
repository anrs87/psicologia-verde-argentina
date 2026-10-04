# Psicología Vegana Argentina (Lic. Mauro García)

Sitio web y plataforma para la atención psicológica especializada en personas veganas y vegetarianas en Argentina.

## 🛠️ Tecnologías y Arquitectura

- **Frontend:** HTML5, Tailwind CSS (CDN), Vanilla JavaScript.
- **Backend & Cloud:** Firebase Hosting, Cloud Functions (Node.js 20), Cloud Firestore.
- **SEO & Metadatos Dinámicos:** Cloud Functions para generación dinámica de Open Graph / metatags en artículos (`/articulos/**`) y `sitemap.xml`.

## 📁 Estructura del Proyecto

- `index.html`: Landing page principal del sitio.
- `articulo.html`: Plantilla para lectura individual de artículos del blog.
- `admin.html`: Panel de administración y editor de contenidos.
- `propuesta_tienda_mauro.html`: Propuesta y maqueta de tienda/audioguías.
- `functions/`: Cloud Functions para SEO (`serveArticlePreview`, `sitemap`).
  - `functions/index.js`: Lógica de las funciones serverless con Express y Firebase Admin SDK.
- `firestore.rules`: Reglas de seguridad de Firestore.
- `firebase.json`: Configuración de hosting, rewrites, headers y emuladores.
- `assets/`: Imágenes, logotipos y recursos multimedia estáticos.

## 🚀 Entorno de Desarrollo y Despliegue

### Prerrequisitos

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)

### Configuración inicial

1. Instalar dependencias en el directorio de funciones:
   ```bash
   cd functions
   npm install
   ```

2. Emuladores locales de Firebase:
   ```bash
   firebase emulators:start
   ```

### Despliegue

- Desplegar funciones y hosting completo:
  ```bash
  firebase deploy
  ```
- Desplegar solo funciones:
  ```bash
  firebase deploy --only functions
  ```
- Desplegar solo hosting:
  ```bash
  firebase deploy --only hosting
  ```
