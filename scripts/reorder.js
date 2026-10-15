const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// The new section
const tiendaSection = `
      <!-- NUEVA SECCIÓN TIENDA -->
      <section id="tienda-section" class="mb-24 border-t border-brand-border pt-16 scroll-mt-24">
        <div class="mb-10 text-center sm:text-left">
          <h2 class="font-serif text-3xl text-white">Herramientas Terapéuticas</h2>
          <p class="text-zinc-500 text-sm mt-1">Recursos digitales, audioguías y cuadernillos para transitar el especismo.</p>
        </div>
        <div class="bg-gradient-to-b from-brand-card to-zinc-950 border border-brand-border rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden group hover:border-brand-accent/20 transition-all duration-300">
          <h3 class="font-serif text-2xl text-white mb-4">Accedé a la Tienda y Biblioteca Digital</h3>
          <p class="text-zinc-400 text-sm leading-relaxed max-w-xl mx-auto mb-8">
            Profundizá en los temas abordados en las reflexiones mediante cuadernillos y audioguías diseñados para acompañarte en tu proceso personal, a tu propio ritmo.
          </p>
          <a href="/portal/" class="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-accent text-brand-black hover:bg-brand-accentHover text-sm font-bold rounded-xl transition duration-200 shadow-md">
            <span>Explorar Recursos</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </a>
        </div>
      </section>
`;

// Extract S6 (Artículos)
const s6Start = html.indexOf('<section id="experiencias-section"');
let s6End = html.indexOf('</section>', s6Start) + '</section>'.length;
// Wait, is there a nested </section>? No.
// Let's verify.
let s6Content = html.substring(s6Start, s6End);

// Remove S6 from its original position
html = html.substring(0, s6Start) + html.substring(s6End);

// Find insertion point (after S3)
// S3 is around line 406. S4 starts around line 427.
// S4 starts with: `<section class="mb-24 border-t border-brand-border pt-16">` (Actually S2 and S4 have the same class).
// So let's find the start of Modalidades. It has a comment `<!-- Encabezado de la seccin -->` and `Modalidades de Consulta`
const s4Marker = 'Modalidades de Consulta';
const s4StartSearch = html.lastIndexOf('<section', html.indexOf(s4Marker));

// Insert S6 and Tienda right before S4
const newHtml = html.substring(0, s4StartSearch) + s6Content + '\n' + tiendaSection + '\n' + html.substring(s4StartSearch);

fs.writeFileSync('index.html', newHtml, 'utf8');
console.log('index.html reordenado con éxito.');
