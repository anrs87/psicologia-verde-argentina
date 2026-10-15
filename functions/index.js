require('dotenv').config();
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const express = require('express');
const cors = require('cors')({ origin: true });
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { Resend } = require('resend');

admin.initializeApp({
  storageBucket: 'psicologiaveganaarg.firebasestorage.app'
});
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const app = express();

const resendApiKey = process.env.RESEND_API_KEY || (functions.config().resend && functions.config().resend.api_key) || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const botUserAgents = [
  'facebookexternalhit',
  'WhatsApp',
  'twitterbot',
  'telegrambot',
  'slackbot',
  'discordbot',
  'googlebot',
  'bingbot',
  'yandex',
  'baiduspider'
];

function isBot(userAgent) {
  if (!userAgent) return false;
  return botUserAgents.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

function getSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

app.get('/articulos/:slug', async (req, res) => {
  const slug = req.params.slug;
  const userAgent = req.headers['user-agent'];

  if (isBot(userAgent)) {
    try {
      // Buscar el artículo que coincida con el slug en Firestore
      const snapshot = await db.collection('articulos').orderBy('fecha', 'desc').get();
      let matchedArticle = null;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (getSlug(data.titulo) === slug) {
          matchedArticle = {
            id: doc.id,
            titulo: data.titulo,
            testimonio: data.testimonio || '',
            contenido: data.contenido || ''
          };
        }
      });

      if (matchedArticle) {
        // Extraer texto plano para la descripción
        const cleanContent = matchedArticle.contenido
          .replace(/<[^>]*>/g, '') // Quitar etiquetas HTML
          .substring(0, 160) + '...';

        const title = matchedArticle.titulo;
        const description = matchedArticle.testimonio || cleanContent;

        // Responder con metaetiquetas de Open Graph para los bots de redes sociales
        return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} | Psicólogo Vegano</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="https://psicologiaveganaarg.web.app/articulos/${slug}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title} | Psicólogo Vegano">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://psicologiaveganaarg.web.app/assets/logo.webp">
  <meta property="og:url" content="https://psicologiaveganaarg.web.app/articulos/${slug}">
  <meta property="og:type" content="article">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="${title} | Psicólogo Vegano">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="https://psicologiaveganaarg.web.app/assets/logo.webp">

  <!-- Redirección de respaldo por si el bot tiene JS habilitado -->
  <meta http-equiv="refresh" content="0; url=https://psicologiaveganaarg.web.app/articulo.html?slug=${slug}">
</head>
<body>
  <p>Redirigiendo a Psicólogo Vegano...</p>
</body>
</html>`);
      }
    } catch (error) {
      console.error("Error al buscar artículo para metadatos:", error);
    }
  }

  // Redirigir al lector de artículo físico pasando el slug
  res.redirect(`/articulo.html?slug=${slug}`);
});

exports.serveArticlePreview = functions.https.onRequest(app);

exports.sitemap = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await db.collection('articulos').orderBy('fecha', 'desc').get();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Home
    xml += `  <url>\n`;
    xml += `    <loc>https://psicologiaveganaarg.web.app/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;
    
    // Artículos
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.titulo) {
        const slug = getSlug(data.titulo);
        let dateStr = new Date().toISOString().split('T')[0];
        if (data.fecha) {
          try {
            const dateObj = data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha);
            dateStr = dateObj.toISOString().split('T')[0];
          } catch (e) {
            // fallback a la fecha actual si hay error
          }
        }
        
        xml += `  <url>\n`;
        xml += `    <loc>https://psicologiaveganaarg.web.app/articulos/${slug}</loc>\n`;
        xml += `    <lastmod>${dateStr}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    });
    
    xml += `</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // Cache por 1 día
    return res.status(200).send(xml);
  } catch (error) {
    console.error("Error al generar sitemap dinámico:", error);
    return res.status(500).send("Error generating sitemap");
  }
});

// ==========================================
// ECOSISTEMA DIGITAL: MERCADO PAGO Y STORAGE
// ==========================================

async function getMpClient() {
  try {
    const doc = await db.collection('system_config').doc('mercadopago').get();
    if (doc.exists && doc.data()?.is_active && doc.data()?.access_token) {
      return new MercadoPagoConfig({ accessToken: doc.data().access_token });
    }
  } catch (err) {
    console.warn('Error leyendo credencial de MP de Firestore:', err);
  }
  const token = process.env.MP_ACCESS_TOKEN || 
    (functions.config().mercadopago && functions.config().mercadopago.access_token) || 
    '';
  return new MercadoPagoConfig({ accessToken: token });
}

async function verifyAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    return await auth.verifyIdToken(token);
  } catch (err) {
    console.error('Error al verificar token Firebase Auth:', err);
    return null;
  }
}

const ADMIN_EMAILS = [
  'verde.psicologia@gmail.com',
  'dev@psicologovegano.com',
  'dev@psicologiavegana.com',
  'alanriverossaavedra@gmail.com'
];

