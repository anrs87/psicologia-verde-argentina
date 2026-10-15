const CACHE_NAME = 'psicologia-verde-offline-v1';

/**
 * Verifica si un recurso de audio está disponible sin conexión en Cache Storage.
 */
export async function isOfflineAvailable(key) {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(key);
    return !!match;
  } catch (err) {
    console.error('Error al verificar cache offline:', err);
    return false;
  }
}

/**
 * Descarga y almacena un archivo de audio en Cache Storage para reproducción offline.
 */
export async function saveAudioToOffline(key, url) {
  if (!('caches' in window)) {
    throw new Error('Tu navegador no soporta almacenamiento offline.');
  }

  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error('No se pudo descargar el archivo para modo offline');
  }

  await cache.put(key, response);
  return true;
}

/**
 * Recupera un audio almacenado en cache y devuelve una URL blob reproducible.
 */
export async function getOfflineAudioUrl(key) {
  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);
    if (!response) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Error al recuperar audio offline:', err);
    return null;
  }
}

/**
 * Elimina un recurso del almacenamiento offline.
 */
export async function removeOfflineAudio(key) {
  if (!('caches' in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(key);
  } catch (err) {
    console.error('Error al eliminar audio offline:', err);
  }
}

/**
 * Obtiene la lista de todos los recursos guardados offline.
 */
export async function getAllCachedKeys() {
  if (!('caches' in window)) return [];
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    return requests.map(r => r.url);
  } catch (err) {
    console.error('Error al listar cache offline:', err);
    return [];
  }
}
