import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, requireRole, requirePermission, logAudit } from '../auth.js';

export const staffRouter = Router();

// Staff router requires authentication and internal roles (OWNER, MANAGER, WAREHOUSE)
staffRouter.use(requireAuth);
staffRouter.use(requireRole(['OWNER', 'MANAGER', 'WAREHOUSE']));

// 1. Staff Orders list (MANAGER and OWNER)
staffRouter.get('/orders', requirePermission('orders:read_all'), (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT 
      id, order_number, tracking_token, status, delivery_type, delivery_address,
      customer_name, customer_phone, subtotal, total_amount, payment_method,
      payment_status, source, created_at, updated_at
    FROM orders
  `;
  const params: any[] = [];
  if (status) {
    query += ` WHERE status = ?`;
    params.push(status);
  }
  query += ` ORDER BY created_at DESC`;

  const orders = db.prepare(query).all(...params) as any[];

  const ordersWithItems = orders.map(ord => {
    const items = db.prepare(`SELECT product_name, sku, size, color, quantity, unit_price, total_price FROM order_items WHERE order_id = ?`).all(ord.id);
    return { ...ord, items };
  });

  res.json({ orders: ordersWithItems });
});

// 2. Update Order Status (e.g. from 'paid' to 'processing', 'ready_for_pickup', 'shipped')
staffRouter.patch('/orders/:id/status', requirePermission('orders:update_status'), (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses = ['new', 'awaiting_payment', 'paid', 'processing', 'ready_for_pickup', 'shipped', 'completed', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'INVALID_STATUS', message: 'Недопустимый статус заказа' });
  }

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as any;
  if (!order) {
    return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
  }

  db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);

  logAudit(req.user!.id, 'ORDER_STATUS_UPDATED', 'ORDER', id, {
    oldStatus: order.status,
    newStatus: status,
    note
  }, req.ip);

  res.json({ success: true, message: `Статус заказа обновлен на ${status}` });
});

// 3. Warehouse Pickups & Packing terminal (WAREHOUSE and OWNER)
staffRouter.get('/pickups', requirePermission('orders:fulfill'), (req, res) => {
  // Orders ready to be packed or shipped
  const orders = db.prepare(`
    SELECT id, order_number, status, delivery_type, customer_name, customer_phone, delivery_address, created_at
    FROM orders
    WHERE status IN ('paid', 'processing', 'ready_for_pickup')
    ORDER BY created_at ASC
  `).all() as any[];

  const pickups = orders.map(ord => {
    const items = db.prepare(`
      SELECT 
        oi.id, oi.product_name, oi.sku, oi.size, oi.color, oi.quantity,
        (SELECT quantity FROM inventory WHERE variant_id = oi.variant_id LIMIT 1) as warehouse_stock
      FROM order_items oi
      WHERE oi.order_id = ?
    `).all(ord.id);
    return { ...ord, items };
  });

  res.json({ pickups });
});

// 4. Warehouse SKU Barcode Lookup
staffRouter.get('/inventory/sku/:sku', requirePermission('inventory:read'), (req, res) => {
  const { sku } = req.params;
  const item = db.prepare(`
    SELECT 
      pv.id as variant_id, pv.sku, pv.size, pv.color,
      p.name as product_name, p.slug as product_slug,
      i.quantity, i.reserved_quantity, (i.quantity - i.reserved_quantity) as available_quantity,
      w.name as warehouse_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN inventory i ON pv.id = i.variant_id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE pv.sku = ?
  `).get(sku.trim().toUpperCase()) as any;

  if (!item) {
    return res.status(404).json({ error: 'SKU_NOT_FOUND', message: `Артикул SKU ${sku} не найден в базе склада` });
  }

  res.json({ item });
});

// 5. Customer Communications (Strict separation of Public Reply vs Internal Note)
staffRouter.get('/conversations', requirePermission('conversations:manage'), (req, res) => {
  const conversations = db.prepare(`
    SELECT c.*, 
      (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_body,
      (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
    FROM conversations c
    ORDER BY c.updated_at DESC
  `).all();

  res.json({ conversations });
});

staffRouter.get('/conversations/:id/messages', requirePermission('conversations:manage'), (req, res) => {
  const { id } = req.params;
  const messages = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `).all(id);

  res.json({ messages });
});

staffRouter.post('/conversations/:id/messages', requirePermission('conversations:manage'), (req, res) => {
  const { id } = req.params;
  const { body, isInternalNote } = req.body;

  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'EMPTY_MESSAGE' });
  }

  const messageId = `msg_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_type, sender_id, is_internal_note, body)
    VALUES (?, ?, 'staff', ?, ?, ?)
  `).run(messageId, id, req.user!.id, isInternalNote ? 1 : 0, body.trim());

  db.prepare(`UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`).run(id);

  logAudit(req.user!.id, 'STAFF_MESSAGE_SENT', 'CONVERSATION', id, {
    isInternalNote: Boolean(isInternalNote)
  }, req.ip);

  res.status(201).json({
    success: true,
    messageId,
    isInternalNote: Boolean(isInternalNote)
  });
});