function isUserAdmin(user) {
  return !!(user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

/**
 * Envío de email transaccional con Resend
 */
async function sendPurchaseConfirmationEmail({ toEmail, patientName, productTitle, productId, paymentId }) {
  if (!toEmail) return { success: false, reason: 'Email no provisto' };

  const portalUrl = 'https://psicologiaveganaarg.web.app/portal/';
  const directProductUrl = `${portalUrl}?producto=${encodeURIComponent(productId)}`;

  const subject = `🌿 Acceso habilitado: ${productTitle} | Psicología Verde`;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0D0A; color: #E2E8F0; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #141a14; border: 1px solid #232f23; border-radius: 20px; overflow: hidden; }
        .header { background-color: #0e130e; padding: 32px 24px; text-align: center; border-bottom: 1px solid #232f23; }
        .header h1 { margin: 0; color: #8EB486; font-size: 20px; font-weight: 600; letter-spacing: 1px; }
        .header p { margin: 6px 0 0; color: #8F9B8D; font-size: 12px; font-family: monospace; }
        .content { padding: 32px 28px; line-height: 1.6; color: #CBD5E1; font-size: 14px; }
        .greeting { font-size: 18px; color: #F1F5F9; font-weight: 600; margin-bottom: 16px; }
        .box { background-color: #0A0D0A; border: 1px solid #232f23; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .product-title { color: #8EB486; font-size: 16px; font-weight: bold; margin-bottom: 6px; }
        .badge { display: inline-block; background-color: rgba(142, 180, 134, 0.15); color: #8EB486; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-family: monospace; }
        .btn { display: inline-block; background-color: #8EB486; color: #0A0D0A !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 13px; text-align: center; margin: 24px 0 12px; letter-spacing: 0.5px; }
        .steps { margin: 20px 0; padding-left: 20px; color: #94A3B8; font-size: 13px; }
        .steps li { margin-bottom: 10px; }
        .footer { padding: 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #232f23; background-color: #0c100c; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>PSICOLOGÍA VERDE ARGENTINA</h1>
          <p>LIC. MAURO GARCÍA RODRÍGUEZ</p>
        </div>
        <div class="content">
          <div class="greeting">¡Hola${patientName ? ` ${patientName}` : ''}!</div>
          <p>Te confirmamos que tu pago ha sido aprobado exitosamente. Tu material terapéutico ya se encuentra habilitado en tu portal de paciente.</p>
          
          <div class="box">
            <span class="badge">RECURSO HABILITADO</span>
            <div class="product-title" style="margin-top: 8px;">${productTitle}</div>
            <p style="margin: 0; color: #8F9B8D; font-size: 12px;">Comprobante de operación: ${paymentId}</p>
          </div>

          <p><strong>¿Cómo acceder a tus contenidos?</strong></p>
          <ol class="steps">
            <li>Hacé clic en el botón de abajo para ingresar al portal.</li>
            <li>Iniciá sesión o registrate con este mismo correo (<strong>${toEmail}</strong>).</li>
            <li>En la sección <em>"Mi biblioteca"</em> podrás reproducir las pistas de audio (incluso guardarlas offline para escuchar sin conexión) y visualizar o descargar los cuadernillos clínicos en PDF.</li>
          </ol>

          <div style="text-align: center;">
            <a href="${directProductUrl}" class="btn" target="_blank">INGRESAR A MI BIBLIOTECA</a>
          </div>

          <p style="margin-top: 24px; font-size: 12px; color: #8F9B8D;">
            Si tenés alguna consulta clínica o técnica durante tu proceso, podés contactarme directamente respondiendo a este mensaje o por WhatsApp al +54 9 11 3379-1108.
          </p>
        </div>
        <div class="footer">
          Psicología Verde Argentina · Espacio clínico y terapéutico con perspectiva antiespecista.<br>
          Entre Ríos / Atención online a toda Argentina y el exterior.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!resend) {
    console.warn(`Resend no configurado (RESEND_API_KEY ausente). Registrando en pending_emails para ${toEmail}`);
    await db.collection('pending_emails').add({
      toEmail,
      subject,
      productTitle,
      productId,
      paymentId,
      status: 'pending_api_key',
      fecha_creacion: FieldValue.serverTimestamp()
    });
    return { success: false, reason: 'Pending API Key' };
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Psicología Verde <notificaciones@psicologovegano.com>';
    const res = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: subject,
      html: htmlContent
    });
    console.log(`Email transaccional enviado con Resend a ${toEmail}:`, res);
    return { success: true, resendId: res.id || res.data?.id };
  } catch (err) {
    console.error(`Error enviando email con Resend a ${toEmail}:`, err);
    await db.collection('pending_emails').add({
      toEmail,
      subject,
      productTitle,
      productId,
      paymentId,
      error: err.message,
      status: 'failed',
      fecha_creacion: FieldValue.serverTimestamp()
    });
    return { success: false, error: err.message };
  }
}

/**
 * Envío de alerta de venta a Mauro (verde.psicologia@gmail.com)
 */
async function sendSaleNotificationToMauro({ patientName, userEmail, productTitle, productId, paymentId, amount }) {
  if (!resend) return { success: false, reason: 'Resend no configurado' };

  const subject = `💰 ¡Nueva venta confirmada! - ${productTitle || 'Recurso digital'}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2e7d32;">💰 ¡Nueva venta registrada en tu tienda!</h2>
      <p>Hola Mauro, te notificamos que se acreditó un nuevo pago a través de Mercado Pago:</p>
      
      <div style="background-color: #f9fbf9; border-left: 4px solid #2e7d32; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Recurso:</strong> ${productTitle}</p>
        <p style="margin: 4px 0;"><strong>Comprador:</strong> ${patientName || 'Usuario'}</p>
        <p style="margin: 4px 0;"><strong>Email del comprador:</strong> ${userEmail}</p>
        <p style="margin: 4px 0;"><strong>Monto abonado:</strong> $${amount ? Number(amount).toLocaleString('es-AR') : 'N/A'} ARS</p>
        <p style="margin: 4px 0;"><strong>ID de Pago (MP):</strong> ${paymentId}</p>
      </div>

      <p style="font-size: 14px; color: #555;">El recurso ya fue habilitado en el portal del paciente y se le despachó automáticamente el correo de acceso.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">Notificación automática del sistema de Psicología Verde.</p>
    </div>
  `;

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Psicología Verde <notificaciones@psicologovegano.com>';
    const res = await resend.emails.send({
      from: fromAddress,
      to: ['verde.psicologia@gmail.com'],
      subject: subject,
      html: htmlContent
    });
    console.log('Notificación de venta enviada a Mauro con éxito:', res);
    return { success: true, resendId: res.id || res.data?.id };
  } catch (err) {
    console.error('Error enviando notificación de venta a Mauro:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Crear preferencia de pago en Mercado Pago
 */
exports.createCheckoutPreference = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const user = await verifyAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { productId, couponCode } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Falta productId' });
    }

    try {
      const prodDoc = await db.collection('products').doc(productId).get();
      if (!prodDoc.exists) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const product = prodDoc.data();
      if (product.estado !== 'publicado') {
        return res.status(400).json({ error: 'El producto no está disponible para la venta' });
      }

      const originalPrice = Number(product.precio);
      let finalPrice = originalPrice;
      let discountAmount = 0;
      let appliedCoupon = null;

      // Validación de cupón de descuento
      if (couponCode && typeof couponCode === 'string') {
        const cleanCode = couponCode.trim().toUpperCase();
        const couponDoc = await db.collection('coupons').doc(cleanCode).get();

        if (couponDoc.exists) {
          const coupon = couponDoc.data();
          const now = new Date();
          const isExpired = coupon.fecha_expiracion && new Date(coupon.fecha_expiracion) < now;
          const isMaxedOut = coupon.max_usos && (coupon.usos_actuales || 0) >= coupon.max_usos;
          const isActive = coupon.activo !== false;

          if (isActive && !isExpired && !isMaxedOut) {
            appliedCoupon = cleanCode;
            if (coupon.tipo === 'porcentaje') {
              discountAmount = Math.round(originalPrice * (Number(coupon.valor) / 100));
            } else {
              discountAmount = Number(coupon.valor);
            }
            finalPrice = Math.max(1, originalPrice - discountAmount);
          }
        }
      }

      const preferenceClient = new Preference(await getMpClient());
      const hostUrl = req.headers.origin || 'https://psicologiaveganaarg.web.app';

      const preference = await preferenceClient.create({
        body: {
          items: [
            {
              id: productId,
              title: appliedCoupon ? `${product.titulo} (Desc. ${appliedCoupon})` : product.titulo,
              description: product.subtitulo || product.titulo,
              unit_price: Number(finalPrice),
              quantity: 1,
              currency_id: 'ARS'
            }
          ],
          metadata: {
            uid_usuario: user.uid,
            id_producto: productId,
            email_usuario: user.email || '',
            codigo_cupon: appliedCoupon || '',
            descuento_aplicado: discountAmount,
            precio_original: originalPrice
          },
          back_urls: {
            success: `${hostUrl}/portal/?status=success&product_id=${productId}`,
            failure: `${hostUrl}/portal/?status=failure`,
            pending: `${hostUrl}/portal/?status=pending`
          },
          notification_url: `https://us-central1-psicologiaveganaarg.cloudfunctions.net/mercadopagoWebhook`
        }
      });

      // Registrar transacción pendiente inicial con cupón si corresponde
      await db.collection('transactions').doc(preference.id).set({
        id_transaccion: preference.id,
        uid_usuario: user.uid,
        id_producto: productId,
        monto: Number(finalPrice),
        precio_original: originalPrice,
        descuento: discountAmount,
        codigo_cupon: appliedCoupon || null,
        estado: 'pendiente',
        fecha_creacion: FieldValue.serverTimestamp()
      }, { merge: true });

      return res.status(200).json({
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        finalPrice,
        discountAmount,
        appliedCoupon
      });
    } catch (err) {
      console.error('Error al crear preferencia de Mercado Pago:', err);
      return res.status(500).json({ error: 'Error al generar preferencia de pago', detalle: err.message });
    }
  });
});

/**
 * Validación previa de cupón para el frontend
 */
exports.validateCoupon = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { couponCode, productId } = req.body;
    if (!couponCode) {
      return res.status(400).json({ error: 'Falta código de cupón' });
    }

    try {
      const cleanCode = couponCode.trim().toUpperCase();
      const couponDoc = await db.collection('coupons').doc(cleanCode).get();

      if (!couponDoc.exists) {
        return res.status(404).json({ valid: false, error: 'El cupón no existe' });
      }

      const coupon = couponDoc.data();
      const now = new Date();

      if (coupon.activo === false) {
        return res.status(400).json({ valid: false, error: 'Este cupón está pausado o inactivo' });
      }

      if (coupon.fecha_expiracion && new Date(coupon.fecha_expiracion) < now) {
        return res.status(400).json({ valid: false, error: 'Este cupón ha expirado' });
      }

      if (coupon.max_usos && (coupon.usos_actuales || 0) >= coupon.max_usos) {
        return res.status(400).json({ valid: false, error: 'Este cupón ha alcanzado el límite de usos' });
      }

      let originalPrice = null;
      let discountAmount = 0;
      let finalPrice = null;

      if (productId) {
        const prodDoc = await db.collection('products').doc(productId).get();
        if (prodDoc.exists) {
          originalPrice = Number(prodDoc.data().precio || 0);
          if (coupon.tipo === 'porcentaje') {
            discountAmount = Math.round(originalPrice * (Number(coupon.valor) / 100));
          } else {
            discountAmount = Number(coupon.valor);
          }
          finalPrice = Math.max(1, originalPrice - discountAmount);
        }
      }

      return res.status(200).json({
        valid: true,
        codigo: cleanCode,
        tipo: coupon.tipo,
        valor: coupon.valor,
        descuento: discountAmount,
        precioOriginal: originalPrice,
        precioFinal: finalPrice,
        mensaje: coupon.tipo === 'porcentaje' ? `${coupon.valor}% de descuento` : `$${coupon.valor} ARS de descuento`
      });
    } catch (err) {
      console.error('Error validando cupón:', err);
      return res.status(500).json({ valid: false, error: 'Error al verificar cupón' });
    }
  });
});

/**
 * 2. Webhook seguro para notificaciones de pago de Mercado Pago
 */
exports.mercadopagoWebhook = functions.https.onRequest(async (req, res) => {
  const topic = req.query.topic || req.query.type || req.body?.type || req.body?.topic;
  const paymentId = req.query['data.id'] || req.query.id || req.body?.data?.id || req.body?.id;

  if (!paymentId || (topic && !topic.includes('payment'))) {
    return res.status(200).send('OK');
  }

  try {
    const paymentClient = new Payment(await getMpClient());
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment) {
      return res.status(404).send('Pago no encontrado en Mercado Pago');
    }

    const { status, metadata, external_reference, transaction_amount } = payment;

    let uid_usuario = metadata?.uid_usuario;
    let id_producto = metadata?.id_producto;

    if ((!uid_usuario || !id_producto) && external_reference && external_reference.includes('___')) {
      const parts = external_reference.split('___');
      uid_usuario = uid_usuario || parts[0];
      id_producto = id_producto || parts[1];
    }

    if (!uid_usuario || !id_producto) {
      console.warn('Pago sin metadata requerida:', paymentId);
      return res.status(200).send('Metadata ausente, transacción registrada');
    }

    const transactionRef = db.collection('transactions').doc(String(paymentId));
    const userRef = db.collection('users').doc(uid_usuario);

    if (status === 'approved') {
      const existingTx = await transactionRef.get();
      if (existingTx.exists && existingTx.data()?.estado === 'aprobado') {
        console.log(`Pago ${paymentId} ya acreditado anteriormente. Omitiendo duplicados.`);
        return res.status(200).send('OK (Ya procesado)');
      }

      const batch = db.batch();

      // 1. Obtener datos del paciente y producto
      let userEmail = metadata?.email_usuario || '';
      let userName = '';
      if (!userEmail) {
        try {
          const userRecord = await auth.getUser(uid_usuario);
          userEmail = userRecord.email || '';
          userName = userRecord.displayName || '';
        } catch (e) {
          console.warn('No se pudo obtener email de Auth para uid:', uid_usuario);
        }
      }

      let productTitle = 'Recurso Terapéutico';
      try {
        const prodDoc = await db.collection('products').doc(id_producto).get();
        if (prodDoc.exists) {
          productTitle = prodDoc.data().titulo || productTitle;
        } else if (id_producto === 'mapa_de_transiciones') {
          productTitle = 'Mapa de Transiciones Vitales';
        } else if (id_producto === 'autoestima_verde') {
          productTitle = 'Autoestima Verde & El YO que habito';
        }
      } catch (e) {
        console.warn('Error obteniendo producto:', e);
      }

      // 2. Registrar transacción
      batch.set(transactionRef, {
        id_transaccion: String(paymentId),
        uid_usuario: uid_usuario,
        id_producto: id_producto,
        email_usuario: userEmail,
        codigo_cupon: metadata?.codigo_cupon || null,
        descuento: metadata?.descuento_aplicado || 0,
        monto: transaction_amount,
        estado: 'aprobado',
        metodo_pago: payment.payment_type_id || 'mercadopago',
        fecha_aprobacion: FieldValue.serverTimestamp()
      }, { merge: true });

      // 3. Crear registro formal en la colección purchases
      const purchaseRef = db.collection('purchases').doc(String(paymentId));
      batch.set(purchaseRef, {
        id_compra: String(paymentId),
        id_transaccion: String(paymentId),
        uid_usuario: uid_usuario,
        id_producto: id_producto,
        email_usuario: userEmail,
        codigo_cupon: metadata?.codigo_cupon || null,
        descuento: metadata?.descuento_aplicado || 0,
        titulo_producto: productTitle,
        monto: transaction_amount,
        estado: 'aprobado',
        metodo_pago: payment.payment_type_id || 'mercadopago',
        fecha_compra: FieldValue.serverTimestamp()
      }, { merge: true });

      // 4. Inyección atómica del producto en la colección del usuario (con soporte para combos / packs integrales)
      let productsToGrant = [id_producto];
      if (id_producto === 'pack_integral_vegano') {
        productsToGrant = ['pack_integral_vegano', 'libro_cuerpos_no_humanos', 'mapa_de_transiciones', 'autoestima_verde'];
      } else if (prodDoc && prodDoc.exists) {
        const pData = prodDoc.data();
        if (Array.isArray(pData.bundled_products) && pData.bundled_products.length > 0) {
          productsToGrant = Array.from(new Set([id_producto, ...pData.bundled_products]));
        }
      }

      batch.set(userRef, {
        productos_adquiridos: FieldValue.arrayUnion(...productsToGrant),
        fecha_ultima_compra: FieldValue.serverTimestamp()
      }, { merge: true });

      await batch.commit();
      console.log(`Pago ${paymentId} aprobado. Productos ${productsToGrant.join(', ')} inyectados a usuario ${uid_usuario}`);

      // Incrementar contador de usos del cupón si aplica
      if (metadata?.codigo_cupon) {
        db.collection('coupons').doc(metadata.codigo_cupon).set({
          usos_actuales: FieldValue.increment(1)
        }, { merge: true }).catch(cErr => console.warn('Error incrementando cupón:', cErr));
      }

      // 5. Enviar email transaccional asincrónicamente al paciente
      if (userEmail) {
        sendPurchaseConfirmationEmail({
          toEmail: userEmail,
          patientName: userName,
          productTitle: productTitle,
          productId: id_producto,
          paymentId: String(paymentId)
        }).then((emailRes) => {
          if (emailRes.success) {
            purchaseRef.set({ email_enviado: true, resend_id: emailRes.resendId || null }, { merge: true });
          }
        }).catch((emailErr) => {
          console.error('Error al despachar email de compra:', emailErr);
        });

        // 6. Alerta de venta inmediata a Mauro
        sendSaleNotificationToMauro({
          patientName: userName,
          userEmail: userEmail,
          productTitle: productTitle,
          productId: id_producto,
          paymentId: String(paymentId),
          amount: transaction_amount
        }).catch((mauroErr) => {
          console.error('Error al notificar venta a Mauro:', mauroErr);
        });
      }
    } else if (status === 'rejected' || status === 'cancelled') {
      await transactionRef.set({
        id_transaccion: String(paymentId),
        uid_usuario: uid_usuario,
        id_producto: id_producto,
        monto: transaction_amount,
        estado: 'rechazado',
        fecha_actualizacion: FieldValue.serverTimestamp()
      }, { merge: true });
    } else if (status === 'refunded' || status === 'charged_back') {
      await transactionRef.set({
        id_transaccion: String(paymentId),
        uid_usuario: uid_usuario,
        id_producto: id_producto,
        monto: transaction_amount,
        estado: 'devuelto',
        fecha_actualizacion: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return res.status(200).send('Webhook procesado exitosamente');
  } catch (err) {
    console.error(`Error procesando webhook de pago ${paymentId}:`, err);
    return res.status(500).send('Error interno en procesamiento de webhook');
  }
});

/**
 * 3. Generación de Signed URL temporal para audios y PDFs privados
 */
exports.getSignedResourceUrl = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const user = await verifyAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { productId, itemId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Falta productId' });
    }

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const isAdmin = isUserAdmin(user);
      const userData = userDoc.exists ? userDoc.data() : {};
      const adquiridos = userData.productos_adquiridos || [];

      if (!isAdmin && !adquiridos.includes(productId)) {
        return res.status(403).json({ error: 'Acceso denegado: no has adquirido este recurso' });
      }

      const prodDoc = await db.collection('products').doc(productId).get();
      if (!prodDoc.exists) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const product = prodDoc.data();
      let targetPath = product.storage_path;
      let targetTitle = product.titulo;
      let targetType = product.tipo || 'audio';

      // Si el producto tiene items ordenados (bundle / módulos múltiples)
      if (Array.isArray(product.items) && product.items.length > 0) {
        if (itemId) {
          const item = product.items.find(i => String(i.id) === String(itemId));
          if (item) {
            targetPath = item.storage_path;
            targetTitle = item.titulo || product.titulo;
            targetType = item.tipo || 'audio';
          }
        } else {
          // Si no se especificó itemId, seleccionar el primer entregable por orden
          const sorted = [...product.items].sort((a, b) => (a.orden || 0) - (b.orden || 0));
          const firstItem = sorted[0];
          targetPath = firstItem.storage_path;
          targetTitle = firstItem.titulo || product.titulo;
          targetType = firstItem.tipo || 'audio';
        }
      }

      if (!targetPath) {
        return res.status(400).json({ error: 'El producto o módulo no tiene archivo asociado configurado' });
      }

      // Si storage_path es una URL directa (ej. HTTP/S o demo stream)
      if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
        return res.status(200).json({
          signedUrl: targetPath,
          expiresAt: Date.now() + 2 * 60 * 60 * 1000,
          titulo: targetTitle,
          tipo: targetType
        });
      }

      const bucket = storage.bucket();
      const file = bucket.file(targetPath);

      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: 'El archivo en Storage no fue encontrado' });
      }

      // Signed URL válida por 2 horas
      const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: expiresAt
      });

      return res.status(200).json({
        signedUrl: signedUrl,
        expiresAt: expiresAt,
        titulo: targetTitle,
        tipo: targetType
      });
    } catch (err) {
      console.error('Error generando Signed URL:', err);
      return res.status(500).json({ error: 'Error al generar enlace seguro', detalle: err.message });
    }
  });
});

