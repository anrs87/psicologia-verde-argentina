const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

admin.initializeApp({ projectId: 'psicologiaveganaarg' });
const db = getFirestore();

async function seedChapter() {
  const mdPath = path.join(__dirname, '..', 'Cuerpos_no_humanos_Mauro_Garcia_Rodriguez.md');
  const md = fs.readFileSync(mdPath, 'utf8');

  const lines = md.split('\n');
  let html = '';
  let inList = false;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) { html += '</ul>\n'; inList = false; }
      continue;
    }
    if (line.startsWith('# ')) {
      html += `<h2 class="text-2xl font-serif font-bold text-brand-accent mt-8 mb-4">${line.replace('# ', '')}</h2>\n`;
    } else if (line.startsWith('## ')) {
      html += `<h3 class="text-xl font-serif font-semibold text-white mt-6 mb-3">${line.replace('## ', '')}</h3>\n`;
    } else if (line.startsWith('### ')) {
      html += `<h4 class="text-lg font-serif italic text-emerald-400 mt-5 mb-2">${line.replace('### ', '')}</h4>\n`;
    } else if (line.startsWith('> ')) {
      html += `<blockquote class="border-l-2 border-brand-accent pl-4 italic text-zinc-300 my-4">${line.replace('> ', '')}</blockquote>\n`;
    } else if (line.startsWith('- ')) {
      if (!inList) { html += '<ul class="list-disc list-inside space-y-1 text-zinc-300 my-3">\n'; inList = true; }
      html += `<li>${line.replace('- ', '')}</li>\n`;
    } else if (line === '---') {
      html += '<hr class="border-brand-border/60 my-6">\n';
    } else {
      let pText = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      html += `<p class="mb-4 leading-relaxed text-zinc-300">${pText}</p>\n`;
    }
  }
  if (inList) html += '</ul>\n';

  const docData = {
    titulo: 'Cuerpos no-humanos: Narcisismo, empatía y antropocentrismo',
    testimonio: 'Un análisis clínico y filosófico sobre nuestra relación con el cuerpo del otro, el narcisismo residual y la empatía extendida más allá de la especie humana.',
    contenido: html,
    fecha: new Date('2024-10-10'),
    imagenPortada: 'assets/libro_corporalidad.webp',
    imagenOrientacion: 'vertical',
    tematica: 'sobrecarga',
    esPremium: true,
    esExclusivo: true,
    precio: 5000,
    ctaRecurso: 'mapa',
    ctaOrientacion: true
  };

  await db.collection('articulos').doc('cuerpos-no-humanos').set(docData, { merge: true });
  console.log('Capitulo creado con exito en Firestore: cuerpos-no-humanos');
  process.exit(0);
}

seedChapter().catch(err => {
  console.error('Error insertando capitulo:', err);
  process.exit(1);
});
