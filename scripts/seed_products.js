const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar app con credenciales por defecto (si tienes configurado gcloud auth application-default login)
// O en su defecto, en modo emulador si FIRESTORE_EMULATOR_HOST está seteado.
admin.initializeApp({
  projectId: 'psicologiaveganaarg'
});

const db = admin.firestore();

const PRODUCTS = [
  {
    id: "mapa_de_transiciones",
    titulo: "Mapa de Transiciones",
    subtitulo: "8 entregables secuenciales",
    descripcion: "Un mapa para navegar la transición al veganismo, con audios y cuadernillos.",
    estado: "publicado",
    tipo: "pack",
    precio: 25000,
    url_portada: "https://psicologiaveganaarg.web.app/assets/mapa-portada.jpg", // placeholder o ruta real
    items: [
      { id: "01_usted_esta_aqui_audio", titulo: "01 usted está aqui", tipo: "audio", orden: 1, file_path: "mapa_de_transiciones/audios/01 usted está aqui.mp3" },
      { id: "01_usted_esta_aqui_pdf", titulo: "01 usted está aqui (Guía)", tipo: "pdf", orden: 2, file_path: "mapa_de_transiciones/cuadernillos/01 usted está aquí.pdf" },
      { id: "02_curso_esperable_audio", titulo: "02 Mi curso de vida esperable", tipo: "audio", orden: 3, file_path: "mapa_de_transiciones/audios/02 Mi curso de vida esperable.mp3" },
      { id: "02_curso_esperable_pdf", titulo: "02 Curso de vida esperable (Guía)", tipo: "pdf", orden: 4, file_path: "mapa_de_transiciones/cuadernillos/02 Curso de vida esperable.pdf" },
      { id: "03_transiciones_audio", titulo: "03 Transiciones inesperadas", tipo: "audio", orden: 5, file_path: "mapa_de_transiciones/audios/03 Transiciones inesperadas.mp3" },
      { id: "03_ppip_pdf", titulo: "03 PPIP (Guía)", tipo: "pdf", orden: 6, file_path: "mapa_de_transiciones/cuadernillos/03 PPIP.pdf" },
      { id: "04_crisis_audio", titulo: "04 La Crisis", tipo: "audio", orden: 7, file_path: "mapa_de_transiciones/audios/04 La Crisis.mp3" },
      { id: "04_tendencias_pdf", titulo: "04 Tendencias defensivas (Guía)", tipo: "pdf", orden: 8, file_path: "mapa_de_transiciones/cuadernillos/04 Tendencias defensivas.pdf" },
      { id: "05_exploracion_audio", titulo: "05 La Exploración", tipo: "audio", orden: 9, file_path: "mapa_de_transiciones/audios/05 La Exploración.mp3" },
      { id: "05_revision_pdf", titulo: "05 Revisión Personal (Guía)", tipo: "pdf", orden: 10, file_path: "mapa_de_transiciones/cuadernillos/05 Revisión Personal.pdf" },
      { id: "06_capacidad_audio", titulo: "06 Capacidad Creativa", tipo: "audio", orden: 11, file_path: "mapa_de_transiciones/audios/06 Capacidad Creativa.mp3" },
      { id: "06_imagenes_pdf", titulo: "06 las imágenes que me Habitan (Guía)", tipo: "pdf", orden: 12, file_path: "mapa_de_transiciones/cuadernillos/06 las imágenes que me Habitan.pdf" },
      { id: "07_recalcular_audio", titulo: "07 Recalcular", tipo: "audio", orden: 13, file_path: "mapa_de_transiciones/audios/07 Recalcular.mp3" },
      { id: "bonus_1_audio", titulo: "Bonus #1 - Punto de inflexión", tipo: "audio", orden: 14, file_path: "mapa_de_transiciones/audios/Bonus #1 - Punto de inflexión.mp3" },
      { id: "bonus_2_audio", titulo: "Bonus #2 no desconocerse", tipo: "audio", orden: 15, file_path: "mapa_de_transiciones/audios/Bonus #2 no desconocerse.mp3" }
    ]
  },
  {
    id: "autoestima_verde",
    titulo: "Autoestima Verde",
    subtitulo: "4 entregables (Audios + Guía)",
    descripcion: "Microterapias para reconectar con el amor propio y la autoestima en un mundo especista.",
    estado: "publicado",
    tipo: "pack",
    precio: 18000,
    url_portada: "https://psicologiaveganaarg.web.app/assets/autoestima-portada.jpg", // placeholder
    items: [
      { id: "micro_1a_audio", titulo: "Introducción a la autoestima (Parte 1)", tipo: "audio", orden: 1, file_path: "autoestima_verde/audios/1er Microterapia - Introducción a la autoestima parte 1.mp3" },
      { id: "micro_1b_audio", titulo: "Introducción a la autoestima (Parte 2)", tipo: "audio", orden: 2, file_path: "autoestima_verde/audios/1er Microterapia - Introducción a la autoestima parte 2.mp3" },
      { id: "micro_2_audio", titulo: "Amor propio o autoestima", tipo: "audio", orden: 3, file_path: "autoestima_verde/audios/2da Microterapia - Amor propio o autoestima.mp3" },
      { id: "micro_3_audio", titulo: "Autoestima Verde", tipo: "audio", orden: 4, file_path: "autoestima_verde/audios/3era Microterapia- Autoestima Verde.mp3" },
      { id: "guia_autoanalisis_pdf", titulo: "Guía práctica de auto-analisis", tipo: "pdf", orden: 5, file_path: "autoestima_verde/cuadernillos/04 Guía práctica de auto-analisis.pdf" }
    ]
  }
];

async function seedProducts() {
  console.log("🚀 Iniciando volcado de productos en Firestore...");
  try {
    for (const prod of PRODUCTS) {
      const docRef = db.collection('products').doc(prod.id);
      await docRef.set(prod);
      console.log(`✅ Producto creado/actualizado: ${prod.titulo}`);
    }
    console.log("🎉 Seed finalizado correctamente.");
  } catch (error) {
    console.error("❌ Error al hacer seed:", error);
  }
}

seedProducts();