/**
 * 4. Callback de OAuth de Mercado Pago
 * Mauro autoriza desde la web oficial de Mercado Pago y esta función guarda su Access Token
 */
exports.mpOAuthCallback = functions.https.onRequest(async (req, res) => {
  const { code, error } = req.query;
  const adminBaseUrl = 'https://psicologovegano.com/admin';

  if (error || !code) {
    console.error('Error o código faltante en callback de MP:', error || 'Sin código');
    return res.redirect(`${adminBaseUrl}?mp_error=${encodeURIComponent(error || 'Autorización no completada')}`);
  }

  const clientId = process.env.MP_CLIENT_ID || (functions.config().mercadopago && functions.config().mercadopago.client_id) || '';
  const clientSecret = process.env.MP_CLIENT_SECRET || (functions.config().mercadopago && functions.config().mercadopago.client_secret) || '';
  const redirectUri = 'https://us-central1-psicologiaveganaarg.cloudfunctions.net/mpOAuthCallback';

  if (!clientId || !clientSecret) {
    console.error('Credenciales de MP_CLIENT_ID / MP_CLIENT_SECRET no configuradas en entorno');
    return res.redirect(`${adminBaseUrl}?mp_error=${encodeURIComponent('Credenciales OAuth de servidor no configuradas')}`);
  }

  try {
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri
      })
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || !data.access_token) {
      console.error('Error canjeando código por token en Mercado Pago:', data);
      return res.redirect(`${adminBaseUrl}?mp_error=${encodeURIComponent(data.message || 'Error al obtener credenciales')}`);
    }

    // Guardar credenciales de forma segura en Firestore
    await db.collection('system_config').doc('mercadopago').set({
      access_token: data.access_token,
      public_key: data.public_key || null,
      refresh_token: data.refresh_token || null,
      user_id: data.user_id || null,
      live_mode: data.live_mode !== undefined ? data.live_mode : true,
      scope: data.scope || null,
      expires_in: data.expires_in || null,
      is_active: true,
      connected_at: FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Mercado Pago conectado exitosamente para user_id ${data.user_id}`);
    return res.redirect(`${adminBaseUrl}?mp_connected=true&mp_user_id=${data.user_id}`);
  } catch (err) {
    console.error('Excepción en mpOAuthCallback:', err);
    return res.redirect(`${adminBaseUrl}?mp_error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * 5. Consultar estado de vinculación de Mercado Pago (para el panel /admin)
 */
exports.getMercadoPagoStatus = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const user = await verifyAuthToken(req);
    if (!user || !isUserAdmin(user)) {
      return res.status(403).json({ error: 'No autorizado: requiere rol de administrador' });
    }

    try {
      const doc = await db.collection('system_config').doc('mercadopago').get();
      if (!doc.exists || !doc.data()?.is_active) {
        return res.json({ connected: false });
      }
      const data = doc.data();
      return res.json({
        connected: true,
        user_id: data.user_id,
        connected_at: data.connected_at ? data.connected_at.toDate() : null
      });
    } catch (e) {
      console.error('Error en getMercadoPagoStatus:', e);
      return res.status(500).json({ error: e.message });
    }
  });
});

