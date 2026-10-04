import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  onSnapshot 
} from './firebase';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import AudioPlayer from './components/AudioPlayer';
import PdfViewer from './components/PdfViewer';
import { 
  Headphones, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShoppingBag, 
  ArrowRight, 
  Loader2 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('biblioteca');
  const [products, setProducts] = useState([]);
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados de reproductores
  const [activeAudio, setActiveAudio] = useState(null);
  const [activePdf, setActivePdf] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Escuchar estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Notificaciones según URL params de retorno de Mercado Pago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      setAlertMessage({
        type: 'success',
        text: '¡Pago aprobado con éxito! Tu recurso ya está habilitado en tu biblioteca.'
      });
      setActiveTab('biblioteca');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'failure') {
      setAlertMessage({
        type: 'error',
        text: 'El pago no pudo completarse. Por favor, intentá nuevamente.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'pending') {
      setAlertMessage({
        type: 'warning',
        text: 'Tu pago está pendiente de acreditación. Apenas se confirme, se activará en tu biblioteca.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Cargar catálogo de productos publicados
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingData(true);
        const q = query(collection(db, 'products'), where('estado', '==', 'publicado'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(list);
      } catch (err) {
        console.error('Error al cargar productos:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadProducts();
  }, []);

  // Escuchar compras del usuario en tiempo real
  useEffect(() => {
    if (!user) {
      setPurchasedIds([]);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPurchasedIds(data.productos_adquiridos || []);
      } else {
        setPurchasedIds([]);
      }
    }, (error) => {
      console.error('Error al sincronizar usuario:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Manejar consumo de recurso protegido con Signed URL
  const handleOpenResource = async (product) => {
    if (!user) return;
    setLoadingResource(true);
    setAlertMessage(null);

    try {
      const token = await user.getIdToken();
      // Endpoint HTTPS de Cloud Functions
      const endpoint = 'https://us-central1-psicologiaveganaarg.cloudfunctions.net/getSignedResourceUrl';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al obtener acceso al archivo');
      }

      const data = await response.json();
      const resourceData = {
        productId: product.id,
        titulo: product.titulo,
        signedUrl: data.signedUrl,
        tipo: product.tipo || 'audio'
      };

      if (resourceData.tipo === 'pdf') {
        setActivePdf(resourceData);
      } else {
        setActiveAudio(resourceData);
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({
        type: 'error',
        text: `No se pudo abrir el recurso: ${err.message}`
      });
    } finally {
      setLoadingResource(false);
    }
  };

  // Manejar checkout con Mercado Pago
  const handleCheckout = async (product) => {
    if (!user) {
      setAlertMessage({
        type: 'warning',
        text: 'Inicia sesión o crea tu cuenta para continuar con la compra.'
      });
      return;
    }

    setCheckoutLoadingId(product.id);
    try {
      const token = await user.getIdToken();
      const endpoint = 'https://us-central1-psicologiaveganaarg.cloudfunctions.net/createCheckoutPreference';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'No se pudo crear la orden de compra');
      }

      const data = await res.json();
      const checkoutUrl = data.sandbox_init_point || data.init_point;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({
        type: 'error',
        text: `Error de pago: ${err.message}`
      });
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0D0A] flex flex-col items-center justify-center text-[#8EB486]">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <span className="text-xs font-mono tracking-wider">Cargando Portal...</span>
      </div>
    );
  }

  // Filtrado de colecciones
  const biblioteca = products.filter((p) => purchasedIds.includes(p.id));
  const explorar = products.filter((p) => !purchasedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-[#0A0D0A] text-[#E2E8F0] pb-32">
      <Navbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Alertas */}
      {alertMessage && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm ${
              alertMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : alertMessage.type === 'error'
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {alertMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span>{alertMessage.text}</span>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Vista no autenticado */}
      {!user ? (
        <AuthModal />
      ) : (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* TAB: MI BIBLIOTECA */}
          {activeTab === 'biblioteca' && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-[#E2E8F0] mb-2">
                  Mi Biblioteca Terapéutica
                </h1>
                <p className="text-sm text-[#8F9B8D]">
                  Tus recursos adquiridos, disponibles para escuchar o leer en cualquier momento.
                </p>
              </div>

              {biblioteca.length === 0 ? (
                <div className="bg-[#141a14] border border-[#232f23] rounded-2xl p-10 text-center max-w-lg mx-auto">
                  <div className="w-14 h-14 mx-auto mb-4 bg-[#8EB486]/10 rounded-full flex items-center justify-center text-[#8EB486]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif text-[#E2E8F0] mb-2">
                    Tu biblioteca aún está vacía
                  </h3>
                  <p className="text-xs text-[#8F9B8D] leading-relaxed mb-6">
                    Aún no tenés audioguías asignadas a tu cuenta. Podés explorar nuestro catálogo con ejercicios de autorregulación emocional y cuadernos prácticos.
                  </p>
                  <button
                    onClick={() => setActiveTab('explorar')}
                    className="py-2.5 px-5 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-xs rounded-xl transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#8EB486]/10"
                  >
                    <span>Explorar catálogo disponible</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {biblioteca.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-[#141a14] border border-[#232f23] hover:border-[#8EB486]/40 rounded-2xl overflow-hidden flex flex-col transition group shadow-xl"
                    >
                      {/* Portada */}
                      <div className="h-44 bg-[#0e130e] relative overflow-hidden flex items-center justify-center">
                        {prod.url_portada ? (
                          <img
                            src={prod.url_portada}
                            alt={prod.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="text-4xl text-[#8EB486]/20">🌿</div>
                        )}
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#0A0D0A]/80 backdrop-blur border border-[#8EB486]/30 text-[10px] font-mono text-[#8EB486] rounded-full flex items-center gap-1.5">
                          {prod.tipo === 'pdf' ? (
                            <>
                              <FileText className="w-3 h-3" /> PDF
                            </>
                          ) : (
                            <>
                              <Headphones className="w-3 h-3" /> Audio
                            </>
                          )}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif text-lg font-medium text-[#E2E8F0] mb-2 leading-snug">
                            {prod.titulo}
                          </h3>
                          <div
                            className="text-xs text-[#8F9B8D] line-clamp-3 mb-4 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: prod.descripcion || '' }}
                          />
                        </div>

                        <button
                          onClick={() => handleOpenResource(prod)}
                          disabled={loadingResource}
                          className="w-full py-2.5 px-4 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          {prod.tipo === 'pdf' ? (
                            <>
                              <FileText className="w-4 h-4" />
                              <span>Abrir Cuadernillo PDF</span>
                            </>
                          ) : (
                            <>
                              <Headphones className="w-4 h-4" />
                              <span>Reproducir Audioguía</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXPLORAR RECURSOS */}
          {activeTab === 'explorar' && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-[#E2E8F0] mb-2">
                  Explorar Recursos & Audioguías
                </h1>
                <p className="text-sm text-[#8F9B8D]">
                  Herramientas creadas específicamente para personas veganas frente al trauma especista, ansiedad y soledad.
                </p>
              </div>

              {explorar.length === 0 ? (
                <div className="bg-[#141a14] border border-[#232f23] rounded-2xl p-10 text-center max-w-lg mx-auto">
                  <Sparkles className="w-8 h-8 text-[#8EB486] mx-auto mb-3" />
                  <h3 className="text-base font-serif text-[#E2E8F0] mb-1">
                    ¡Tenés todo el catálogo adquirido!
                  </h3>
                  <p className="text-xs text-[#8F9B8D]">
                    Ya contás con todos los recursos disponibles en tu biblioteca.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {explorar.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-[#141a14] border border-[#232f23] hover:border-[#8EB486]/40 rounded-2xl overflow-hidden flex flex-col transition group shadow-xl"
                    >
                      <div className="h-44 bg-[#0e130e] relative overflow-hidden flex items-center justify-center">
                        {prod.url_portada ? (
                          <img
                            src={prod.url_portada}
                            alt={prod.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="text-4xl text-[#8EB486]/20">🌿</div>
                        )}
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#0A0D0A]/80 backdrop-blur border border-[#8EB486]/30 text-[10px] font-mono text-[#8EB486] rounded-full">
                          {prod.tipo === 'pdf' ? 'Cuadernillo PDF' : 'Audioguía MP3'}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[#8EB486] font-semibold">
                              ${Number(prod.precio || 0).toLocaleString('es-AR')} ARS
                            </span>
                          </div>
                          <h3 className="font-serif text-lg font-medium text-[#E2E8F0] mb-2 leading-snug">
                            {prod.titulo}
                          </h3>
                          <div
                            className="text-xs text-[#8F9B8D] line-clamp-3 mb-6 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: prod.descripcion || '' }}
                          />
                        </div>

                        <button
                          onClick={() => handleCheckout(prod)}
                          disabled={checkoutLoadingId === prod.id}
                          className="w-full py-2.5 px-4 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          {checkoutLoadingId === prod.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              <span>Comprar con Mercado Pago</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Reproductor de Audio Persistente */}
      {activeAudio && (
        <AudioPlayer resource={activeAudio} onClose={() => setActiveAudio(null)} />
      )}

      {/* Visor de PDF Modal */}
      {activePdf && (
        <PdfViewer resource={activePdf} onClose={() => setActivePdf(null)} />
      )}
    </div>
  );
}
