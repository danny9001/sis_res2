import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendReservationApproved(to: string, reservationDetails: any): Promise<void> {
    const subject = 'Reserva Aprobada';
    const html = `
      <h1>Reserva Aprobada</h1>
      <p>Su reserva ha sido aprobada exitosamente.</p>
      <p><strong>Detalles:</strong></p>
      <ul>
        <li>Evento: ${reservationDetails.eventName}</li>
        <li>Sector: ${reservationDetails.sectorName}</li>
        <li>Fecha: ${reservationDetails.eventDate}</li>
      </ul>
    `;
    await this.sendEmail({ to, subject, html });
  }

  async sendReservationRejected(to: string, reservationDetails: any): Promise<void> {
    const subject = 'Reserva Rechazada';
    const html = `
      <h1>Reserva Rechazada</h1>
      <p>Lamentamos informarle que su reserva ha sido rechazada.</p>
      <p><strong>Motivo:</strong> ${reservationDetails.reason || 'No especificado'}</p>
    `;
    await this.sendEmail({ to, subject, html });
  }

  async sendAdditionalPassNotification(to: string, passDetails: any): Promise<void> {
    const subject = 'Nuevo Pase Adicional';
    const html = `
      <h1>Pase Adicional Creado</h1>
      <p>Se ha creado un nuevo pase adicional.</p>
      <p><strong>Detalles:</strong></p>
      <ul>
        <li>Nombre: ${passDetails.guestName}</li>
        <li>Motivo: ${passDetails.reason}</li>
      </ul>
    `;
    await this.sendEmail({ to, subject, html });
  }

  async sendAdditionalPassQR(to: string, data: any): Promise<void> {
    const subject = 'Código QR - Pase Adicional';
    const html = `
      <h1>Código QR para Pase Adicional</h1>
      <p>Se ha generado un pase adicional para la reserva.</p>
      <p><strong>Detalles:</strong></p>
      <ul>
        <li>Evento: ${data.reservation?.event?.name || 'N/A'}</li>
        <li>Sector: ${data.reservation?.sector?.name || 'N/A'}</li>
        <li>Invitado: ${data.pass?.guestName || 'N/A'}</li>
      </ul>
      <p>Código QR: ${data.qrCode}</p>
    `;
    await this.sendEmail({ to, subject, html });
  }
}

export const emailService = new EmailService();
