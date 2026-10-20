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
  Loader2,
  Play,
  Layers,
  X,
  ListOrdered,
  User,
  Tag,
  Check,
  Trash2
} from 'lucide-react';
import { DEFAULT_PRODUCTS } from './data/defaultProducts';

function formatProductDescription(raw) {
  if (!raw) return '';
  if (raw.includes('<p>') || raw.includes('<br>')) return raw;
  const paras = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (paras.length > 1) {
    return paras.map(p => `<p class="mb-2.5 leading-relaxed">${p.replace(/\n/g, '<br>')}</p>`).join('');
  }
  return `<p class="leading-relaxed">${raw.replace(/\n/g, '<br>')}</p>`;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explorar');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('portal_catalog_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PRODUCTS;
  });
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados de reproductores y contenidos
  const [activeAudio, setActiveAudio] = useState(null);
  const [activePdf, setActivePdf] = useState(null);
  const [activeResourceModal, setActiveResourceModal] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Estados de Checkout y Cupones Promocionales
  const [checkoutModalProduct, setCheckoutModalProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mercadopago'); // 'mercadopago' | 'paypal'
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [upsellModalOffer, setUpsellModalOffer] = useState(null);

  // Activar upsell de segunda venta post-compra con 50% de descuento
  const triggerPostPurchaseUpsell = (purchasedId) => {
    let upsellTargetId = 'mapa_de_transiciones';
    if (purchasedId === 'mapa_de_transiciones') {
      upsellTargetId = 'autoestima_verde';
    } else if (purchasedId === 'autoestima_verde') {
      upsellTargetId = 'mapa_de_transiciones';
    } else if (purchasedId === 'pack_integral_vegano') {
      return;
    }

    const targetProd = products.find(p => p.id === upsellTargetId) || DEFAULT_PRODUCTS.find(p => p.id === upsellTargetId);
    if (!targetProd) return;

    setUpsellModalOffer({
      purchasedId: purchasedId || 'libro_cuerpos_no_humanos',
      product: targetProd,
      coupon: 'UPSELL50',
      discountPct: 50
    });
  };

  // Escuchar estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Notificaciones según URL params de retorno de Mercado Pago o PayPal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const targetProduct = params.get('producto') || params.get('product_id');
    const targetTab = params.get('tab');
    const paypalOrderId = params.get('token') || params.get('order_id');

    if (status === 'success' && !paypalOrderId) {
      setAlertMessage({
        type: 'success',
        text: '¡Pago aprobado con éxito! Tu recurso ya está habilitado en tu biblioteca.'
      });
      setActiveTab('biblioteca');
      window.history.replaceState({}, document.title, window.location.pathname);
      triggerPostPurchaseUpsell(targetProduct);
    } else if (status === 'paypal_success' || (status === 'success' && paypalOrderId)) {
      if (paypalOrderId && user) {
        const capturedKey = `paypal_captured_${paypalOrderId}`;
        if (!sessionStorage.getItem(capturedKey)) {
          sessionStorage.setItem(capturedKey, 'true');
          (async () => {
            try {
              const userToken = await user.getIdToken();
              const captureEndpoint = 'https://us-central1-psicologiaveganaarg.cloudfunctions.net/capturePaypalOrder';
              const captureRes = await fetch(captureEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${userToken}`
                },
                body: JSON.stringify({ orderId: paypalOrderId })
              });
              if (captureRes.ok) {
                setAlertMessage({
                  type: 'success',
                  text: '¡Pago internacional con PayPal aprobado con éxito! Tu recurso ya está habilitado en tu biblioteca.'
                });
                setActiveTab('biblioteca');
                window.history.replaceState({}, document.title, window.location.pathname);
                triggerPostPurchaseUpsell(targetProduct);
              }
            } catch (e) {
              console.warn('Error capturando PayPal tras redirección:', e);
            }
          })();
        }
      } else {
        setAlertMessage({
          type: 'success',
          text: '¡Pago internacional procesado! Tu recurso se habilitará en breve en tu biblioteca.'
        });
        setActiveTab('biblioteca');
        triggerPostPurchaseUpsell(targetProduct);
      }
    } else if (status === 'failure' || status === 'cancel') {
      setAlertMessage({
        type: 'error',
        text: 'La operación de pago no se completó. Por favor, intentá nuevamente.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'pending') {
      setAlertMessage({
        type: 'warning',
        text: 'Tu pago está pendiente de acreditación. Apenas se confirme, se activará en tu biblioteca.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (targetTab) {
      setActiveTab(targetTab);
    }

    if (targetProduct) {
      setActiveTab('explorar');
      const found = products.find((p) => p.id === targetProduct) || DEFAULT_PRODUCTS.find((p) => p.id === targetProduct);
      if (found) {
        setActiveResourceModal(found);
      }
    }
  }, [user, products]);

  // Cargar catálogo de productos publicados
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingData(true);
        const q = query(collection(db, 'products'), where('estado', '==', 'publicado'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          // Fusionar con DEFAULT_PRODUCTS para preservar las guías oficiales, portadas HD y módulos
          const merged = DEFAULT_PRODUCTS.map((def) => {
            const found = list.find((p) => p.id === def.id || (p.titulo && p.titulo.toLowerCase().trim() === def.titulo.toLowerCase().trim()));
            return found ? { ...def, ...found, url_portada: def.url_portada, items: (def.items || found.items) } : def;
          });
          // Incorporar recursos y productos adicionales creados desde el admin
          const dynamicProds = list.filter((p) => !DEFAULT_PRODUCTS.some((def) => def.id === p.id || (p.titulo && p.titulo.toLowerCase().trim() === def.titulo.toLowerCase().trim())));
          const fullCatalog = [...merged, ...dynamicProds];
          setProducts(fullCatalog);
          try {
            localStorage.setItem('portal_catalog_products', JSON.stringify(fullCatalog));
          } catch (e) {}
        } else {
          setProducts(DEFAULT_PRODUCTS);
        }
      } catch (err) {
        console.error('Nota: usando catálogo local:', err);
        setProducts(DEFAULT_PRODUCTS);
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

  // Manejar consumo de recurso protegido con Signed URL (soporta módulos individuales)
  const handleOpenResource = async (product, item = null) => {
    // Si el producto tiene múltiples módulos secuenciales y no se clickeó uno puntual, abrir índice
    if (Array.isArray(product.items) && product.items.length > 1 && !item) {
      setActiveResourceModal(product);
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      setAlertMessage({
        type: 'warning',
        text: 'Iniciá sesión o creá tu cuenta de paciente para reproducir y descargar tus recursos.'
      });
      return;
    }

    const isPurchased = purchasedIds.includes(product.id) || (Array.isArray(product.bundled_products) && product.bundled_products.length > 0 && product.bundled_products.every(bid => purchasedIds.includes(bid)));
    if (!isPurchased) {
      setAlertMessage({
        type: 'warning',
        text: 'Este recurso requiere ser adquirido previamente para acceder a las grabaciones y documentos completos.'
      });
      return;
    }

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
        body: JSON.stringify({ 
          productId: product.id,
          itemId: item ? item.id : undefined 
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al obtener acceso al archivo');
      }

      const data = await response.json();
      const resourceData = {
        productId: product.id,
        itemId: item ? item.id : null,
        titulo: data.titulo || (item ? item.titulo : product.titulo),
        productTitle: product.titulo,
        signedUrl: data.signedUrl,
        tipo: data.tipo || (item ? item.tipo : (product.tipo || 'audio'))
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

  // Abrir modal de checkout con cupones
  const openCheckoutModal = (product, autoCoupon = null) => {
    if (!user) {
      setShowAuthModal(true);
      setAlertMessage({
        type: 'warning',
        text: 'Iniciá sesión o creá tu cuenta para continuar con la compra.'
      });
      return;
    }
    setCheckoutModalProduct(product);
    setCouponInput(autoCoupon || '');
    setAppliedCoupon(null);
    setCouponError(null);
    if (autoCoupon) {
      handleApplyCoupon(autoCoupon, product.id);
    }
  };

  // Validar cupón con el backend
  const handleApplyCoupon = async (overrideCode = null, overrideProductId = null) => {
    const code = (overrideCode || couponInput).trim();
    const prodId = overrideProductId || checkoutModalProduct?.id;
    if (!code || !prodId) return;
    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const endpoint = 'https://us-central1-psicologiaveganaarg.cloudfunctions.net/validateCoupon';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: code,
          productId: prodId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || 'El cupón no es válido o ha expirado');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        setCouponError(null);
      }
    } catch (err) {
      console.error(err);
      setCouponError('Error al verificar el cupón. Por favor, intentá nuevamente.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Manejar checkout con Mercado Pago
  const handleCheckout = async (product, couponCode = null) => {
    if (!user) {
      setShowAuthModal(true);
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
        body: JSON.stringify({
          productId: product.id,
          couponCode: couponCode || appliedCoupon?.codigo || undefined
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'No se pudo crear la orden de compra');
      }

      const data = await res.json();
      const checkoutUrl = data.init_point || data.sandbox_init_point;
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

  // Manejar checkout internacional con PayPal
  const handlePaypalCheckout = async (product, couponCode = null) => {
    if (!user) {
      setShowAuthModal(true);
      setAlertMessage({
        type: 'warning',
        text: 'Inicia sesión o crea tu cuenta para continuar con la compra.'
      });
      return;
    }

    setCheckoutLoadingId(product.id);
    try {
      const token = await user.getIdToken();
      const endpoint = 'https://us-central1-psicologiaveganaarg.cloudfunctions.net/createPaypalOrder';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          couponCode: couponCode || appliedCoupon?.codigo || undefined
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'No se pudo generar la orden de PayPal');
      }

      const data = await res.json();
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        throw new Error('No se recibió la URL de pago de PayPal');
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({
        type: 'error',
        text: `Error de pago con PayPal: ${err.message}`
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

  // Filtrado de colecciones (reconoce tanto posesión individual como posesión vía pack integral)
  const isProductPurchased = (p) => {
    if (purchasedIds.includes(p.id)) return true;
    if (Array.isArray(p.bundled_products) && p.bundled_products.length > 0) {
      return p.bundled_products.every(bid => purchasedIds.includes(bid));
    }
    return false;
  };
  const biblioteca = products.filter(isProductPurchased);
  const explorar = products.filter((p) => !isProductPurchased(p));

  return (
    <div className="min-h-screen bg-[#0A0D0A] text-[#E2E8F0] pb-32 overflow-x-hidden w-full">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

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

      {/* Contenido principal público y privado */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* TAB: MI BIBLIOTECA */}
        {activeTab === 'biblioteca' && (
          <div className="max-w-5xl mx-auto">
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-[#8EB486] px-3.5 py-1 rounded-full bg-[#8EB486]/10 border border-[#8EB486]/25 mb-3">
                Tu Espacio Personal
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif text-[#E2E8F0] mb-2">
                Mi Biblioteca Terapéutica
              </h1>
              <p className="text-sm text-[#8F9B8D] leading-relaxed">
                Tus recursos adquiridos, disponibles para escuchar o leer en cualquier momento.
              </p>
            </div>

            {!user ? (
              <div className="bg-[#141a14] border border-[#232f23] rounded-2xl p-10 text-center max-w-lg mx-auto shadow-xl">
                <div className="w-14 h-14 mx-auto mb-4 bg-[#8EB486]/10 rounded-full flex items-center justify-center text-[#8EB486] border border-[#8EB486]/20">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif text-[#E2E8F0] mb-2">
                  Ingresá a tu cuenta de paciente
                </h3>
                <p className="text-xs text-[#8F9B8D] leading-relaxed mb-6">
                  Iniciá sesión o registrate con el mismo correo electrónico que utilizaste al adquirir tu recurso para desbloquear tus grabaciones y cuadernos clínicos.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="py-2.5 px-6 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-xs rounded-xl transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#8EB486]/10"
                >
                  <span>Iniciar sesión o Crear cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : biblioteca.length === 0 ? (
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
                          {prod.items && prod.items.length > 1 ? (
                            <>
                              <Layers className="w-3 h-3" /> {prod.items.length} Módulos
                            </>
                          ) : prod.tipo === 'pdf' ? (
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
                            dangerouslySetInnerHTML={{ __html: formatProductDescription(prod.descripcion) }}
                          />
                        </div>

                        <button
                          onClick={() => handleOpenResource(prod)}
                          disabled={loadingResource}
                          className="w-full py-2.5 px-4 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          {prod.items && prod.items.length > 1 ? (
                            <>
                              <ListOrdered className="w-4 h-4" />
                              <span>Ver Contenidos ({prod.items.length} módulos)</span>
                            </>
                          ) : prod.tipo === 'pdf' ? (
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
            <div className="max-w-5xl mx-auto">
              <div className="mb-10 text-center max-w-2xl mx-auto">
                <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-[#8EB486] px-3.5 py-1 rounded-full bg-[#8EB486]/10 border border-[#8EB486]/25 mb-3">
                  Catálogo Clínico
                </span>
                <h1 className="text-2xl sm:text-4xl font-serif text-[#E2E8F0] mb-3">
                  Explorar Recursos & Audioguías
                </h1>
                <p className="text-sm sm:text-base text-[#8F9B8D] leading-relaxed">
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
                      <div className="h-48 bg-[#0c100c] p-2 relative overflow-hidden flex items-center justify-center">
                        {prod.url_portada ? (
                          <img
                            src={prod.url_portada}
                            alt={prod.titulo}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-500 rounded-lg"
                          />
                        ) : (
                          <div className="text-4xl text-[#8EB486]/20">🌿</div>
                        )}
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#0A0D0A]/85 backdrop-blur border border-[#8EB486]/30 text-[10px] font-mono text-[#8EB486] rounded-full shadow-md">
                          {prod.items && prod.items.length > 1 ? `Pack (${prod.items.length} módulos)` : prod.tipo === 'pdf' ? 'Capítulo / PDF' : 'Audioguía MP3'}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[#8EB486] font-semibold">
                              ${Number(prod.precio || 0).toLocaleString('es-AR')} ARS
                            </span>
                            <span className="text-[10px] font-mono text-sky-400">
                              / ${prod.precio_usd || (prod.id === 'mapa_de_transiciones' ? 25 : (prod.id === 'autoestima_verde' ? 18 : 5))} USD
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

                        <div className="space-y-2 mt-4">
                          {prod.items && prod.items.length > 0 && (
                            <button
                              onClick={() => setActiveResourceModal(prod)}
                              className="w-full py-2 px-4 bg-[#1a231a] hover:bg-[#232f23] text-[#8EB486] hover:text-[#B5CFB0] border border-[#8EB486]/30 font-medium text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                              <ListOrdered className="w-3.5 h-3.5" />
                              <span>{prod.items.length > 1 ? `Ver plan de contenidos (${prod.items.length} módulos)` : 'Ver detalle y material incluido'}</span>
                            </button>
                          )}

                          {purchasedIds.includes(prod.id) ? (
                            <button
                              onClick={() => {
                                setActiveTab('biblioteca');
                                handleOpenResource(prod);
                              }}
                              className="w-full py-2.5 px-4 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>Acceder desde mi biblioteca</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openCheckoutModal(prod)}
                              disabled={checkoutLoadingId === prod.id}
                              className="w-full py-2.5 px-4 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                            >
                              {checkoutLoadingId === prod.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <ShoppingBag className="w-4 h-4" />
                                  <span>Adquirir Recurso</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

      {/* Modal de Módulos y Entregables del Recurso */}
      {activeResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#141a14] border border-[#232f23] rounded-2xl flex flex-col overflow-hidden shadow-2xl max-h-[90vh] my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-[#0e130e] border-b border-[#232f23] flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-zinc-900 border border-[#232f23] overflow-hidden shrink-0 flex items-center justify-center">
                  {activeResourceModal.url_portada ? (
                    <img src={activeResourceModal.url_portada} alt={activeResourceModal.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl sm:text-2xl">📦</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8EB486]/10 text-[#8EB486] border border-[#8EB486]/20 uppercase inline-block">
                    Recurso Integral
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-medium text-[#E2E8F0] mt-0.5 leading-snug truncate">
                    {activeResourceModal.titulo}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#8F9B8D] mt-0.5 truncate">
                    {activeResourceModal.subtitulo || `${activeResourceModal.items?.length || 0} entregables secuenciales`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveResourceModal(null)}
                className="p-1.5 rounded-lg text-[#8F9B8D] hover:text-[#E2E8F0] hover:bg-[#232f23] transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Lista de Módulos */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              <div className="text-xs text-[#8F9B8D] leading-relaxed mb-4 space-y-2.5" dangerouslySetInnerHTML={{ __html: formatProductDescription(activeResourceModal.descripcion) }} />
              
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8EB486] mb-3">
                Plan de Trabajo / Contenidos en Orden:
              </h4>

              <div className="space-y-2.5">
                {(activeResourceModal.items || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 sm:p-3.5 bg-[#0e130e] border border-[#232f23] hover:border-[#8EB486]/40 rounded-xl flex items-center justify-between gap-2 sm:gap-3 transition group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#1a231a] text-[#8EB486] text-[11px] sm:text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-[#8EB486]/20">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs sm:text-sm font-medium text-[#E2E8F0] truncate group-hover:text-[#8EB486] transition">
                          {item.titulo || `Módulo ${idx + 1}`}
                        </h5>
                        <span className="text-[10px] sm:text-[11px] text-[#8F9B8D] font-mono flex items-center gap-1 mt-0.5">
                          {item.tipo === 'pdf' ? (
                            <>
                              <FileText className="w-3 h-3 text-amber-400 shrink-0" /> <span className="truncate">PDF</span>
                            </>
                          ) : (
                            <>
                              <Headphones className="w-3 h-3 text-[#8EB486] shrink-0" /> <span className="truncate">Audio MP3</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenResource(activeResourceModal, item)}
                      disabled={loadingResource}
                      className="py-1 px-2.5 sm:py-1.5 sm:px-3.5 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-xs rounded-lg transition flex items-center gap-1 shrink-0 shadow-md disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {item.tipo === 'pdf' ? <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />}
                      <span>{item.tipo === 'pdf' ? 'Leer PDF' : 'Reproducir'}</span>
                    </button>
                  </div>
                ))}
              </div>

              {!purchasedIds.includes(activeResourceModal.id) && (
                <div className="pt-4 mt-4 border-t border-[#232f23] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e130e]/80 p-4 rounded-xl border">
                  <div>
                    <div className="text-sm font-semibold text-[#8EB486]">
                      ${Number(activeResourceModal.precio || 0).toLocaleString('es-AR')} ARS
                    </div>
                    <div className="text-[11px] text-sky-400 font-mono">
                      Exterior: ${activeResourceModal.precio_usd || (activeResourceModal.id === 'mapa_de_transiciones' ? 25 : (activeResourceModal.id === 'autoestima_verde' ? 18 : 5))} USD (PayPal)
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const prod = activeResourceModal;
                      setActiveResourceModal(null);
                      openCheckoutModal(prod);
                    }}
                    className="w-full sm:w-auto py-2.5 px-5 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#8EB486]/10"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Adquirir recurso ahora</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checkout / Cupones */}
      {checkoutModalProduct && (() => {
        const origPrice = Number(checkoutModalProduct.precio_ars || checkoutModalProduct.precio || 0);
        let discount = 0;
        if (appliedCoupon) {
          if (appliedCoupon.tipo === 'porcentaje') {
            discount = Math.round((origPrice * (Number(appliedCoupon.descuento) || 0)) / 100);
          } else {
            discount = Math.min(origPrice, Number(appliedCoupon.descuento) || 0);
          }
        }
        const finalPrice = Math.max(0, origPrice - discount);

        const origPriceUsd = Number(checkoutModalProduct.precio_usd) || 
          (checkoutModalProduct.id === 'mapa_de_transiciones' ? 25 : 
          (checkoutModalProduct.id === 'autoestima_verde' ? 18 : 
          (checkoutModalProduct.id === 'libro_cuerpos_no_humanos' ? 5 :
          Math.max(5, Math.round(origPrice / 1000)))));
        let discountUsd = 0;
        if (appliedCoupon) {
          if (appliedCoupon.tipo === 'porcentaje') {
            discountUsd = Number(((origPriceUsd * (Number(appliedCoupon.descuento) || 0)) / 100).toFixed(2));
          } else {
            discountUsd = Number(appliedCoupon.descuento_usd || 5);
          }
        }
        const finalPriceUsd = Math.max(1, Number((origPriceUsd - discountUsd).toFixed(2)));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-[#141a14] border border-[#232f23] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-5 bg-[#0e130e] border-b border-[#232f23] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#8EB486]/10 border border-[#8EB486]/20 flex items-center justify-center text-[#8EB486]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-medium text-[#E2E8F0]">Finalizar Adquisición</h3>
                    <p className="text-[11px] text-[#8F9B8D]">Pago 100% seguro y acceso inmediato</p>
                  </div>
                </div>
                <button
                  onClick={() => setCheckoutModalProduct(null)}
                  className="p-1.5 rounded-lg text-[#8F9B8D] hover:text-[#E2E8F0] hover:bg-[#232f23] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-5">
                {/* Info Producto */}
                <div className="flex items-center gap-4 p-3.5 bg-[#0e130e] border border-[#232f23] rounded-xl">
                  <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-[#232f23] overflow-hidden shrink-0 flex items-center justify-center">
                    {checkoutModalProduct.url_portada ? (
                      <img src={checkoutModalProduct.url_portada} alt={checkoutModalProduct.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🌿</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-[#E2E8F0] truncate">{checkoutModalProduct.titulo}</h4>
                    <p className="text-xs text-[#8F9B8D] line-clamp-1 mt-0.5">{checkoutModalProduct.subtitulo || 'Guía terapéutica clínica'}</p>
                    <span className="inline-block mt-1 text-[11px] font-mono text-[#8EB486]">
                      {paymentMethod === 'mercadopago' 
                        ? `$${origPrice.toLocaleString('es-AR')} ARS`
                        : `$${origPriceUsd.toFixed(2)} USD`}
                    </span>
                  </div>
                </div>

                {/* Selector de Método de Pago */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8F9B8D] flex items-center justify-between">
                    <span>Método de pago / Moneda</span>
                    <span className="text-[11px] text-[#8EB486]">
                      {paymentMethod === 'mercadopago' ? 'Argentina (ARS)' : 'Exterior (USD)'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mercadopago')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                        paymentMethod === 'mercadopago'
                          ? 'bg-[#1a291a] border-[#8EB486] text-[#8EB486] shadow-sm font-semibold'
                          : 'bg-[#0e130e] border-[#232f23] text-zinc-400 hover:text-white hover:border-[#344634]'
                      }`}
                    >
                      <span>🇦🇷 Mercado Pago</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                        paymentMethod === 'paypal'
                          ? 'bg-[#1a291a] border-[#8EB486] text-[#8EB486] shadow-sm font-semibold'
                          : 'bg-[#0e130e] border-[#232f23] text-zinc-400 hover:text-white hover:border-[#344634]'
                      }`}
                    >
                      <span>🌎 PayPal (Exterior)</span>
                    </button>
                  </div>
                </div>

                {/* Order Bump / Upsell In-Checkout (para compradores del libro) */}
                {checkoutModalProduct.id === 'libro_cuerpos_no_humanos' && (
                  <div className="p-4 bg-gradient-to-r from-[#172518] to-[#101911] border border-[#8EB486]/50 rounded-2xl space-y-2.5 relative overflow-hidden shadow-lg">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs">
                        <span className="font-semibold text-white">¿Querés sumar el Mapa de Transiciones al 50% OFF?</span>
                        <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                          Por adquirir el libro accedés a la Audioguía completa (9 pistas clínicas + 6 cuadernillos) por solo <strong className="text-[#8EB486] font-mono">$12.500 ARS</strong> / <strong className="text-[#8EB486] font-mono">$12.50 USD</strong> (en lugar de $25.000 ARS / $25 USD).
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const targetProd = products.find(p => p.id === 'mapa_de_transiciones') || DEFAULT_PRODUCTS.find(p => p.id === 'mapa_de_transiciones');
                        if (targetProd) {
                          openCheckoutModal(targetProd, 'UPSELL50');
                        }
                      }}
                      className="w-full py-2.5 px-3 bg-[#8EB486]/20 hover:bg-[#8EB486]/35 border border-[#8EB486]/60 rounded-xl text-[#8EB486] font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Cambiar orden a Mapa de Transiciones al 50% OFF →</span>
                    </button>
                  </div>
                )}

                {/* Cupón de descuento */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#8F9B8D] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#8EB486]" />
                    <span>¿Tenés un cupón de descuento?</span>
                  </label>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-[#1a291a] border border-[#8EB486]/40 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#8EB486]" />
                        <div>
                          <p className="text-xs font-semibold text-[#8EB486]">
                            Cupón <span className="font-mono tracking-wider">{appliedCoupon.codigo}</span> aplicado
                          </p>
                          <p className="text-[10px] text-[#B5CFB0]">
                            {appliedCoupon.tipo === 'porcentaje' 
                              ? `${appliedCoupon.descuento}% de descuento` 
                              : (paymentMethod === 'mercadopago' ? `$${appliedCoupon.descuento} ARS de descuento` : `$${appliedCoupon.descuento_usd || 5} USD de descuento`)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setAppliedCoupon(null); setCouponInput(''); }}
                        className="p-1 text-[#8F9B8D] hover:text-red-400 hover:bg-[#232f23] rounded transition cursor-pointer"
                        title="Remover cupón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: LANZAMIENTO"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                        className="flex-1 bg-[#0e130e] border border-[#232f23] focus:border-[#8EB486] text-xs font-mono uppercase px-3 py-2 rounded-xl text-[#E2E8F0] placeholder-[#505a4e] outline-none transition"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponInput.trim()}
                        className="px-4 py-2 bg-[#232f23] hover:bg-[#2e3e2e] text-[#8EB486] font-medium text-xs rounded-xl border border-[#8EB486]/30 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                      >
                        {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}
                </div>

                {/* Desglose de Pago */}
                {paymentMethod === 'mercadopago' ? (
                  <div className="p-4 bg-[#0e130e] border border-[#232f23] rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-[#8F9B8D]">
                      <span>Precio original</span>
                      <span className="font-mono">${origPrice.toLocaleString('es-AR')} ARS</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-[#8EB486]">
                        <span>Descuento aplicado</span>
                        <span className="font-mono">-${discount.toLocaleString('es-AR')} ARS</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-[#232f23] flex justify-between text-sm font-semibold text-[#E2E8F0]">
                      <span>Total a abonar</span>
                      <span className="font-mono text-[#8EB486] text-base">${finalPrice.toLocaleString('es-AR')} ARS</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#0e130e] border border-[#232f23] rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-[#8F9B8D]">
                      <span>Precio internacional</span>
                      <span className="font-mono">${origPriceUsd.toFixed(2)} USD</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-[#8EB486]">
                        <span>Descuento aplicado</span>
                        <span className="font-mono">-${discountUsd.toFixed(2)} USD</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-[#232f23] flex justify-between text-sm font-semibold text-[#E2E8F0]">
                      <span>Total a abonar</span>
                      <span className="font-mono text-[#8EB486] text-base">${finalPriceUsd.toFixed(2)} USD</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 pt-1">
                      Acepta tarjetas internacionales de crédito/débito (Visa, Mastercard, AMEX) o saldo PayPal.
                    </p>
                  </div>
                )}

                {/* Botón de Pago según método */}
                {paymentMethod === 'mercadopago' ? (
                  <button
                    onClick={() => handleCheckout(checkoutModalProduct, appliedCoupon?.codigo)}
                    disabled={checkoutLoadingId === checkoutModalProduct.id}
                    className="w-full py-3 px-4 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {checkoutLoadingId === checkoutModalProduct.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando orden de pago...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Pagar con Mercado Pago (${finalPrice.toLocaleString('es-AR')} ARS)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => handlePaypalCheckout(checkoutModalProduct, appliedCoupon?.codigo)}
                      disabled={checkoutLoadingId === checkoutModalProduct.id}
                      className="w-full py-3 px-4 bg-[#0070BA] hover:bg-[#005ea6] text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {checkoutLoadingId === checkoutModalProduct.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Conectando con PayPal...</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold italic text-base">P</span>
                          <span>Pagar con PayPal / Tarjeta (${finalPriceUsd.toFixed(2)} USD)</span>
                        </>
                      )}
                    </button>

                    {/* Respaldo / Canal Asistido solicitado por Mauro */}
                    <div className="text-center pt-1 border-t border-[#232f23]/60">
                      <p className="text-[11px] text-zinc-400">
                        ¿Estás en el exterior y no tenés tarjeta ni PayPal?{' '}
                        <a
                          href={`https://wa.me/5491136940026?text=${encodeURIComponent(
                            `Hola Mauro, te escribo desde el exterior para coordinar la adquisición de "${checkoutModalProduct.titulo}".`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8EB486] hover:underline font-medium"
                        >
                          Coordinar por WhatsApp
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Upselling Post-Compra (50% OFF en Segunda Venta) */}
      {upsellModalOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0F1510] border-2 border-[#8EB486]/60 rounded-3xl shadow-[0_0_50px_rgba(142,180,134,0.25)] overflow-hidden">
            
            {/* Cabecera con degradé y badge */}
            <div className="bg-gradient-to-r from-[#1E2B1F] via-[#142015] to-[#0F1510] p-6 pb-4 border-b border-[#233324] relative">
              <button
                onClick={() => setUpsellModalOffer(null)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                title="Cerrar oferta"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8EB486]/15 border border-[#8EB486]/40 text-[#8EB486] text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Oferta Especial Post-Compra · 50% OFF</span>
              </div>
              <h3 className="font-serif text-2xl text-white font-bold leading-tight">
                ¡Felicitaciones por tu compra!
              </h3>
              <p className="text-zinc-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Por haber confiado en este espacio, tenés un <strong className="text-[#8EB486]">50% de DESCUENTO exclusivo</strong> en tu segunda adquisición para complementar tu biblioteca:
              </p>
            </div>

            {/* Tarjeta del Producto en Upsell */}
            <div className="p-6 space-y-4">
              <div className="flex gap-4 p-4 bg-[#141C15] border border-[#233324] rounded-2xl items-center">
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-black/50 border border-[#2D3F2E] shrink-0 flex items-center justify-center">
                  {upsellModalOffer.product.url_portada ? (
                    <img
                      src={upsellModalOffer.product.url_portada}
                      alt={upsellModalOffer.product.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-2xl">🌿</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8EB486]">Segunda Venta Bonificada</span>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-white truncate">
                    {upsellModalOffer.product.titulo}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                    {upsellModalOffer.product.subtitulo || upsellModalOffer.product.descripcion}
                  </p>

                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-xs text-zinc-500 line-through">
                      ${Number(upsellModalOffer.product.precio || 25000).toLocaleString('es-AR')} ARS
                    </span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      ${(Number(upsellModalOffer.product.precio || 25000) * 0.5).toLocaleString('es-AR')} ARS
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      -50%
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Exterior: <span className="line-through">${upsellModalOffer.product.precio_usd || 25} USD</span> → <strong className="text-emerald-400">${(Number(upsellModalOffer.product.precio_usd || 25) * 0.5).toFixed(2)} USD</strong>
                  </div>
                </div>
              </div>

              {/* Botón de Acción Principal */}
              <button
                onClick={() => {
                  const target = upsellModalOffer.product;
                  setUpsellModalOffer(null);
                  openCheckoutModal(target, 'UPSELL50');
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#8EB486] to-[#7CA074] hover:from-[#7CA074] hover:to-[#6B8E63] text-[#0A0D0A] font-bold text-sm rounded-xl transition duration-300 shadow-xl shadow-[#8EB486]/20 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Aprovechar 50% OFF y Adquirir ahora</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Botón Secundario Descartar */}
              <div className="text-center pt-1">
                <button
                  onClick={() => setUpsellModalOffer(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition py-1 cursor-pointer"
                >
                  No gracias, continuar a mi biblioteca →
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reproductor de Audio Persistente */}
      {activeAudio && (
        <AudioPlayer resource={activeAudio} onClose={() => setActiveAudio(null)} />
      )}

      {/* Visor de PDF Modal */}
      {activePdf && (
        <PdfViewer resource={activePdf} onClose={() => setActivePdf(null)} />
      )}

      {/* Modal Flotante de Autenticación */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
