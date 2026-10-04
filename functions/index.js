const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp();
const db = admin.firestore();
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
