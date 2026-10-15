const fs = require('fs');
const envContent = fs.readFileSync('F:/Proyectos/PSICOLOGIA VERDE ARGENTINA/functions/.env', 'utf8');
const match = envContent.match(/RESEND_API_KEY=(.+)/);
const resendApiKey = match ? match[1].trim() : '';

if (!resendApiKey) {
  console.error("ERROR: RESEND_API_KEY no encontrada");
  process.exit(1);
}

const { Resend } = require('F:/Proyectos/PSICOLOGIA VERDE ARGENTINA/functions/node_modules/resend');
const resend = new Resend(resendApiKey);

const toEmail = 'verde.psicologia@gmail.com';
const bccEmail = process.argv[2] || 'alanriverossaavedra@gmail.com';

const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Manual de Gestión y Nuevas Funciones · Psicología Vegana</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0D0A; color: #E2E8F0; margin: 0; padding: 24px; }
    .card { max-width: 620px; margin: 0 auto; background-color: #141a14; border: 1px solid #232f23; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(180deg, #182319 0%, #0e130e 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #232f23; }
    .header h1 { margin: 0; color: #8EB486; font-size: 20px; font-weight: 700; letter-spacing: 1px; font-family: Georgia, serif; }
    .header p { margin: 6px 0 0; color: #A3B18A; font-size: 12px; font-family: monospace; text-transform: uppercase; }
    .content { padding: 32px 28px; line-height: 1.6; color: #CBD5E1; font-size: 14px; }
    .greeting { font-size: 18px; color: #F1F5F9; font-weight: 600; margin-bottom: 16px; font-family: Georgia, serif; }
    .section-title { color: #8EB486; font-size: 15px; font-weight: 700; margin-top: 28px; margin-bottom: 12px; border-bottom: 1px solid #232f23; padding-bottom: 6px; display: flex; items-center; gap: 8px; font-family: Georgia, serif; }
    .box { background-color: #0c110d; border: 1px solid #232f23; border-radius: 14px; padding: 18px; margin: 14px 0; }
    .box h4 { margin: 0 0 8px; color: #F1F5F9; font-size: 14px; font-weight: 600; }
    .box p { margin: 0; font-size: 13px; color: #94A3B8; line-height: 1.5; }
    .steps { margin: 10px 0 0; padding-left: 18px; color: #CBD5E1; font-size: 13px; }
    .steps li { margin-bottom: 8px; }
    .tag { display: inline-block; background-color: rgba(142, 180, 134, 0.15); color: #8EB486; border: 1px solid rgba(142, 180, 134, 0.3); padding: 2px 8px; border-radius: 999px; font-size: 10px; font-family: monospace; font-weight: bold; margin-bottom: 6px; }
    .btn { display: inline-block; background-color: #8EB486; color: #0A0D0A !important; padding: 13px 26px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 13px; text-align: center; margin: 24px 0 10px; letter-spacing: 0.5px; }
    .tip-box { background-color: #121d13; border-left: 3px solid #8EB486; padding: 14px 16px; border-radius: 0 12px 12px 0; margin-top: 24px; font-size: 12px; color: #CBD5E1; }
    .footer { padding: 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #232f23; background-color: #0c100c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>PSICOLOGÍA VERDE ARGENTINA</h1>
      <p>Manual de Administración · Panel de Control</p>
    </div>
    <div class="content">
      <div class="greeting">¡Hola Mauro!</div>
      <p>Te preparamos esta guía práctica y directa con todo lo que necesitás saber para administrar de forma ágil las nuevas herramientas de tu plataforma desde <a href="https://psicologovegano.com/admin.html" style="color: #8EB486; text-decoration: underline;" target="_blank">tu panel de control</a>.</p>

      <!-- 1. BOTONERA DIAGNÓSTICA -->
      <div class="section-title">🧭 1. Botonera Diagnóstica (Portada Principal)</div>
      <div class="box">
        <span class="tag">UBICACIÓN: PESTAÑA 📝 PUBLICACIONES</span>
        <h4>¿A dónde dirige cada botón de dolencia?</h4>
        <p>En el panel vas a encontrar la tarjeta <em>"Botonera Diagnóstica de la Portada"</em> con los 4 botones que ven tus pacientes (*Aislamiento, Sobrecarga, Culpa y Relaciones*). Podés configurar el destino de cada uno con total libertad:</p>
        <ul class="steps">
          <li><strong>⚡ Automático:</strong> La web busca sola la nota más relevante sobre esa dolencia según palabras clave.</li>
          <li><strong>📝 Artículo específico:</strong> Desplegás la lista y elegís la nota puntual que querés que lean de inmediato.</li>
          <li><strong>🎧 Recurso / Combo digital:</strong> Los lleva directo al catálogo o a adquirir una audioguía o la Trilogía.</li>
          <li><strong>💬 Sesión de Orientación:</strong> Abre WhatsApp con un mensaje preconfigurado para consultar por terapia.</li>
        </ul>
        <p style="margin-top: 10px; font-size: 12px; color: #8EB486;">👉 Solo hacés clic en <strong>"Guardar Configuración de Botonera"</strong> y el cambio se aplica al instante en la web.</p>
      </div>

      <!-- 2. GESTIÓN DE COMBOS -->
      <div class="section-title">📦 2. Packs Integrales y Combos de Recursos</div>
      <div class="box">
        <span class="tag">UBICACIÓN: PESTAÑA 🎧 AUDIOGUÍAS & TIENDA</span>
        <h4>Crear, pausar y agrupar recursos múltiples</h4>
        <ul class="steps">
          <li><strong>Crear o editar un Combo:</strong> Elegís el formato <em>"📦 Pack Integral"</em> y tildás qué recursos incluye (ej. Libro + Mapa de Transiciones + Autoestima Verde).</li>
          <li><strong>Precios diferenciados:</strong> Podés definir el valor en pesos (Mercado Pago) y en dólares (PayPal).</li>
          <li><strong>Pausar o activar vidriera:</strong> Con el interruptor <em>"🌟 Activo en Vidriera Pública"</em> podés activar o pausar promociones por tiempo limitado sin perder los contenidos cargados.</li>
          <li><strong>Desbloqueo automático:</strong> Cuando un paciente compra el combo, el sistema le habilita automáticamente el acceso a todos los recursos incluidos en su biblioteca sin que tengas que intervenir.</li>
        </ul>
      </div>

      <!-- 3. VINCULACIÓN EN ARTÍCULOS -->
      <div class="section-title">📖 3. Recomendar Productos al Final de tus Notas</div>
      <div class="box">
        <span class="tag">UBICACIÓN: AL CREAR O EDITAR ARTÍCULOS</span>
        <h4>Acompañamiento personalizado en cada lectura</h4>
        <p>Al pie de cada reflexión, podés vincular un recurso específico en el campo <strong>"Recurso Digital Recomendado"</strong> (el Pack Trilogía, una audioguía puntual, el libro o ninguno).</p>
        <p style="margin-top: 8px;">Además, la casilla de <strong>Sesión Única de Orientación</strong> mantiene siempre visible tu contacto directo de WhatsApp para quien prefiera trabajarlo en sesión 1 a 1.</p>
      </div>

      <div class="tip-box">
        💡 <strong>Recomendación práctica:</strong> Cada vez que redactes una nota nueva, seleccioná la temática que corresponda (<em>aislamiento, sobrecarga, culpa o relaciones</em>). La plataforma se encarga sola de relacionarla con las otras notas del mismo tema y con los botones de la portada.
      </div>

      <div style="text-align: center;">
        <a href="https://psicologovegano.com/admin.html" class="btn" target="_blank">INGRESAR AL PANEL DE ADMINISTRACIÓN</a>
      </div>
    </div>
    <div class="footer">
      Psicología Verde Argentina · Ecosistema Clínico & Psicoeducación Antiespecista<br>
      Este es un mensaje informativo del sistema para el Lic. Mauro García Rodríguez.
    </div>
  </div>
</body>
</html>
`;

async function run() {
  try {
    console.log(`Enviando guía a ${toEmail} con copia oculta a ${bccEmail}...`);
    const result = await resend.emails.send({
      from: 'Psicología Verde <notificaciones@psicologovegano.com>',
      to: [toEmail],
      bcc: [bccEmail],
      subject: '🌿 Manual de Gestión: Botonera Diagnóstica, Combos y Administración · Psicología Verde',
      html: htmlBody
    });
    console.log("✅ Correo enviado exitosamente:", result);
  } catch (err) {
    console.error("❌ Error enviando correo:", err);
    process.exit(1);
  }
}

run();