/**
 * 6. Desvincular cuenta de Mercado Pago (para el panel /admin)
 */
exports.disconnectMercadoPago = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const user = await verifyAuthToken(req);
    if (!user || !isUserAdmin(user)) {
      return res.status(403).json({ error: 'No autorizado: requiere rol de administrador' });
    }

    try {
      await db.collection('system_config').doc('mercadopago').set({
        is_active: false,
        disconnected_at: FieldValue.serverTimestamp()
      }, { merge: true });
      return res.json({ success: true });
    } catch (e) {
      console.error('Error en disconnectMercadoPago:', e);
      return res.status(500).json({ error: e.message });
    }
  });
});

// ==========================================
// ECOSISTEMA DIGITAL: PAYPAL (INTERNACIONAL)
// ==========================================

async function getPaypalConfig() {
  try {
    const doc = await db.collection('system_config').doc('paypal').get();
    if (doc.exists && doc.data()?.is_active && doc.data()?.client_id && doc.data()?.client_secret) {
      return {
        clientId: doc.data().client_id,
        clientSecret: doc.data().client_secret,
        env: doc.data().env || 'sandbox'
      };
    }
  } catch (err) {
    console.warn('Error leyendo credencial de PayPal de Firestore:', err);
  }
  return {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    env: process.env.PAYPAL_ENV || 'sandbox'
  };
}

