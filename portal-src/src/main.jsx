import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registrar Service Worker para soporte Offline
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/portal/sw.js')
      .then((reg) => console.log('SW registrado con éxito:', reg.scope))
      .catch((err) => console.log('Fallo al registrar SW:', err));
  });
}

