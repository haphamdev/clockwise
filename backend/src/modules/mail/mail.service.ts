import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, Transporter } from "nodemailer";

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private mailFrom = "";

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>("SMTP_HOST");
    if (!host) {
      this.logger.warn("SMTP_HOST not set — emails will be logged to console");
      return;
    }

    const port = Number(this.configService.get("SMTP_PORT", 465));
    this.mailFrom = this.configService.get<string>(
      "MAIL_FROM",
      this.configService.get<string>("SMTP_USER", "noreply@example.com"),
    );

    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: this.configService.getOrThrow<string>("SMTP_USER"),
        pass: this.configService.getOrThrow<string>("SMTP_PASS"),
      },
    });

    this.logger.log(`SMTP configured: ${host}:${port}`);
  }

  async sendInvitationEmail(
    to: string,
    inviteUrl: string,
    orgName: string,
  ): Promise<void> {
    const subject = `You've been invited to join ${orgName}`;
    const html = [
      `<h2>Clockwise - You're invited to ${orgName}</h2>`,
      `<p>Click the link below to accept your invitation and sign in:</p>`,
      `<p><a href="${inviteUrl}">${inviteUrl}</a></p>`,
      `<p>This invitation expires in 7 days.</p>`,
    ].join("\n");

    if (!this.transporter) {
      this.logger.log(`[DEV] Invitation email to ${to}: ${inviteUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.mailFrom,
      to,
      subject,
      html,
    });

    this.logger.log(`Invitation email sent to ${to}`);
  }
}
