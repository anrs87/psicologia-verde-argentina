const { Resend } = require('../functions/node_modules/resend');

require('dotenv').config({ path: '../functions/.env' });
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('RESEND_API_KEY no encontrada en entorno');
  process.exit(1);
}
const resend = new Resend(resendApiKey);

async function sendPreviewEmail() {
  console.log('Enviando enlaces del entorno de prueba a Mauro y Alan...');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 25px 20px; color: #222; background-color: #ffffff; line-height: 1.6;">
      
      <!-- Encabezado -->
      <div style="border-bottom: 2px solid #8EB486; padding-bottom: 15px; margin-bottom: 25px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #52734D; font-weight: bold;">Psicólogo Vegano — Entorno de Desarrollo y Pruebas</span>
        <h1 style="color: #1F2D20; font-size: 24px; margin: 8px 0 0 0; font-family: Georgia, serif;">🌿 Enlaces de tu Entorno de Pruebas (Staging)</h1>
      </div>

      <p style="font-size: 15px; color: #333;">Hola <strong>Mauro</strong>,</p>
      
      <p style="font-size: 15px; color: #444;">
        Para complementar el mensaje anterior y que puedas probar todo con total tranquilidad, te compartimos los <strong>enlaces directos del entorno de prueba aislado</strong> en el que estamos trabajando.
      </p>

      <!-- Banner aclaratorio de Entorno de Pruebas -->
      <div style="background-color: #FFF9E6; border: 1px solid #FFE082; border-left: 5px solid #FFA000; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #8D6E63;">⚠️ Importante: Tu web oficial no fue modificada</h4>
        <p style="margin: 0; font-size: 13px; color: #5D4037; line-height: 1.5;">
          Tu página actual en vivo (<code>psicologovegano.com</code>) <strong>sigue funcionando intacta</strong> sin ningún cambio visible. Todo esto nuevo está alojado en un entorno de desarrollo privado para que vos y Alan puedan navegar, simular compras, editar productos y probar cada función. <strong>Recién cuando vos lo revises y nos des el visto bueno definitivo, lo pasaremos a producción.</strong>
        </p>
      </div>

      <!-- Links del entorno de prueba -->
      <div style="background-color: #F4F7F4; border: 1px solid #D8E2D7; border-radius: 10px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #1F2D20;">🔗 Direcciones del Entorno de Prueba:</h3>
        
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; font-size: 13px; color: #666; font-weight: 600;">1. TIENDA Y LANDING DE PRUEBA:</p>
          <a href="https://psicologiaveganaarg--preview-q8uszfm7.web.app" style="color: #2E7D32; font-weight: bold; font-size: 15px; text-decoration: underline;">
            https://psicologiaveganaarg--preview-q8uszfm7.web.app
          </a>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #777;">Acá podés ver el embudo con las portadas de los artículos y los recursos para comprar.</p>
        </div>

        <div style="margin-bottom: 15px;">
          <p style="margin: 0; font-size: 13px; color: #666; font-weight: 600;">2. PANEL DE ADMINISTRACIÓN DE PRUEBA:</p>
          <a href="https://psicologiaveganaarg--preview-q8uszfm7.web.app/admin" style="color: #2E7D32; font-weight: bold; font-size: 15px; text-decoration: underline;">
            https://psicologiaveganaarg--preview-q8uszfm7.web.app/admin
          </a>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #777;">Acá podés cambiar precios en la pestaña <em>"Audioguías & Tienda"</em>, probar crear cupones y ver el botón de Mercado Pago.</p>
        </div>

        <div>
          <p style="margin: 0; font-size: 13px; color: #666; font-weight: 600;">3. BIBLIOTECA DEL PACIENTE (PORTAL DE PRUEBA):</p>
          <a href="https://psicologiaveganaarg--preview-q8uszfm7.web.app/portal" style="color: #2E7D32; font-weight: bold; font-size: 15px; text-decoration: underline;">
            https://psicologiaveganaarg--preview-q8uszfm7.web.app/portal
          </a>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #777;">Acá es donde el paciente accede a escuchar los audios (incluso en modo sin conexión) y leer los cuadernillos.</p>
        </div>
      </div>

      <h3 style="font-size: 16px; color: #1F2D20; margin-top: 25px;">¿Qué te recomendamos probar?</h3>
      <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #444;">
        <li style="margin-bottom: 6px;">Entrar a <strong>/admin</strong> y modificar un precio para ver qué tan sencillo e intuitivo resulta.</li>
        <li style="margin-bottom: 6px;">Ver el botón de conexión de Mercado Pago en la nueva pestaña <strong>"Mercado Pago"</strong>.</li>
        <li>Entrar a <strong>/portal</strong> para ver el reproductor de audio terapéutico y cómo se visualizan las guías.</li>
      </ul>

      <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 30px 0 20px 0;">

      <p style="font-size: 14px; color: #555; margin-bottom: 5px;">
        Cualquier ajuste que quieras hacerle a los textos, diseño o funciones, lo vamos puliendo juntos antes del lanzamiento oficial.
      </p>
      
      <p style="font-size: 14px; color: #2E7D32; font-weight: bold; margin-top: 15px;">
        Un abrazo,<br>
        Alan & Equipo de Psicología Verde
      </p>

    </div>
  `;

  try {
    const res = await resend.emails.send({
      from: 'Psicología Verde <notificaciones@psicologovegano.com>',
      to: ['verde.psicologia@gmail.com'],
      cc: ['alanriverossaavedra@gmail.com'],
      subject: '🌿 Enlaces de tu Entorno de Pruebas: Navegá y probá el nuevo ecosistema',
      html: htmlContent
    });

    console.log('Correo con enlaces de prueba enviado exitosamente a Mauro y Alan:', res);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

sendPreviewEmail();
