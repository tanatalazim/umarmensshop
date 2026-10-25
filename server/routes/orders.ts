import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { logAudit } from '../auth.js';
import { SandboxPaymentProvider } from '../payments/sandbox.js';
import { telegramService } from '../telegram/bot.js';

export const ordersRouter = Router();
const sandboxPaymentProvider = new SandboxPaymentProvider();

// Helper to generate sequential readable order numbers
function generateOrderNumber(): string {
  const row = db.prepare(`SELECT count(*) as count FROM orders`).get() as any;
  const num = 1000 + (row.count || 0) + 1;
  return `UM-${num}`;
}

// 1. Transactional Checkout
ordersRouter.post('/', async (req, res) => {
  const {
    items,
    customerName,
    customerPhone,
    customerEmail,
    deliveryType,
    deliveryAddress,
    customerComment,
    paymentMethod = 'kaspi_pay'
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'EMPTY_CART', message: 'Корзина пуста' });
  }

  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'MISSING_CONTACTS', message: 'Укажите ваше имя и контактный телефон' });
  }

  if (deliveryType === 'courier_almaty' && !deliveryAddress) {
    return res.status(400).json({ error: 'MISSING_ADDRESS', message: 'Укажите адрес доставки по Алматы' });
  }

  const orderId = `ord_${crypto.randomUUID()}`;
  const orderNumber = generateOrderNumber();
  const trackingToken = `tok_${crypto.randomBytes(24).toString('hex')}`;

  // Find or create customer
  let customerId = 'cust_guest';
  if (req.user) {
    const cust = db.prepare(`SELECT id FROM customers WHERE user_id = ?`).get(req.user.id) as any;
    if (cust) {
      customerId = cust.id;
    } else {
      customerId = `cust_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO customers (id, user_id, email, phone, full_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(customerId, req.user.id, customerEmail || req.user.email, customerPhone, customerName);
    }
  } else {
    // Guest customer
    const existingGuest = db.prepare(`SELECT id FROM customers WHERE phone = ?`).get(customerPhone) as any;
    if (existingGuest) {
      customerId = existingGuest.id;
    } else {
      customerId = `cust_guest_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO customers (id, email, phone, full_name)
        VALUES (?, ?, ?, ?)
      `).run(customerId, customerEmail || null, customerPhone, customerName);
    }
  }

  // BEGIN ATOMIC TRANSACTION for reservation and order creation
  db.exec('BEGIN IMMEDIATE;');

  try {
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const { variantId, quantity } = item;
      if (!variantId || !quantity || quantity <= 0) {
        throw new Error('INVALID_ITEM');
      }

      // Query variant, product name and verified price from DB
      const variant = db.prepare(`
        SELECT 
          pv.id as variant_id, pv.sku, pv.size, pv.color, pv.price_override,
          p.id as product_id, p.name as product_name, p.base_price, p.discount_price
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = ? AND p.is_active = 1
      `).get(variantId) as any;

      if (!variant) {
        throw new Error(`VARIANT_NOT_FOUND:${variantId}`);
      }

      const unitPrice = variant.price_override || variant.discount_price || variant.base_price;
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      // ATOMIC RESERVATION CHECK
      // Updates reserved_quantity IF AND ONLY IF (quantity - reserved_quantity) >= requested quantity
      const reserveResult = db.prepare(`
        UPDATE inventory 
        SET reserved_quantity = reserved_quantity + ?
        WHERE variant_id = ? AND (quantity - reserved_quantity) >= ?
      `).run(quantity, variantId, quantity);

      if (reserveResult.changes === 0) {
        // Stock insufficiency detected!
        const stockInfo = db.prepare(`SELECT (quantity - reserved_quantity) as remaining FROM inventory WHERE variant_id = ?`).get(variantId) as any;
        const remaining = stockInfo ? stockInfo.remaining : 0;
        throw new Error(`OUT_OF_STOCK:${variant.product_name} (${variant.size}): доступно ${remaining} шт.`);
      }

      // Record movement
      db.prepare(`
        INSERT INTO inventory_movements (id, variant_id, warehouse_id, change_amount, movement_type, reference_order_id, reason)
        VALUES (?, ?, 'wh_almaty_main', ?, 'reservation', ?, 'Резерв при оформлении заказа')
      `).run(crypto.randomUUID(), variantId, quantity, orderId);

      validatedItems.push({
        id: crypto.randomUUID(),
        orderId,
        variantId,
        productName: variant.product_name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        unitPrice,
        quantity,
        totalPrice: itemTotal
      });
    }

    const deliveryFee = deliveryType === 'courier_almaty' ? (subtotal >= 100000 ? 0 : 2500) : 0;
    const totalAmount = subtotal + deliveryFee;

    // Create Order Record
    db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_id, tracking_token, status, delivery_type,
        delivery_address, customer_name, customer_phone, customer_email,
        subtotal, delivery_fee, total_amount, payment_method, payment_status,
        customer_comment, source
      ) VALUES (?, ?, ?, ?, 'awaiting_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'web')
    `).run(
      orderId,
      orderNumber,
      customerId,
      trackingToken,
      deliveryType,
      deliveryAddress || null,
      customerName,
      customerPhone,
      customerEmail || null,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod,
      customerComment || null
    );

    // Create Order Items
    for (const vItem of validatedItems) {
      db.prepare(`
        INSERT INTO order_items (
          id, order_id, variant_id, product_name, sku, size, color, unit_price, quantity, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        vItem.id,
        vItem.orderId,
        vItem.variantId,
        vItem.productName,
        vItem.sku,
        vItem.size,
        vItem.color,
        vItem.unitPrice,
        vItem.quantity,
        vItem.totalPrice
      );
    }

    db.exec('COMMIT;');

    // Payment Session Generation via PaymentProvider
    const paymentSession = await sandboxPaymentProvider.createPaymentSession({
      orderId,
      orderNumber,
      amount: totalAmount,
      currency: 'KZT',
      customerName,
      customerPhone
    });

    logAudit(req.user?.id || null, 'ORDER_CREATED', 'ORDER', orderId, {
      orderNumber,
      totalAmount,
      itemsCount: items.length
    }, req.ip);

    // Non-blocking staff Telegram notification
    telegramService.notifyStaffNewOrder({
      orderNumber,
      totalAmount,
      customerName,
      customerPhone,
      deliveryAddress
    }).catch(err => console.error('[Order] Telegram notify error:', err));

    res.status(201).json({
      success: true,
      orderId,
      orderNumber,
      trackingToken,
      totalAmount,
      paymentSession
    });
  } catch (error: any) {
    db.exec('ROLLBACK;');
    console.error('Order creation transaction failed:', error.message);

    if (error.message.startsWith('OUT_OF_STOCK:')) {
      return res.status(409).json({
        error: 'OUT_OF_STOCK',
        message: error.message.replace('OUT_OF_STOCK:', '')
      });
    }

    return res.status(500).json({
      error: 'ORDER_FAILED',
      message: 'Не удалось оформить заказ. Пожалуйста, повторите попытку.'
    });
  }
});

// 2. Get Order Details — OBJECT-LEVEL ACCESS CONTROL
ordersRouter.get('/:id', (req, res) => {
  const { id } = req.params;

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as any;
  if (!order) {
    return res.status(404).json({ error: 'ORDER_NOT_FOUND', message: 'Заказ не найден' });
  }

  // OBJECT-LEVEL PERMISSION CHECK:
  // Is requester an admin or staff member with orders:read_all?
  const hasStaffPerm = req.user?.permissions.includes('orders:read_all');

  // Or is requester the owner of this customer profile?
  let isOwner = false;
  if (req.user) {
    const cust = db.prepare(`SELECT id FROM customers WHERE user_id = ?`).get(req.user.id) as any;
    if (cust && cust.id === order.customer_id) {
      isOwner = true;
    }
  }

  if (!hasStaffPerm && !isOwner) {
    logAudit(req.user?.id || null, 'UNAUTHORIZED_ORDER_ACCESS_ATTEMPT', 'ORDER', id, {}, req.ip);
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Доступ к чужому заказу запрещён'
    });
  }

  const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(id);
  const payment = db.prepare(`SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`).get(id);

  res.json({
    order: {
      ...order,
      items,
      payment
    }
  });
});

// 3. Track Order securely by crypto token (Guest friendly)
ordersRouter.get('/track/:token', (req, res) => {
  const { token } = req.params;

  const order = db.prepare(`SELECT * FROM orders WHERE tracking_token = ?`).get(token) as any;
  if (!order) {
    return res.status(404).json({ error: 'TRACKING_NOT_FOUND', message: 'Заказ по указанному коду отслеживания не найден' });
  }

  const items = db.prepare(`SELECT product_name, size, color, quantity, total_price FROM order_items WHERE order_id = ?`).all(order.id);
  const payment = db.prepare(`SELECT status, provider, qr_payload, payment_url FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`).get(order.id);

  // Return sanitized customer-facing order status (no internal notes!)
  res.json({
    id: order.id,
    orderId: order.id,
    orderNumber: order.order_number,
    order_number: order.order_number,
    status: order.status,
    createdAt: order.created_at,
    created_at: order.created_at,
    deliveryType: order.delivery_type,
    delivery_type: order.delivery_type,
    customerName: order.customer_name,
    customer_name: order.customer_name,
    totalAmount: order.total_amount,
    total_amount: order.total_amount,
    paymentStatus: order.payment_status,
    payment_status: order.payment_status,
    items,
    payment
  });
});

// 4. Cancel Order & Release Stock
ordersRouter.post('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as any;
  if (!order) {
    return res.status(404).json({ error: 'ORDER_NOT_FOUND', message: 'Заказ не найден' });
  }

  // Verify access: owner or staff with permissions
  const hasStaffPerm = req.user?.permissions.includes('orders:update_status');
  let isCustomerOwner = false;
  if (req.user) {
    const cust = db.prepare(`SELECT id FROM customers WHERE user_id = ?`).get(req.user.id) as any;
    if (cust && cust.id === order.customer_id) isCustomerOwner = true;
  }

  if (!hasStaffPerm && !isCustomerOwner) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Запрещено отменять данный заказ' });
  }

  if (order.status === 'completed' || order.status === 'shipped') {
    return res.status(400).json({ error: 'CANNOT_CANCEL', message: 'Заказ уже отправлен или завершен' });
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(`UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(id);

    // Release stock reserve if it was not yet completed
    const items = db.prepare(`SELECT variant_id, quantity FROM order_items WHERE order_id = ?`).all(id) as any[];
    for (const item of items) {
      db.prepare(`
        UPDATE inventory 
        SET reserved_quantity = MAX(0, reserved_quantity - ?)
        WHERE variant_id = ?
      `).run(item.quantity, item.variant_id);

      db.prepare(`
        INSERT INTO inventory_movements (id, variant_id, warehouse_id, change_amount, movement_type, reference_order_id, reason)
        VALUES (?, ?, 'wh_almaty_main', ?, 'cancellation', ?, 'Освобождение резерва при отмене заказа')
      `).run(crypto.randomUUID(), item.variant_id, item.quantity, id);
    }

    db.exec('COMMIT;');
    logAudit(req.user?.id || null, 'ORDER_CANCELLED', 'ORDER', id, {}, req.ip);

    res.json({ success: true, message: 'Заказ отменён, зарезервированные товары возвращены в наличие' });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: 'CANCEL_FAILED', message: err.message });
  }
});