// 6. Full Inventory List (WAREHOUSE & OWNER)
staffRouter.get('/inventory', requirePermission('inventory:read'), (req, res) => {
  const items = db.prepare(`
    SELECT 
      pv.id as variant_id, pv.sku, pv.size, pv.color,
      p.id as product_id, p.name as product_name, p.slug as product_slug,
      c.name as category_name,
      i.warehouse_id,
      i.quantity, i.reserved_quantity, (i.quantity - i.reserved_quantity) as available_quantity,
      i.min_threshold, i.updated_at,
      w.name as warehouse_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory i ON pv.id = i.variant_id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    ORDER BY p.name ASC, pv.sku ASC
  `).all();

  res.json({ inventory: items });
});

// 7. Receive Stock (Приёмка товара на склад с проверкой идемпотентности)
staffRouter.post('/inventory/receive', requirePermission('inventory:receive'), (req, res) => {
  const { variantId, quantity, documentNumber, reason, idempotencyKey } = req.body;

  if (!variantId || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: 'INVALID_PARAMS', message: 'Укажите вариант товара и положительное количество' });
  }

  // Idempotency check: prevent duplicate crediting on double-click/resend
  if (idempotencyKey) {
    const existing = db.prepare('SELECT key FROM inventory_idempotency_keys WHERE key = ?').get(idempotencyKey);
    if (existing) {
      const current = db.prepare('SELECT quantity, reserved_quantity, (quantity - reserved_quantity) as available_quantity FROM inventory WHERE variant_id = ?').get(variantId) as any;
      return res.json({
        success: true,
        idempotentReplay: true,
        message: 'Приёмка уже была обработана ранее (idempotent)',
        quantity: current?.quantity ?? 0,
        available: current?.available_quantity ?? 0
      });
    }
    db.prepare('INSERT INTO inventory_idempotency_keys (key) VALUES (?)').run(idempotencyKey);
  }

  const warehouse = db.prepare('SELECT id FROM warehouses WHERE is_active = 1 LIMIT 1').get() as any;
  const warehouseId = warehouse?.id || 'wh_almaty_main';

  const variant = db.prepare('SELECT id, sku FROM product_variants WHERE id = ?').get(variantId) as any;
  if (!variant) {
    return res.status(404).json({ error: 'VARIANT_NOT_FOUND', message: 'Артикул не найден' });
  }

  // Ensure row in inventory exists
  db.prepare(`
    INSERT INTO inventory (variant_id, warehouse_id, quantity, reserved_quantity, min_threshold)
    VALUES (?, ?, 0, 0, 2)
    ON CONFLICT(variant_id, warehouse_id) DO NOTHING
  `).run(variantId, warehouseId);

  // Update quantity atomically
  db.prepare(`
    UPDATE inventory 
    SET quantity = quantity + ?, updated_at = datetime('now')
    WHERE variant_id = ? AND warehouse_id = ?
  `).run(quantity, variantId, warehouseId);

  // Insert into inventory_movements
  const movementId = `mov_${crypto.randomUUID()}`;
  const movementReason = documentNumber ? `Приёмка: ${documentNumber} (${reason || 'Плановое поступление'})` : (reason || 'Приёмка товара на склад');
  db.prepare(`
    INSERT INTO inventory_movements (id, variant_id, warehouse_id, change_amount, movement_type, performed_by_user_id, reason)
    VALUES (?, ?, ?, ?, 'receipt', ?, ?)
  `).run(movementId, variantId, warehouseId, quantity, req.user!.id, movementReason);

  logAudit(req.user!.id, 'INVENTORY_RECEIVED', 'INVENTORY', variantId, {
    quantity,
    documentNumber,
    movementId
  }, req.ip);

  const updated = db.prepare(`
    SELECT quantity, reserved_quantity, (quantity - reserved_quantity) as available_quantity 
    FROM inventory 
    WHERE variant_id = ? AND warehouse_id = ?
  `).get(variantId, warehouseId) as any;

  res.status(201).json({
    success: true,
    message: `Успешно принято ${quantity} шт.`,
    movementId,
    newQuantity: updated.quantity,
    newAvailable: updated.available_quantity
  });
});

