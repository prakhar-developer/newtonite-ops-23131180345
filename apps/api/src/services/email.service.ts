import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../shared/logger';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private resendClient: Resend | null = null;
  private etherealTransporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim() !== '') {
      this.resendClient = new Resend(env.RESEND_API_KEY);
      logger.info('[EmailService] Configured with production Resend API');
    } else {
      logger.info('[EmailService] RESEND_API_KEY not set. Using Nodemailer Ethereal simulation fallback');
    }
  }

  private async getEtherealTransporter(): Promise<nodemailer.Transporter> {
    if (this.etherealTransporter) {
      return this.etherealTransporter;
    }
    const testAccount = await nodemailer.createTestAccount();
    this.etherealTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return this.etherealTransporter;
  }

  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; previewUrl?: string; messageId?: string }> {
    // 1. Try real Resend if API key is supplied
    if (this.resendClient) {
      try {
        const { data, error } = await this.resendClient.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        });

        if (error) {
          logger.warn(`[EmailService] Resend API rejected message (${error.message}). Triggering Ethereal preview fallback.`);
        } else if (data?.id) {
          logger.info(`[EmailService] Real email dispatched via Resend to ${params.to} (id: ${data.id})`);
          return { success: true, messageId: data.id };
        }
      } catch (err) {
        logger.warn(`[EmailService] Resend request exception: ${(err as Error).message}. Triggering Ethereal preview fallback.`);
      }
    }

    // 2. Fallback to Nodemailer Ethereal simulation (Zero external dependency needed)
    try {
      const transporter = await this.getEtherealTransporter();
      const info = await transporter.sendMail({
        from: env.RESEND_FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      logger.info(`[EmailService] Email generated via Ethereal for ${params.to}. Preview URL: ${previewUrl}`);
      return { success: true, previewUrl, messageId: info.messageId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[EmailService] All email delivery options failed for ${params.to}: ${msg}`);
      return { success: false };
    }
  }

  private getTrackingUrl(trackingToken: string): string {
    const baseUrl = (env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    return `${baseUrl}/portal/track/${trackingToken}`;
  }

  async sendTicketCreatedNotification(ticket: { id: string; ticketNumber: number; title: string; trackingToken: string }, customer: { name: string; email: string }) {
    const trackingUrl = this.getTrackingUrl(ticket.trackingToken);
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0;">Support Request Received (#${ticket.ticketNumber})</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">instOS Operational Support Hub</p>
        </div>
        <p style="color: #334155; line-height: 1.6;">Hello <strong>${customer.name}</strong>,</p>
        <p style="color: #334155; line-height: 1.6;">Your support request has been logged successfully and routed to our operational dispatch team:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #0f172a; font-weight: 600;">${ticket.title}</p>
          <p style="margin: 0; color: #64748b; font-size: 13px;">Ticket ID: <span style="font-family: monospace; color: #4f46e5;">#${ticket.ticketNumber}</span></p>
        </div>
        <p style="color: #334155; line-height: 1.6;">You can track real-time progress, reply to agents, and review SLA resolution status using your private tracking link:</p>
        <div style="margin: 24px 0;">
          <a href="${trackingUrl}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Track Request Status</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px;">Direct link: ${trackingUrl}</p>
      </div>
    `;

    return this.sendEmail({
      to: customer.email,
      subject: `[#${ticket.ticketNumber}] We received your support request: ${ticket.title}`,
      html,
    });
  }

  async sendTicketStatusUpdate(ticket: { ticketNumber: number; title: string; trackingToken: string; status: string }, customer: { name: string; email: string }, note?: string) {
    const trackingUrl = this.getTrackingUrl(ticket.trackingToken);
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0f172a; margin: 0 0 8px 0;">Status Update: #${ticket.ticketNumber}</h2>
        <p style="color: #334155; line-height: 1.6;">Hello <strong>${customer.name}</strong>,</p>
        <p style="color: #334155; line-height: 1.6;">Your ticket status has progressed to: <strong style="color: #4f46e5;">${ticket.status}</strong></p>
        ${note ? `<div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 16px 0; color: #334155;">${note}</div>` : ''}
        <div style="margin: 24px 0;">
          <a href="${trackingUrl}" style="background: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">View in Customer Portal</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px;">Direct link: ${trackingUrl}</p>
      </div>
    `;

    return this.sendEmail({
      to: customer.email,
      subject: `[#${ticket.ticketNumber}] Ticket Status Updated to ${ticket.status}`,
      html,
    });
  }
}

export const emailService = new EmailService();