let cachedPaypalToken = null;
let paypalTokenExpiresAt = 0;

async function getPaypalAccessToken() {
  const now = Date.now();
  if (cachedPaypalToken && now < (paypalTokenExpiresAt - 60000)) {
    return cachedPaypalToken;
  }

  const { clientId, clientSecret, env } = await getPaypalConfig();
  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de PayPal no configuradas en backend');
  }

  const baseUrl = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error autenticando con PayPal: ${errText}`);
  }

  const data = await response.json();
  cachedPaypalToken = data.access_token;
  paypalTokenExpiresAt = now + (data.expires_in * 1000);
  return cachedPaypalToken;
}

/**
 * 1. Crear Orden de Pago en PayPal (v2)
 */
exports.createPaypalOrder = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const user = await verifyAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { productId, couponCode } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Falta productId' });
    }

    try {
      const prodDoc = await db.collection('products').doc(productId).get();
      if (!prodDoc.exists) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const product = prodDoc.data();
      if (product.estado !== 'publicado') {
        return res.status(400).json({ error: 'El producto no está disponible para la venta' });
      }

      // Determinar precio base en USD
      let priceUsd = Number(product.precio_usd);
      if (!priceUsd || isNaN(priceUsd)) {
        if (productId === 'mapa_de_transiciones') priceUsd = 25.00;
        else if (productId === 'autoestima_verde') priceUsd = 18.00;
        else priceUsd = Math.max(5, Math.round(Number(product.precio || 20000) / 1000));
      }

      const originalPriceUsd = priceUsd;
      let finalPriceUsd = originalPriceUsd;
      let discountAmount = 0;
      let appliedCoupon = null;

      // Validación de cupón de descuento
      if (couponCode && typeof couponCode === 'string') {
        const cleanCode = couponCode.trim().toUpperCase();
        const couponDoc = await db.collection('coupons').doc(cleanCode).get();

        if (couponDoc.exists) {
          const coupon = couponDoc.data();
          const now = new Date();
          const isExpired = coupon.fecha_expiracion && new Date(coupon.fecha_expiracion) < now;
          const isMaxedOut = coupon.max_usos && (coupon.usos_actuales || 0) >= coupon.max_usos;
          const isActive = coupon.activo !== false;

          if (isActive && !isExpired && !isMaxedOut) {
            appliedCoupon = cleanCode;
            if (coupon.tipo === 'porcentaje') {
              discountAmount = Number(((originalPriceUsd * Number(coupon.valor)) / 100).toFixed(2));
            } else {
              discountAmount = coupon.valor_usd ? Number(coupon.valor_usd) : 5.00;
            }
            finalPriceUsd = Math.max(1, Number((originalPriceUsd - discountAmount).toFixed(2)));
          }
        }
      }

      const token = await getPaypalAccessToken();
      const { env } = await getPaypalConfig();
      const baseUrl = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const hostUrl = req.headers.origin || 'https://psicologiaveganaarg.web.app';

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: productId,
            description: product.titulo,
            custom_id: JSON.stringify({
              uid: user.uid,
              productId,
              email: user.email || '',
              appliedCoupon: appliedCoupon || '',
              discountAmount,
              originalPriceUsd
            }),
            amount: {
              currency_code: 'USD',
              value: finalPriceUsd.toFixed(2)
            }
          }
        ],
        application_context: {
          brand_name: 'Psicología Verde',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${hostUrl}/portal/?status=success&product_id=${productId}`,
          cancel_url: `${hostUrl}/portal/?status=cancel`
        }
      };

      const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        console.error('Error creando orden en PayPal:', errText);
        return res.status(500).json({ error: 'Error al contactar pasarela de PayPal' });
      }

      const orderData = await orderRes.json();

      // Guardar transacción pendiente en Firestore
      await db.collection('transactions').doc(orderData.id).set({
        id_transaccion: orderData.id,
        uid_usuario: user.uid,
        id_producto: productId,
        monto: finalPriceUsd,
        moneda: 'USD',
        precio_original: originalPriceUsd,
        descuento: discountAmount,
        codigo_cupon: appliedCoupon || null,
        metodo_pago: 'paypal',
        estado: 'pendiente',
        fecha_creacion: FieldValue.serverTimestamp()
      }, { merge: true });

      const approveLink = orderData.links?.find(l => l.rel === 'approve')?.href;

      return res.status(200).json({
        id: orderData.id,
        approveUrl: approveLink,
        finalPriceUsd,
        discountAmount,
        appliedCoupon
      });
    } catch (err) {
      console.error('Error en createPaypalOrder:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});

/**
 * 2. Capturar Orden de Pago de PayPal y Despachar Acreditación
 */
exports.capturePaypalOrder = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const user = await verifyAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Falta orderId' });
    }

    try {
      // Verificar si ya fue procesada anteriormente
      const existingPurchase = await db.collection('purchases').doc(orderId).get();
      if (existingPurchase.exists && existingPurchase.data().estado === 'aprobado') {
        return res.json({ success: true, message: 'Orden ya acreditada anteriormente' });
      }

      const token = await getPaypalAccessToken();
      const { env } = await getPaypalConfig();
      const baseUrl = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

      const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const captureData = await captureRes.json();
      if (!captureRes.ok || captureData.status !== 'COMPLETED') {
        console.error('Fallo captura de orden PayPal:', captureData);
        return res.status(400).json({ error: 'La orden no pudo ser completada', details: captureData });
      }

      const captureDetails = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      const customIdRaw = captureData.purchase_units?.[0]?.custom_id;
      let parsedCustom = {};
      try {
        if (customIdRaw) parsedCustom = JSON.parse(customIdRaw);
      } catch (e) {
        console.warn('Error parsing custom_id PayPal:', e);
      }

      const productId = parsedCustom.productId || captureData.purchase_units?.[0]?.reference_id;
      const uidUsuario = parsedCustom.uid || user.uid;
      const userEmail = parsedCustom.email || user.email || captureData.payer?.email_address;
      const userName = user.name || `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim() || 'Comprador';
      const amountUsd = Number(captureDetails?.amount?.value || captureData.purchase_units?.[0]?.amount?.value || 0);

      let productTitle = 'Recurso Terapéutico';
      try {
        const prodDoc = await db.collection('products').doc(productId).get();
        if (prodDoc.exists) {
          productTitle = prodDoc.data().titulo || productTitle;
        } else if (productId === 'mapa_de_transiciones') {
          productTitle = 'Mapa de Transiciones Vitales';
        } else if (productId === 'autoestima_verde') {
          productTitle = 'Autoestima Verde & El YO que habito';
        }
      } catch (e) {
        console.warn('Error obteniendo título producto:', e);
      }

      const batch = db.batch();

      const transactionRef = db.collection('transactions').doc(orderId);
      batch.set(transactionRef, {
        id_transaccion: orderId,
        uid_usuario: uidUsuario,
        id_producto: productId,
        email_usuario: userEmail,
        monto: amountUsd,
        moneda: 'USD',
        estado: 'aprobado',
        metodo_pago: 'paypal',
        paypal_capture_id: captureDetails?.id || null,
        fecha_aprobacion: FieldValue.serverTimestamp()
      }, { merge: true });

      const purchaseRef = db.collection('purchases').doc(orderId);
      batch.set(purchaseRef, {
        id_compra: orderId,
        id_transaccion: orderId,
        uid_usuario: uidUsuario,
        id_producto: productId,
        email_usuario: userEmail,
        titulo_producto: productTitle,
        monto: amountUsd,
        moneda: 'USD',
        estado: 'aprobado',
        metodo_pago: 'paypal',
        fecha_compra: FieldValue.serverTimestamp()
      }, { merge: true });

      const userRef = db.collection('users').doc(uidUsuario);
      let productsToGrant = [productId];
      if (productId === 'pack_integral_vegano') {
        productsToGrant = ['pack_integral_vegano', 'libro_cuerpos_no_humanos', 'mapa_de_transiciones', 'autoestima_verde'];
      } else if (prodDoc && prodDoc.exists) {
        const pData = prodDoc.data();
        if (Array.isArray(pData.bundled_products) && pData.bundled_products.length > 0) {
          productsToGrant = Array.from(new Set([productId, ...pData.bundled_products]));
        }
      }

      batch.set(userRef, {
        productos_adquiridos: FieldValue.arrayUnion(...productsToGrant),
        fecha_ultima_compra: FieldValue.serverTimestamp()
      }, { merge: true });

      await batch.commit();
      console.log(`Pago PayPal ${orderId} aprobado. Productos ${productsToGrant.join(', ')} acreditados a ${uidUsuario}`);

      // Despacho de email de bienvenida y descarga vía Resend
      if (userEmail) {
        sendPurchaseConfirmationEmail({
          toEmail: userEmail,
          patientName: userName,
          productTitle: productTitle,
          productId: productId,
          paymentId: orderId
        }).then(emailRes => {
          if (emailRes.success) {
            purchaseRef.set({ email_enviado: true, resend_id: emailRes.resendId || null }, { merge: true });
          }
        }).catch(err => console.error('Error email PayPal compra:', err));

        sendSaleNotificationToMauro({
          patientName: userName,
          userEmail: userEmail,
          productTitle: productTitle,
          productId: productId,
          paymentId: orderId,
          amount: `${amountUsd} USD`
        }).catch(err => console.error('Error notif Mauro PayPal:', err));
      }

      return res.status(200).json({
        success: true,
        productId,
        productTitle
      });
    } catch (err) {
      console.error('Error en capturePaypalOrder:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});

/**
 * 3. Webhook de PayPal (Respaldo Asíncrono)
 */
exports.paypalWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  const event = req.body;
  const eventType = event?.event_type;
  console.log(`Webhook PayPal recibido: ${eventType} (ID: ${event?.id})`);

  try {
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
      const resource = event.resource;
      const orderId = resource?.supplementary_data?.related_ids?.order_id || resource?.id;

      if (orderId) {
        const existingPurchase = await db.collection('purchases').doc(orderId).get();
        if (existingPurchase.exists && existingPurchase.data().estado === 'aprobado') {
          console.log(`Orden PayPal ${orderId} ya procesada anteriormente.`);
          return res.status(200).send('OK (Ya procesada)');
        }
      }
    }

    return res.status(200).send('Webhook procesado exitosamente');
  } catch (err) {
    console.error('Error en webhook de PayPal:', err);
    return res.status(500).send('Error interno en webhook');
  }
});

/**
 * 4. Estado de Conexión PayPal para Panel Admin
 */
exports.getPaypalStatus = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const user = await verifyAuthToken(req);
    if (!user || !isUserAdmin(user)) {
      return res.status(403).json({ error: 'No autorizado: requiere rol de administrador' });
    }

    try {
      const doc = await db.collection('system_config').doc('paypal').get();
      const env = process.env.PAYPAL_ENV || 'sandbox';
      const clientId = process.env.PAYPAL_CLIENT_ID || '';
      
      if (doc.exists && doc.data()?.client_id) {
        return res.json({
          connected: true,
          env: doc.data().env || env,
          client_id_masked: doc.data().client_id.substring(0, 8) + '...'
        });
      }
      return res.json({
        connected: !!clientId,
        env: env,
        client_id_masked: clientId ? clientId.substring(0, 8) + '...' : ''
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
});

