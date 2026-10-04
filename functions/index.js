const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const express = require('express');
const cors = require('cors')({ origin: true });
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

admin.initializeApp();
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const app = express();

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

function getMpClient() {
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

    const { productId } = req.body;
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

      const preferenceClient = new Preference(getMpClient());
      const hostUrl = req.headers.origin || 'https://psicologiaveganaarg.web.app';

      const preference = await preferenceClient.create({
        body: {
          items: [
            {
              id: productId,
              title: product.titulo,
              description: product.subtitulo || product.titulo,
              unit_price: Number(product.precio),
              quantity: 1,
              currency_id: 'ARS'
            }
          ],
          metadata: {
            uid_usuario: user.uid,
            id_producto: productId,
            email_usuario: user.email || ''
          },
          external_reference: `${user.uid}___${productId}`,
          back_urls: {
            success: `${hostUrl}/portal?status=success&product_id=${productId}`,
            failure: `${hostUrl}/portal?status=failure`,
            pending: `${hostUrl}/portal?status=pending`
          },
          auto_return: 'approved',
          notification_url: `https://us-central1-psicologiaveganaarg.cloudfunctions.net/mercadopagoWebhook`
        }
      });

      // Registrar transacción pendiente inicial
      await db.collection('transactions').doc(preference.id).set({
        id_transaccion: preference.id,
        uid_usuario: user.uid,
        id_producto: productId,
        monto: Number(product.precio),
        estado: 'pendiente',
        fecha_creacion: FieldValue.serverTimestamp()
      }, { merge: true });

      return res.status(200).json({
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point
      });
    } catch (err) {
      console.error('Error al crear preferencia de Mercado Pago:', err);
      return res.status(500).json({ error: 'Error al generar preferencia de pago', detalle: err.message });
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
    const paymentClient = new Payment(getMpClient());
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
      const batch = db.batch();

      batch.set(transactionRef, {
        id_transaccion: String(paymentId),
        uid_usuario: uid_usuario,
        id_producto: id_producto,
        monto: transaction_amount,
        estado: 'aprobado',
        metodo_pago: payment.payment_type_id || 'mercadopago',
        fecha_aprobacion: FieldValue.serverTimestamp()
      }, { merge: true });

      // Inyección atómica del producto en la colección del usuario
      batch.set(userRef, {
        productos_adquiridos: FieldValue.arrayUnion(id_producto),
        fecha_ultima_compra: FieldValue.serverTimestamp()
      }, { merge: true });

      await batch.commit();
      console.log(`Pago ${paymentId} aprobado. Producto ${id_producto} inyectado a usuario ${uid_usuario}`);
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

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Falta productId' });
    }

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const isAdmin = user.email === 'verde.psicologia@gmail.com';
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
      if (!product.storage_path) {
        return res.status(400).json({ error: 'El producto no tiene archivo asociado configurado' });
      }

      const bucket = storage.bucket();
      const file = bucket.file(product.storage_path);

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
        titulo: product.titulo,
        tipo: product.tipo || 'audio'
      });
    } catch (err) {
      console.error('Error generando Signed URL:', err);
      return res.status(500).json({ error: 'Error al generar enlace seguro', detalle: err.message });
    }
  });
});

