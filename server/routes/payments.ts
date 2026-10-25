import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { SandboxPaymentProvider } from '../payments/sandbox.js';
import { logAudit } from '../auth.js';

export const paymentsRouter = Router();
const sandboxProvider = new SandboxPaymentProvider();

// 1. Webhook endpoint (Receives payment status from provider)
paymentsRouter.post('/webhook', async (req, res) => {
  const { paymentId, idempotencyKey, status } = req.body;

  if (!paymentId || !idempotencyKey) {
    return res.status(400).json({ error: 'INVALID_WEBHOOK_PAYLOAD', message: 'Missing paymentId or idempotencyKey' });
  }

  try {
    const result = await sandboxProvider.processWebhookEvent({
      paymentId,
      idempotencyKey,
      status: status || 'succeeded'
    });

    logAudit(null, 'PAYMENT_WEBHOOK_PROCESSED', 'PAYMENT', paymentId, {
      handled: result.handled,
      status
    }, req.ip);

    res.json(result);
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'WEBHOOK_FAILED', message: error.message });
  }
});

// 2. Dev-only simulated payment confirmation (e.g. customer clicking "Оплатить в Kaspi.kz" in sandbox dialog)
paymentsRouter.post('/sandbox/simulate-payment', async (req, res) => {
  const { paymentId } = req.body;
  if (!paymentId) {
    return res.status(400).json({ error: 'MISSING_PAYMENT_ID' });
  }

  let payment = db.prepare(`SELECT * FROM payments WHERE id = ?`).get(paymentId) as any;
  if (!payment) {
    payment = db.prepare(`SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`).get(paymentId) as any;
  }
  if (!payment) {
    return res.status(404).json({ error: 'PAYMENT_NOT_FOUND', message: 'Платёж не найден' });
  }

  const actualPaymentId = payment.id;
  const idempotencyKey = `sim_${actualPaymentId}_${Date.now()}`;
  const result = await sandboxProvider.processWebhookEvent({
    paymentId: actualPaymentId,
    idempotencyKey,
    status: 'succeeded'
  });

  res.json({
    success: true,
    message: 'Тестовый платёж Kaspi успешно сымитирован и подтверждён на сервере',
    result
  });
});

// 3. Status Check
paymentsRouter.get('/:id/status', async (req, res) => {
  const { id } = req.params;
  const payment = db.prepare(`SELECT status, amount, currency, order_id FROM payments WHERE id = ?`).get(id) as any;
  if (!payment) {
    return res.status(404).json({ error: 'PAYMENT_NOT_FOUND' });
  }
  const order = db.prepare(`SELECT status, payment_status, order_number FROM orders WHERE id = ?`).get(payment.order_id) as any;

  res.json({
    paymentStatus: payment.status,
    orderStatus: order?.status,
    orderNumber: order?.order_number
  });
});
