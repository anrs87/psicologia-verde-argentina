# 📋 Plan de Refacciones: Vidriera Dinámica, Artículos Premium y Pagos Internacionales (PayPal)
**Proyecto:** Psicología Verde Argentina / Psicólogo Vegano  
**Origen:** Consenso de audios entre Alan y Lic. Mauro García (`docs/nuevas refacciones/`)  
**Prerrequisito:** Conexión y credenciales de Mercado Pago finalizadas y validadas.

---

## 📌 Ejes de Trabajo

### 1. Vidriera Dinámica de Productos (Admin & Landing)
- **Objetivo:** No saturar con catálogo infinito; mantener 2 a 3 productos visibles en simultáneo (rotación, oferta y demanda).
- **Firestore (`products`):** Campo `activo_en_vidriera: boolean` y `es_fijo: boolean`.
- **Admin (`admin.html`):** Switch rápido de visibilidad pública por producto (sin borrar contenidos, módulos ni audios cargados).
- **Landing (`index.html`):** Renderizar en la sección de tienda únicamente los productos con `activo_en_vidriera == true`.

### 2. Artículos con Lectura Premium / Micropagos
- **Objetivo:** Mantener artículos abiertos para SEO y habilitar artículos de lectura exclusiva/profunda con paywall suave.
- **Admin (`admin.html`):** Checkbox `esExclusivo` y campos de precio micro (`precio_ars`, `precio_usd`).
- **Lector (`articulo.html`):** Muestra los primeros 2 párrafos libres; el resto se bloquea con degradado (*blur*) y botón de desbloqueo rápido.
- **Desbloqueo:** Acreditación por Mercado Pago o PayPal vinculada al email o sesión del usuario.

### 3. Ventas Internacionales vía PayPal + Canal Asistido
- **Objetivo:** Cobros para Chile, México, España, etc., sin bloqueos ni complicaciones.
- **Flujo Automático:**
  - Selector de pago en Tienda y Artículos: `🇦🇷 Mercado Pago (ARS)` / `🌎 PayPal (USD)`.
  - Backend (`functions/index.js`): `createPaypalOrder` y webhook `paypalWebhook` (`PAYMENT.CAPTURE.COMPLETED`).
  - Despacho: Reutilización de `sendPurchaseConfirmationEmail` (Resend) y notificación inmediata a Mauro (`verde.psicologia@gmail.com`).
- **Canal de Respaldo:** Enlace discreto a WhatsApp para quienes en el exterior no tengan tarjeta internacional ni PayPal y prefieran coordinar acceso manual.
