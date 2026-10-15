const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let cleanUrl = req.url.split('?')[0];
  let filePath = path.join(ROOT, decodeURIComponent(cleanUrl));

  // Si es un directorio, buscar index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Fallback para rutas de portal SPA si no existe el archivo exacto
  if (!fs.existsSync(filePath) && (cleanUrl.startsWith('/portal/') || cleanUrl === '/portal')) {
    filePath = path.join(ROOT, 'portal', 'index.html');
  }

  // Rewrite para rutas de artículos dinámicos
  if (!fs.existsSync(filePath) && (cleanUrl.startsWith('/articulos/') || cleanUrl === '/articulos')) {
    filePath = path.join(ROOT, 'articulo.html');
  }

  // Rewrite para admin
  if (!fs.existsSync(filePath) && (cleanUrl === '/admin' || cleanUrl.startsWith('/admin/'))) {
    filePath = path.join(ROOT, 'admin.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*'
  });

  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Servidor local activo en http://localhost:${PORT}/ con MIME types corregidos`);
});
