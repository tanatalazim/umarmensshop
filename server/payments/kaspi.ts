import type { PaymentProvider, CreatePaymentParams, PaymentSessionResult, WebhookProcessResult } from './provider.js';

export class KaspiPaymentAdapter implements PaymentProvider {
  readonly providerId = 'kaspi_pay_production';
  readonly isSandbox = false;

  private merchantId: string | undefined;
  private apiSecret: string | undefined;

  constructor() {
    this.merchantId = process.env.KASPI_PAY_MERCHANT_ID;
    this.apiSecret = process.env.KASPI_API_SECRET;
  }

  isConfigured(): boolean {
    return Boolean(this.merchantId && this.apiSecret);
  }

  async createPaymentSession(params: CreatePaymentParams): Promise<PaymentSessionResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Kaspi Pay production credentials (KASPI_PAY_MERCHANT_ID, KASPI_API_SECRET) are not configured. ' +
        'In development mode, please use the SandboxPaymentProvider.'
      );
    }

    // In actual production, this initiates mutual TLS HTTP POST to official Kaspi Payment Gateway
    throw new Error('Production Kaspi API requires verified merchant credentials and TLS certificate.');
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string | string[] | undefined>): boolean {
    if (!this.isConfigured()) return false;
    // Real signature check using HMAC or Kaspi public certificate
    return false;
  }

  async processWebhookEvent(payload: any): Promise<WebhookProcessResult> {
    if (!this.isConfigured()) {
      return { handled: false, message: 'Kaspi Pay adapter is unconfigured.' };
    }
    throw new Error('Production webhook processor requires official merchant keys.');
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string; amount: number }> {
    if (!this.isConfigured()) {
      throw new Error('Kaspi Pay is not configured.');
    }
    throw new Error('Production status inquiry requires official merchant keys.');
  }
}
