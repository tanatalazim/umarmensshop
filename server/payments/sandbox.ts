import crypto from 'node:crypto';
import type { PaymentProvider, CreatePaymentParams, PaymentSessionResult, WebhookProcessResult } from './provider.js';
import { db } from '../db.js';

export class SandboxPaymentProvider implements PaymentProvider {
  readonly providerId = 'sandbox_kaspi';
  readonly isSandbox = true;

  async createPaymentSession(params: CreatePaymentParams): Promise<PaymentSessionResult> {
    const paymentId = `pay_sbx_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Demo Kaspi QR payload standard for local development testing
    const qrPayload = `https://kaspi.kz/pay/demo?order=${params.orderNumber}&amount=${params.amount}&id=${paymentId}`;

    // Store in payments table
    db.prepare(`
      INSERT INTO payments (id, order_id, provider, provider_payment_id, amount, currency, status, qr_payload, payment_url, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(paymentId, params.orderId, this.providerId, paymentId, params.amount, params.currency, qrPayload, qrPayload, expiresAt);

    return {
      paymentId,
      provider: this.providerId,
      amount: params.amount,
      currency: params.currency,
      qrPayload,
      paymentUrl: qrPayload,
      isSandbox: true,
      expiresAt,
      status: 'pending'
    };
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string | string[] | undefined>): boolean {
    // In sandbox development, we verify presence of test signature token
    const testSig = headers['x-sandbox-signature'];
    return Boolean(testSig && testSig === 'sandbox_secret_signature');
  }

  async processWebhookEvent(payload: any): Promise<WebhookProcessResult> {
    const { paymentId, idempotencyKey, status } = payload;
    if (!paymentId || !idempotencyKey) {
      return { handled: false, message: 'Invalid payload: missing paymentId or idempotencyKey' };
    }

    // Check idempotency in payment_events table
    const existing = db.prepare(`SELECT id FROM payment_events WHERE idempotency_key = ?`).get(idempotencyKey);
    if (existing) {
      return { handled: true, message: 'Event already processed (idempotent skip)' };
    }

    // Record event
    db.prepare(`
      INSERT INTO payment_events (id, payment_id, event_type, idempotency_key, raw_payload)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), paymentId, status || 'payment_succeeded', idempotencyKey, JSON.stringify(payload));

    const payment = db.prepare(`SELECT order_id, amount FROM payments WHERE id = ?`).get(paymentId) as any;
    if (!payment) {
      return { handled: false, message: `Payment not found: ${paymentId}` };
    }

    if (status === 'succeeded' || status === 'SUCCESS') {
      db.prepare(`UPDATE payments SET status = 'succeeded' WHERE id = ?`).run(paymentId);
      db.prepare(`UPDATE orders SET status = 'paid', payment_status = 'succeeded', updated_at = datetime('now') WHERE id = ?`).run(payment.order_id);

      // Decrement warehouse physical stock and clear reservation
      const orderItems = db.prepare(`SELECT variant_id, quantity FROM order_items WHERE order_id = ?`).all(payment.order_id) as any[];
      for (const item of orderItems) {
        db.prepare(`
          UPDATE inventory 
          SET quantity = quantity - ?, reserved_quantity = MAX(0, reserved_quantity - ?)
          WHERE variant_id = ?
        `).run(item.quantity, item.quantity, item.variant_id);

        db.prepare(`
          INSERT INTO inventory_movements (id, variant_id, warehouse_id, change_amount, movement_type, reference_order_id, reason)
          VALUES (?, ?, 'wh_almaty_main', ?, 'sale', ?, 'Оплата заказа (Kaspi Sandbox)')
        `).run(crypto.randomUUID(), item.variant_id, -item.quantity, payment.order_id);
      }

      return {
        handled: true,
        orderId: payment.order_id,
        newPaymentStatus: 'succeeded',
        message: 'Sandbox payment successfully verified and processed.'
      };
    }

    return { handled: true, message: `Status ${status} recorded` };
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string; amount: number }> {
    const row = db.prepare(`SELECT status, amount FROM payments WHERE id = ?`).get(paymentId) as any;
    if (!row) throw new Error(`Payment ${paymentId} not found`);
    return { status: row.status, amount: row.amount };
  }
}
