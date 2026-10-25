export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerPhone: string;
  customerName: string;
}

export interface PaymentSessionResult {
  paymentId: string;
  provider: string;
  amount: number;
  currency: string;
  qrPayload?: string;
  paymentUrl?: string;
  isSandbox: boolean;
  expiresAt: string;
  status: 'pending' | 'succeeded' | 'failed';
}

export interface WebhookProcessResult {
  handled: boolean;
  orderId?: string;
  newPaymentStatus?: 'succeeded' | 'failed' | 'cancelled';
  message: string;
}

export interface PaymentProvider {
  readonly providerId: string;
  readonly isSandbox: boolean;

  createPaymentSession(params: CreatePaymentParams): Promise<PaymentSessionResult>;
  verifyWebhookSignature(rawBody: string, headers: Record<string, string | string[] | undefined>): boolean;
  processWebhookEvent(payload: any): Promise<WebhookProcessResult>;
  checkPaymentStatus(paymentId: string): Promise<{ status: string; amount: number }>;
}
