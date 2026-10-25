import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const accountRouter = Router();
accountRouter.use(requireAuth);

// 1. Get current customer profile
accountRouter.get('/profile', (req, res) => {
  const customer = db.prepare(`SELECT * FROM customers WHERE user_id = ?`).get(req.user!.id) as any;
  if (!customer) {
    return res.status(404).json({ error: 'CUSTOMER_RECORD_NOT_FOUND' });
  }

  const addresses = db.prepare(`SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC`).all(customer.id);

  res.json({
    user: req.user,
    customer,
    addresses
  });
});

// 2. Update customer profile
accountRouter.put('/profile', (req, res) => {
  const { fullName, phone } = req.body;
  if (!fullName || !phone) {
    return res.status(400).json({ error: 'MISSING_FIELDS' });
  }

  db.prepare(`UPDATE users SET full_name = ?, phone = ?, updated_at = datetime('now') WHERE id = ?`).run(fullName.trim(), phone.trim(), req.user!.id);
  db.prepare(`UPDATE customers SET full_name = ?, phone = ? WHERE user_id = ?`).run(fullName.trim(), phone.trim(), req.user!.id);

  res.json({ success: true, message: 'Данные профиля обновлены' });
});

// 3. Get customer's OWN orders only
accountRouter.get('/orders', (req, res) => {
  const customer = db.prepare(`SELECT id FROM customers WHERE user_id = ?`).get(req.user!.id) as any;
  if (!customer) {
    return res.json({ orders: [] });
  }

  const orders = db.prepare(`
    SELECT id, order_number, tracking_token, status, delivery_type, total_amount, payment_status, created_at
    FROM orders
    WHERE customer_id = ?
    ORDER BY created_at DESC
  `).all(customer.id) as any[];

  // Attach preview items
  const ordersWithItems = orders.map(ord => {
    const items = db.prepare(`SELECT product_name, size, quantity, unit_price FROM order_items WHERE order_id = ?`).all(ord.id);
    return { ...ord, items };
  });

  res.json({ orders: ordersWithItems });
});

// 4. Manage addresses
accountRouter.post('/addresses', (req, res) => {
  const { street, apartment, entrance, floor, isDefault } = req.body;
  if (!street) {
    return res.status(400).json({ error: 'MISSING_STREET' });
  }

  const customer = db.prepare(`SELECT id FROM customers WHERE user_id = ?`).get(req.user!.id) as any;
  if (!customer) {
    return res.status(404).json({ error: 'CUSTOMER_NOT_FOUND' });
  }

  if (isDefault) {
    db.prepare(`UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?`).run(customer.id);
  }

  const addressId = `addr_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO customer_addresses (id, customer_id, city, street, apartment, entrance, floor, is_default)
    VALUES (?, ?, 'Алматы', ?, ?, ?, ?, ?)
  `).run(addressId, customer.id, street.trim(), apartment || null, entrance || null, floor || null, isDefault ? 1 : 0);

  res.status(201).json({ success: true, addressId });
});
