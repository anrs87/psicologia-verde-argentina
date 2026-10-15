export const DEFAULT_PRODUCTS = [
  {
    id: "mapa_de_transiciones",
    titulo: "Mapa de Transiciones",
    subtitulo: "7 Audios + 2 Bonus (9 Pistas) · 6 Cuadernillos (15 Piezas en total)",
    descripcion: "Un mapa sonoro y clínico para navegar la transición al veganismo, ordenar la crisis personal, resignificar la pérdida de certezas y reconectar con tu sensibilidad sin culpas.",
    estado: "publicado",
    tipo: "pack",
    precio: 25000,
    url_portada: "/assets/portada_mapa_focused.png",
    items: [
      { id: "01_usted_esta_aqui_audio", titulo: "01 Usted está aquí", tipo: "audio", orden: 1, duracion: "12 min", file_path: "mapa_de_transiciones/audios/01 usted está aqui.mp3" },
      { id: "01_usted_esta_aqui_pdf", titulo: "01 Usted está aquí (Guía de Auto-Revisión)", tipo: "pdf", orden: 2, paginas: "12 págs", file_path: "mapa_de_transiciones/cuadernillos/01 usted está aquí.pdf" },
      { id: "02_curso_esperable_audio", titulo: "02 Mi curso de vida esperable", tipo: "audio", orden: 3, duracion: "12 min", file_path: "mapa_de_transiciones/audios/02 Mi curso de vida esperable.mp3" },
      { id: "02_curso_esperable_pdf", titulo: "02 Curso de vida esperable (Guía)", tipo: "pdf", orden: 4, paginas: "10 págs", file_path: "mapa_de_transiciones/cuadernillos/02 Curso de vida esperable.pdf" },
      { id: "03_transiciones_audio", titulo: "03 Transiciones inesperadas", tipo: "audio", orden: 5, duracion: "12 min", file_path: "mapa_de_transiciones/audios/03 Transiciones inesperadas.mp3" },
      { id: "03_ppip_pdf", titulo: "03 PPIP (Plan Personal de Integración)", tipo: "pdf", orden: 6, paginas: "14 págs", file_path: "mapa_de_transiciones/cuadernillos/03 PPIP.pdf" },
      { id: "04_crisis_audio", titulo: "04 La Crisis", tipo: "audio", orden: 7, duracion: "17 min", file_path: "mapa_de_transiciones/audios/04 La Crisis.mp3" },
      { id: "04_tendencias_pdf", titulo: "04 Tendencias defensivas (Guía)", tipo: "pdf", orden: 8, paginas: "15 págs", file_path: "mapa_de_transiciones/cuadernillos/04 Tendencias defensivas.pdf" },
      { id: "05_exploracion_audio", titulo: "05 La Exploración", tipo: "audio", orden: 9, duracion: "11 min", file_path: "mapa_de_transiciones/audios/05 La Exploración.mp3" },
      { id: "05_revision_pdf", titulo: "05 Revisión Personal (Guía)", tipo: "pdf", orden: 10, paginas: "18 págs", file_path: "mapa_de_transiciones/cuadernillos/05 Revisión Personal.pdf" },
      { id: "06_capacidad_audio", titulo: "06 Capacidad Creativa", tipo: "audio", orden: 11, duracion: "16 min", file_path: "mapa_de_transiciones/audios/06 Capacidad Creativa.mp3" },
      { id: "06_imagenes_pdf", titulo: "06 Las imágenes que me habitan (Guía)", tipo: "pdf", orden: 12, paginas: "12 págs", file_path: "mapa_de_transiciones/cuadernillos/06 las imágenes que me Habitan.pdf" },
      { id: "07_recalcular_audio", titulo: "07 Recalcular", tipo: "audio", orden: 13, duracion: "16 min", file_path: "mapa_de_transiciones/audios/07 Recalcular.mp3" },
      { id: "bonus_1_audio", titulo: "Bonus #1 - Punto de inflexión", tipo: "audio", orden: 14, duracion: "10 min", file_path: "mapa_de_transiciones/audios/Bonus #1 - Punto de inflexión.mp3" },
      { id: "bonus_2_audio", titulo: "Bonus #2 - No desconocerse", tipo: "audio", orden: 15, duracion: "10 min", file_path: "mapa_de_transiciones/audios/Bonus #2 no desconocerse.mp3" }
    ]
  },
  {
    id: "autoestima_verde",
    titulo: "Autoestima Verde",
    subtitulo: "4 Microterapias + Cuadernillo 'El YO que habito'",
    descripcion: "Microterapias sonoras para reconectar con el amor propio y la autoestima en un mundo especista. Un proceso guiado para sanar la autoimagen y habitarte sin culpas.",
    estado: "publicado",
    tipo: "pack",
    precio: 18000,
    url_portada: "/assets/portada_autoestima_focused.png",
    items: [
      { id: "micro_1a_audio", titulo: "1er Microterapia - Introducción a la autoestima (Parte 1)", tipo: "audio", orden: 1, duracion: "18 min", file_path: "autoestima_verde/audios/1er Microterapia - Introducción a la autoestima parte 1.mp3" },
      { id: "micro_1b_audio", titulo: "1er Microterapia - Introducción a la autoestima (Parte 2)", tipo: "audio", orden: 2, duracion: "11 min", file_path: "autoestima_verde/audios/1er Microterapia - Introducción a la autoestima parte 2.mp3" },
      { id: "micro_2_audio", titulo: "2da Microterapia - Amor propio o autoestima", tipo: "audio", orden: 3, duracion: "12 min", file_path: "autoestima_verde/audios/2da Microterapia - Amor propio o autoestima.mp3" },
      { id: "micro_3_audio", titulo: "3era Microterapia - Autoestima Verde", tipo: "audio", orden: 4, duracion: "28 min", file_path: "autoestima_verde/audios/3era Microterapia- Autoestima Verde.mp3" },
      { id: "guia_autoanalisis_pdf", titulo: "Cuadernillo Clínico: 'El YO que habito' (Guía de Autoanálisis)", tipo: "pdf", orden: 5, paginas: "32 págs", file_path: "autoestima_verde/cuadernillos/04 Guía práctica de auto-analisis.pdf" }
    ]
  },
  {
    id: "libro_cuerpos_no_humanos",
    titulo: "Cuerpos no-humanos",
    subtitulo: "Capítulo completo del Lic. Mauro García Rodríguez en Cuadernos Tópica Nº 29",
    descripcion: "Un abordaje psicoanalítico sobre el narcisismo residual, la empatía y la emancipación ética más allá de nuestra especie. Publicado en la compilación de Graciela Piperno (Cuadernos Tópica Nº 29). Incluye lectura digital interactiva y documento PDF original para descarga y conservación permanente.",
    estado: "publicado",
    tipo: "pdf",
    precio: 5000,
    precio_ars: 5000,
    precio_usd: 5,
    url_portada: "/assets/portada_cuerpos_extraida.jpeg",
    items: [
      { id: "cuerpos_no_humanos_pdf", titulo: "Capítulo completo: Cuerpos no-humanos (PDF)", tipo: "pdf", orden: 1, paginas: "16 págs", file_path: "Cuerpos_no_humanos_Mauro_Garcia_Rodriguez.pdf" }
    ]
  },
  {
    id: "pack_integral_vegano",
    titulo: "Pack Integral: Trilogía Vegana",
    subtitulo: "Libro Cuerpos no-humanos + Mapa de Transiciones + Autoestima Verde (21 piezas)",
    descripcion: "Acceso total e ilimitado a todo el ecosistema de psicoeducación y clínica antiespecista del Lic. Mauro García. Incluye la obra editorial completa en PDF, la audioguía clínica de transiciones con 9 audios y 6 cuadernillos, y las 4 microterapias de Autoestima Verde con el cuadernillo 'El YO que habito'.",
    estado: "publicado",
    tipo: "bundle",
    bundled_products: ["libro_cuerpos_no_humanos", "mapa_de_transiciones", "autoestima_verde"],
    precio: 35000,
    precio_ars: 35000,
    precio_usd: 35,
    url_portada: "/assets/portada_combo_trilogia.jpg",
    items: [
      { id: "bundle_libro", titulo: "Obra Editorial: Cuerpos no-humanos (PDF completo)", tipo: "pdf", orden: 1, paginas: "16 págs", file_path: "Cuerpos_no_humanos_Mauro_Garcia_Rodriguez.pdf" },
      { id: "bundle_mapa", titulo: "Audioguía: Mapa de Transiciones Vitales (9 audios + 6 cuadernillos)", tipo: "audio", orden: 2, duracion: "9 audios + 6 PDFs", file_path: "mapa_de_transiciones/audios/01 usted está aqui.mp3" },
      { id: "bundle_autoestima", titulo: "Audioguía: Autoestima Verde (4 microterapias + cuadernillo 32 págs)", tipo: "audio", orden: 3, duracion: "4 audios + 1 PDF", file_path: "autoestima_verde/audios/1er Microterapia - Introducción a la autoestima parte 1.mp3" }
    ]
  }
];
