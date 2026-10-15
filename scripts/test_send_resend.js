const { Resend } = require('../functions/node_modules/resend');

require('dotenv').config({ path: '../functions/.env' });
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('RESEND_API_KEY no encontrada en entorno');
  process.exit(1);
}
const resend = new Resend(resendApiKey);

async function run() {
  console.log('Enviando emails de prueba...');

  // 1. Email a Alan
  try {
    const resAlan = await resend.emails.send({
      from: 'Psicología Verde <notificaciones@psicologovegano.com>',
      to: ['alanriverossaavedra@gmail.com'],
      subject: '🌿 [Test de Verificación] Dominio psicologovegano.com configurado con éxito',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2e7d32;">🌿 Verificación de Envíos - Psicología Verde</h2>
          <p>Hola Alan,</p>
          <p>Este es un correo de prueba emitido directamente desde el dominio autenticado <strong>psicologovegano.com</strong> a través de Resend.</p>
          <div style="background-color: #f1f8e9; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0; color: #33691e;"><strong>Estado de infraestructura:</strong></p>
            <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #1b5e20;">
              <li>DKIM: Verificado ✓</li>
              <li>SPF: Verificado ✓</li>
              <li>DMARC: Verificado ✓</li>
              <li>Remitente: notificaciones@psicologovegano.com ✓</li>
            </ul>
          </div>
          <p>Si recibís este correo en tu bandeja principal (Inbox), el sistema transaccional de la tienda está listo para despachar confirmaciones a los pacientes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Mensaje automático de prueba técnica.</p>
        </div>
      `
    });
    console.log('Email a Alan enviado con éxito:', resAlan);
  } catch (err) {
    console.error('Error enviando a Alan:', err);
  }

  // 2. Email a Mauro
  try {
    const resMauro = await resend.emails.send({
      from: 'Psicología Verde <notificaciones@psicologovegano.com>',
      to: ['verde.psicologia@gmail.com'],
      subject: '🌿 Prueba técnica: Tu dominio psicologovegano.com ya envía correos oficiales',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2e7d32;">🌿 Hola Mauro, ¡buenas noticias!</h2>
          <p>Te enviamos este mensaje para comprobar que la configuración de tu dominio propio <strong>psicologovegano.com</strong> ya está 100% activa y operativa.</p>
          
          <div style="background-color: #f9fbf9; padding: 15px; border-left: 4px solid #2e7d32; margin: 18px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.5;">
              <strong>¿Para qué sirve esto?</strong><br>
              A partir de ahora, cada vez que un paciente o alumno adquiera un recurso en tu tienda (como el <em>Mapa de Transiciones</em> o la guía terapéutica), recibirá sus accesos con un correo profesional emitido desde <code>notificaciones@psicologovegano.com</code>, llegando directamente a su bandeja de entrada sin caer en correo no deseado.
            </p>
          </div>

          <p style="color: #555; font-size: 14px;">
            Este es un correo de prueba del circuito técnico mientras ultimamos los detalles finales de la plataforma.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
          <p style="font-size: 12px; color: #777; margin: 0;">
            Psicología Verde — Lic. Mauro García<br>
            <a href="https://psicologovegano.com" style="color: #2e7d32; text-decoration: none;">psicologovegano.com</a>
          </p>
        </div>
      `
    });
    console.log('Email a Mauro enviado con éxito:', resMauro);
  } catch (err) {
    console.error('Error enviando a Mauro:', err);
  }
}

run();
