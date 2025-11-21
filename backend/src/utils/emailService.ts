import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { env } from './env';
import logger from './logger';
import { ReservationDetailsForEmail, GuestWithQR } from '../types';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass
  }
});

export const sendReservationQRs = async (
  relatorEmail: string,
  relatorName: string,
  guests: GuestWithQR[],
  eventName: string,
  eventDate: string
) => {
  const qrImages = await Promise.all(
    guests.map(async (guest) => {
      const qrDataUrl = await QRCode.toDataURL(guest.qrCode);
      return {
        name: guest.name,
        qrDataUrl
      };
    })
  );

  const guestsHtml = qrImages
    .map(
      (guest) => `
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0;">${guest.name}</h3>
        <img src="${guest.qrDataUrl}" alt="QR ${guest.name}" style="width: 200px; height: 200px;" />
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .terms { font-size: 12px; color: #666; margin-top: 20px; padding: 15px; background: #fff; border-radius: 8px; }
        .terms h4 { color: #dc2626; margin-top: 0; }
        .terms ul { margin: 10px 0; padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Reserva Confirmada</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${relatorName}</strong>,</p>
          <p>Tu reserva ha sido <strong>APROBADA</strong> exitosamente.</p>
          
          <h3>Detalles del Evento:</h3>
          <ul>
            <li><strong>Evento:</strong> ${eventName}</li>
            <li><strong>Fecha:</strong> ${eventDate}</li>
            <li><strong>Invitados:</strong> ${guests.length}</li>
          </ul>

          <div class="warning">
            <strong>⚠️ IMPORTANTE:</strong> Presenta estos códigos QR en la entrada del evento.
            Cada invitado debe mostrar su QR correspondiente.
          </div>

          <h3>Códigos QR de tus Invitados:</h3>
          ${guestsHtml}

          <div class="terms">
            <h4>📋 Términos y Condiciones:</h4>
            <ul>
              <li><strong>Edad Mínima:</strong> Solo mayores de 18 años</li>
              <li><strong>Identificación:</strong> Carnet de Identidad físico y original obligatorio</li>
              <li><strong>Validez:</strong> Reserva válida hasta las 23:00 hrs</li>
              <li><strong>Sectores VIP:</strong> Requieren lista de invitados preautorizada</li>
              <li><strong>Política:</strong> Sin devoluciones ni reprogramaciones</li>
              <li><strong>Cover:</strong> Ingreso después de las 23:00 hrs requiere pago de cover</li>
            </ul>
            <p><em>Al confirmar esta reserva, aceptas todos los términos y condiciones.</em></p>
          </div>

          <p style="margin-top: 30px; text-align: center; color: #666;">
            ¡Te esperamos en el evento! 🎊
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: env.emailFrom,
      to: relatorEmail,
      subject: `✅ Reserva Confirmada - ${eventName}`,
      html
    });
    logger.info(`Email de confirmación enviado a ${relatorEmail}`);
  } catch (error) {
    logger.error('Error enviando email de confirmación de reserva:', {
      error,
      relatorEmail,
      eventName
    });
    throw new Error(`Error enviando email de confirmación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

export const sendApprovalRequest = async (
  approverEmail: string,
  approverName: string,
  reservationDetails: ReservationDetailsForEmail
) => {
  const html = `
    <h1>Nueva Solicitud de Aprobación</h1>
    <p>Hola ${approverName},</p>
    <p>Tienes una nueva solicitud de reserva pendiente de aprobación.</p>
    <h3>Detalles:</h3>
    <ul>
      <li><strong>Evento:</strong> ${reservationDetails.eventName}</li>
      <li><strong>Sector:</strong> ${reservationDetails.sectorName}</li>
      <li><strong>Relacionador:</strong> ${reservationDetails.relatorName}</li>
      <li><strong>Mesa:</strong> ${reservationDetails.tableType}</li>
    </ul>
    <p>Ingresa al sistema para revisar y aprobar esta solicitud.</p>
  `;

  try {
    await transporter.sendMail({
      from: env.emailFrom,
      to: approverEmail,
      subject: '🔔 Nueva Solicitud de Aprobación de Reserva',
      html
    });
    logger.info(`Email de solicitud de aprobación enviado a ${approverEmail}`);
  } catch (error) {
    logger.error('Error enviando email de solicitud de aprobación:', {
      error,
      approverEmail,
      reservationDetails
    });
    throw new Error(`Error enviando email de aprobación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};
