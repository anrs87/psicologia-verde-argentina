const { Resend } = require('../functions/node_modules/resend');

require('dotenv').config({ path: '../functions/.env' });
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('RESEND_API_KEY no encontrada en entorno');
  process.exit(1);
}
const resend = new Resend(resendApiKey);

async function sendGuide() {
  console.log('Enviando guía del ecosistema a Mauro (con copia a Alan)...');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 25px 20px; color: #222; background-color: #ffffff; line-height: 1.6;">
      
      <!-- Encabezado con estética verde -->
      <div style="border-bottom: 2px solid #8EB486; padding-bottom: 15px; margin-bottom: 25px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #52734D; font-weight: bold;">Psicólogo Vegano — Ecosistema Digital</span>
        <h1 style="color: #1F2D20; font-size: 24px; margin: 8px 0 0 0; font-family: Georgia, serif;">🌿 Guía práctica de tu Panel y Tienda Terapéutica</h1>
      </div>

      <p style="font-size: 15px; color: #333;">Hola <strong>Mauro</strong>, ¿cómo estás?</p>
      
      <p style="font-size: 15px; color: #444;">
        Te comparto esta guía rápida y práctica para que conozcas cómo funciona tu nuevo ecosistema digital y cómo podés gestionar todo tu contenido, productos y cobros desde un único lugar sin depender de intermediarios.
      </p>

      <!-- Enlaces directos -->
      <div style="background-color: #F4F7F4; border: 1px solid #D8E2D7; border-radius: 10px; padding: 18px 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1F2D20;">🧭 Enlaces de acceso directo:</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #333;">
          <li style="margin-bottom: 6px;"><strong>Sitio web principal:</strong> <a href="https://psicologovegano.com" style="color: #2E7D32; font-weight: 600; text-decoration: none;">psicologovegano.com</a></li>
          <li style="margin-bottom: 6px;"><strong>Tu Panel de Administración privado:</strong> <a href="https://psicologovegano.com/admin" style="color: #2E7D32; font-weight: 600; text-decoration: none;">psicologovegano.com/admin</a></li>
          <li><strong>La Biblioteca Terapéutica (Portal de Pacientes):</strong> <a href="https://psicologovegano.com/portal" style="color: #2E7D32; font-weight: 600; text-decoration: none;">psicologovegano.com/portal</a></li>
        </ul>
      </div>

      <h2 style="font-size: 18px; color: #1F2D20; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 30px;">
        🛠️ ¿Qué podés hacer desde tu Panel de Administración (/admin)?
      </h2>

      <!-- Módulo 1 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; color: #2E7D32; margin-bottom: 6px;">1. 🎧 Audioguías & Tienda (Gestión de Recursos y Precios)</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #444;">
          <li style="margin-bottom: 4px;"><strong>¿Dónde cambiás los precios?:</strong> Dentro de esta pestaña hacés clic en <em>"Editar"</em> sobre cualquier producto (ej: <em>Mapa de Transiciones</em>), modificás el valor en el campo <strong>Precio (ARS)</strong> y le das a Guardar. El cambio impacta de inmediato en la tienda y en la pasarela de pago.</li>
          <li style="margin-bottom: 4px;"><strong>Carga de contenidos:</strong> Podés sumar nuevos recursos, subir pistas de audio, audiolibros o cuadernillos PDF descargables.</li>
          <li><strong>Vista Previa:</strong> Cuenta con un simulador para que veas y escuches cómo recibirá el material el paciente antes de dejarlo público.</li>
        </ul>
      </div>

      <!-- Módulo 2 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; color: #2E7D32; margin-bottom: 6px;">2. 💳 Mercado Pago (Vinculación en 1 Clic)</h3>
        <p style="font-size: 14px; color: #444; margin: 4px 0 8px 0;">
          Para simplificarte todo, dejamos listo un botón automático:
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #444;">
          <li style="margin-bottom: 4px;">En la pestaña <strong>"Mercado Pago"</strong> vas a ver un botón que dice <strong>"Conectar con Mercado Pago"</strong>.</li>
          <li style="margin-bottom: 4px;">Al hacer clic, te abre Mercado Pago para que inicies sesión y presiones <strong>"Autorizar"</strong>.</li>
          <li>No tenés que copiar claves raras ni entrar a paneles de desarrolladores. Una vez vinculado, todas las ventas se acreditan directo en tu cuenta bancaria o saldo en cuenta.</li>
        </ul>
      </div>

      <!-- Módulo 3 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; color: #2E7D32; margin-bottom: 6px;">3. 🏷️ Cupones de Descuento</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #444;">
          <li style="margin-bottom: 4px;">Podés crear códigos promocionales a medida (por ejemplo: <code>PACIENTE20</code> con 20% de descuento).</li>
          <li>Podés definir si es un porcentaje o un monto fijo, y ponerle fecha límite o cantidad máxima de usos. Se valida solo al momento del pago.</li>
        </ul>
      </div>

      <!-- Módulo 4 y 5 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; color: #2E7D32; margin-bottom: 6px;">4. 📝 Blog & 📊 Métricas</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #444;">
          <li style="margin-bottom: 4px;"><strong>Notas & Artículos:</strong> Redactar, enriquecer y publicar reflexiones con portadas cuidadas para que compartas en tus redes.</li>
          <li><strong>Métricas de Visitas:</strong> Panel analítico para saber cuántas personas ingresan a tu web y qué notas leen más.</li>
        </ul>
      </div>

      <!-- Novedad PayPal -->
      <div style="background-color: #EBF3FA; border-left: 4px solid #0070BA; padding: 15px 18px; border-radius: 6px; margin: 25px 0;">
        <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #003087;">🌎 Próximo paso: Cobros Internacionales con PayPal</h4>
        <p style="margin: 0; font-size: 13px; color: #224466; line-height: 1.5;">
          También te contamos que ya estamos gestionando la integración de <strong>PayPal</strong> para que personas de otros países puedan comprar tus audioguías en dólares de forma transparente. En estos días lo dejaremos listo y quizás solo te pidamos una mínima autorización similar a la de Mercado Pago para conectarlo a tu cuenta.
        </p>
      </div>

      <!-- Experiencia del Paciente -->
      <h2 style="font-size: 18px; color: #1F2D20; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 30px;">
        🌿 ¿Cómo es la experiencia para el paciente que compra?
      </h2>
      <ol style="margin: 12px 0; padding-left: 20px; font-size: 14px; color: #444; line-height: 1.6;">
        <li style="margin-bottom: 6px;">El paciente elige el recurso en tu web y paga con Mercado Pago.</li>
        <li style="margin-bottom: 6px;">Recibe al instante un correo oficial de bienvenida desde <code>notificaciones@psicologovegano.com</code> con el botón de acceso.</li>
        <li style="margin-bottom: 6px;">Accede a su biblioteca personal en <strong>/portal</strong>, donde puede escuchar los audios (¡incluso cuenta con <strong>modo offline</strong> para escuchar sin internet cuando viaja!) y ver los PDFs clínicos.</li>
        <li>Al mismo tiempo, <strong>a vos te llega un correo automático</strong> avisándote que ingresó una venta con el nombre del paciente, el producto y el monto cobrado.</li>
      </ol>

      <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 30px 0 20px 0;">

      <p style="font-size: 14px; color: #555; margin-bottom: 5px;">
        Quedamos atentos a cualquier duda o consulta que tengas mientras vas recorriendo el panel.
      </p>
      
      <p style="font-size: 14px; color: #2E7D32; font-weight: bold; margin-top: 15px;">
        Un abrazo,<br>
        Equipo de Psicología Verde & Alan
      </p>

    </div>
  `;

  try {
    const res = await resend.emails.send({
      from: 'Psicología Verde <notificaciones@psicologovegano.com>',
      to: ['verde.psicologia@gmail.com'],
      cc: ['alanriverossaavedra@gmail.com'],
      subject: '🌿 Tu nuevo ecosistema digital: Guía práctica del Panel de Administración y Tienda Terapéutica',
      html: htmlContent
    });

    console.log('Correo enviado exitosamente a Mauro y Alan:', res);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

sendGuide();