// 8. Adjust Stock (Списание / Корректировка)
staffRouter.post('/inventory/adjust', requirePermission('inventory:adjust'), (req, res) => {
  const { variantId, changeAmount, reason, idempotencyKey } = req.body;
  if (!variantId || typeof changeAmount !== 'number' || changeAmount === 0) {
    return res.status(400).json({ error: 'INVALID_PARAMS', message: 'Укажите корректное изменение количества' });
  }

  if (idempotencyKey) {
    const existing = db.prepare('SELECT key FROM inventory_idempotency_keys WHERE key = ?').get(idempotencyKey);
    if (existing) {
      const current = db.prepare('SELECT quantity, reserved_quantity, (quantity - reserved_quantity) as available_quantity FROM inventory WHERE variant_id = ?').get(variantId) as any;
      return res.json({
        success: true,
        idempotentReplay: true,
        quantity: current?.quantity ?? 0,
        available: current?.available_quantity ?? 0
      });
    }
    db.prepare('INSERT INTO inventory_idempotency_keys (key) VALUES (?)').run(idempotencyKey);
  }

  const warehouse = db.prepare('SELECT id FROM warehouses WHERE is_active = 1 LIMIT 1').get() as any;
  const warehouseId = warehouse?.id || 'wh_almaty_main';

  const current = db.prepare('SELECT quantity, reserved_quantity FROM inventory WHERE variant_id = ? AND warehouse_id = ?').get(variantId, warehouseId) as any;
  if (!current) {
    return res.status(404).json({ error: 'INVENTORY_NOT_FOUND' });
  }

  if (current.quantity + changeAmount < current.reserved_quantity) {
    return res.status(400).json({ error: 'CANNOT_REDUCE_BELOW_RESERVED', message: 'Нельзя списать остаток ниже уровня активных клиентских резервов' });
  }

  db.prepare(`
    UPDATE inventory 
    SET quantity = quantity + ?, updated_at = datetime('now')
    WHERE variant_id = ? AND warehouse_id = ?
  `).run(changeAmount, variantId, warehouseId);

  const movementId = `mov_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO inventory_movements (id, variant_id, warehouse_id, change_amount, movement_type, performed_by_user_id, reason)
    VALUES (?, ?, ?, ?, 'adjustment', ?, ?)
  `).run(movementId, variantId, warehouseId, changeAmount, req.user!.id, reason || 'Инвентаризационная корректировка');

  logAudit(req.user!.id, 'INVENTORY_ADJUSTED', 'INVENTORY', variantId, { changeAmount, reason }, req.ip);

  res.json({ success: true, newQuantity: current.quantity + changeAmount });
});

// 9. Inventory Movements History (История складских операций)
staffRouter.get('/inventory/movements', requirePermission('inventory:read'), (req, res) => {
  const movements = db.prepare(`
    SELECT 
      m.id, m.change_amount, m.movement_type, m.reason, m.created_at,
      pv.sku, pv.size, pv.color,
      p.name as product_name,
      u.full_name as performed_by
    FROM inventory_movements m
    JOIN product_variants pv ON m.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN users u ON m.performed_by_user_id = u.id
    ORDER BY m.created_at DESC
    LIMIT 100
  `).all();

  res.json({ movements });
});

// 10. Mark Order Packed (Сборка & комплектация кладовщиком)
staffRouter.patch('/pickups/:orderId/pack', requirePermission('orders:fulfill'), (req, res) => {
  const { orderId } = req.params;
  const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
  }

  const newStatus = 'ready_for_pickup';
  db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(newStatus, orderId);

  logAudit(req.user!.id, 'ORDER_PACKED', 'ORDER', orderId, {
    previousStatus: order.status,
    newStatus
  }, req.ip);

  res.json({ success: true, message: 'Заказ укомплектован и готов к передаче' });
});

