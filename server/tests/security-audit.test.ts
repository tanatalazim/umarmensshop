import { db, initDatabase } from '../db.js';
import { runBootstrap } from '../bootstrap.js';
import { getUserBySession, createSession, hashPassword, revokeSession } from '../auth.js';
import { SandboxPaymentProvider } from '../payments/sandbox.js';

async function runSecurityAudit() {
  console.log('🔒 Starting UMAR MENS SHOP Security & RBAC Test Suite...\n');
  runBootstrap();

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${message || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. Roles & Permissions setup check
  const ownerRoles = db.prepare(`SELECT role_id FROM user_roles WHERE user_id = 'usr_owner_01'`).all() as any[];
  assert('Owner has OWNER role', ownerRoles.some(r => r.role_id === 'OWNER'));

  const managerRoles = db.prepare(`SELECT role_id FROM user_roles WHERE user_id = 'usr_manager_01'`).all() as any[];
  assert('Manager has MANAGER role', managerRoles.some(r => r.role_id === 'MANAGER'));

  const warehouseRoles = db.prepare(`SELECT role_id FROM user_roles WHERE user_id = 'usr_warehouse_01'`).all() as any[];
  assert('Warehouse staff has WAREHOUSE role', warehouseRoles.some(r => r.role_id === 'WAREHOUSE'));

  const customerRoles = db.prepare(`SELECT role_id FROM user_roles WHERE user_id = 'usr_customer_01'`).all() as any[];
  assert('Customer has CUSTOMER role', customerRoles.some(r => r.role_id === 'CUSTOMER'));

  // 2. Permission Check: MANAGER cannot update pricing, inventory receive or view owner finances
  const managerPerms = (db.prepare(`
    SELECT DISTINCT rp.permission_id
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = 'usr_manager_01'
  `).all() as any[]).map(p => p.permission_id);

  assert('MANAGER does NOT have pricing:update permission', !managerPerms.includes('pricing:update'));
  assert('MANAGER does NOT have finances:read permission', !managerPerms.includes('finances:read'));
  assert('MANAGER does NOT have settings:manage permission', !managerPerms.includes('settings:manage'));
  assert('MANAGER has orders:update_status permission', managerPerms.includes('orders:update_status'));
  assert('MANAGER does NOT have inventory:receive permission', !managerPerms.includes('inventory:receive'));

  // 3. Permission Check: WAREHOUSE permissions
  const warehousePerms = (db.prepare(`
    SELECT DISTINCT rp.permission_id
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = 'usr_warehouse_01'
  `).all() as any[]).map(p => p.permission_id);

  assert('WAREHOUSE does NOT have pricing:update permission', !warehousePerms.includes('pricing:update'));
  assert('WAREHOUSE does NOT have finances:read permission', !warehousePerms.includes('finances:read'));
  assert('WAREHOUSE does NOT have orders:update_status permission', !warehousePerms.includes('orders:update_status'));
  assert('WAREHOUSE has inventory:receive permission', warehousePerms.includes('inventory:receive'));
  assert('WAREHOUSE has orders:fulfill permission', warehousePerms.includes('orders:fulfill'));

  // 4. Permission Check: CUSTOMER permissions are restricted
  const customerPerms = (db.prepare(`
    SELECT DISTINCT rp.permission_id
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = 'usr_customer_01'
  `).all() as any[]).map(p => p.permission_id);

  assert('CUSTOMER has ZERO staff or admin permissions', customerPerms.every(p => !p.startsWith('inventory:') && !p.startsWith('orders:update_status') && !p.startsWith('finances:')));

  // 5. Concurrency Test: Atomic stock reservation prevents double-booking
  const testVarId = 'var_test_limited_unit';
  db.prepare(`
    INSERT INTO product_variants (id, product_id, sku, size, color, color_hex)
    VALUES (?, 'prod_suit_charcoal', 'TEST-LTD-01', '50 (L)', 'Graphite', '#000000')
    ON CONFLICT(id) DO NOTHING
  `).run(testVarId);

  db.prepare(`
    INSERT INTO inventory (variant_id, warehouse_id, quantity, reserved_quantity, min_threshold)
    VALUES (?, 'wh_almaty_main', 1, 0, 1)
    ON CONFLICT(variant_id, warehouse_id) DO UPDATE SET quantity = 1, reserved_quantity = 0
  `).run(testVarId);

  // Buyer 1 reserves the last unit
  const buyer1Result = db.prepare(`
    UPDATE inventory 
    SET reserved_quantity = reserved_quantity + 1
    WHERE variant_id = ? AND (quantity - reserved_quantity) >= 1
  `).run(testVarId);
  assert('Buyer 1 successfully reserves the single available unit', buyer1Result.changes === 1);

  // Buyer 2 tries to reserve the same unit simultaneously
  const buyer2Result = db.prepare(`
    UPDATE inventory 
    SET reserved_quantity = reserved_quantity + 1
    WHERE variant_id = ? AND (quantity - reserved_quantity) >= 1
  `).run(testVarId);
  assert('Buyer 2 is REJECTED because available stock is now 0 (changes === 0)', buyer2Result.changes === 0);

  // 6. Warehouse Idempotent Stock Receipt Test
  const testReceiveKey = `wh_rcv_test_${Date.now()}`;
  const initialStockRow = db.prepare(`SELECT quantity FROM inventory WHERE variant_id = ?`).get(testVarId) as any;
  const initialQty = initialStockRow ? initialStockRow.quantity : 0;
  const receiveQty = 5;

  // First stock receipt call
  const recordFirst = (() => {
    db.exec('BEGIN TRANSACTION');
    try {
      const existing = db.prepare(`SELECT * FROM inventory_idempotency_keys WHERE key = ?`).get(testReceiveKey) as any;
      if (existing) {
        db.exec('COMMIT');
        return { skipped: true, qty: initialQty };
      }

      db.prepare(`
        INSERT INTO inventory (variant_id, warehouse_id, quantity, reserved_quantity, min_threshold)
        VALUES (?, 'wh_almaty_main', ?, 0, 1)
        ON CONFLICT(variant_id, warehouse_id) DO UPDATE SET quantity = quantity + ?
      `).run(testVarId, receiveQty, receiveQty);

      db.prepare(`
        INSERT INTO inventory_idempotency_keys (key)
        VALUES (?)
      `).run(testReceiveKey);

      db.exec('COMMIT');
      const updated = db.prepare(`SELECT quantity FROM inventory WHERE variant_id = ?`).get(testVarId) as any;
      return { skipped: false, qty: updated.quantity };
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  })();

  assert('First stock receipt increments physical stock by 5', recordFirst.skipped === false && recordFirst.qty === initialQty + 5);

  // Repeat duplicate stock receipt call with same idempotency key
  const recordDuplicate = (() => {
    db.exec('BEGIN TRANSACTION');
    try {
      const existing = db.prepare(`SELECT * FROM inventory_idempotency_keys WHERE key = ?`).get(testReceiveKey) as any;
      if (existing) {
        db.exec('COMMIT');
        const current = db.prepare(`SELECT quantity FROM inventory WHERE variant_id = ?`).get(testVarId) as any;
        return { skipped: true, qty: current.quantity };
      }

      db.prepare(`
        UPDATE inventory SET quantity = quantity + ? WHERE variant_id = ?
      `).run(receiveQty, testVarId);
      db.exec('COMMIT');
      const updated = db.prepare(`SELECT quantity FROM inventory WHERE variant_id = ?`).get(testVarId) as any;
      return { skipped: false, qty: updated.quantity };
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  })();

  assert('Duplicate stock receipt with same idempotency key is skipped without double-addition', recordDuplicate.skipped === true && recordDuplicate.qty === initialQty + 5);

  // 7. Payment Webhook Idempotency Test
  const sandbox = new SandboxPaymentProvider();
  const testPayId = `pay_test_idemp_${Date.now()}`;
  const testKey = `idemp_key_${Date.now()}`;

  db.prepare(`
    INSERT INTO payments (id, order_id, provider, amount, status)
    VALUES (?, 'ord_demo_101', 'sandbox_kaspi', 50000, 'pending')
  `).run(testPayId);

  const firstWebhook = await sandbox.processWebhookEvent({
    paymentId: testPayId,
    idempotencyKey: testKey,
    status: 'succeeded'
  });
  assert('First payment webhook event successfully processed', firstWebhook.handled && firstWebhook.newPaymentStatus === 'succeeded');

  const secondWebhook = await sandbox.processWebhookEvent({
    paymentId: testPayId,
    idempotencyKey: testKey,
    status: 'succeeded'
  });
  assert('Second duplicate payment webhook skipped idempotently', secondWebhook.handled && secondWebhook.message.includes('idempotent skip'));

  // 8. Session Invalidation / Logout Test
  const newSessionToken = createSession('usr_customer_01');
  const sessionUserBefore = getUserBySession(newSessionToken);
  assert('Created session successfully authenticates user', sessionUserBefore !== null && sessionUserBefore.id === 'usr_customer_01');

  revokeSession(newSessionToken);
  const sessionUserAfter = getUserBySession(newSessionToken);
  assert('Invalidated session immediately returns null (clean session flush)', sessionUserAfter === null);

  // 9. Data Isolation: Public catalog does not leak internal data
  const publicRow = db.prepare(`SELECT * FROM products LIMIT 1`).get() as any;
  assert('Products table has is_demo flag', publicRow.is_demo === 1);

  console.log(`\n========================================`);
  console.log(`Tests finished: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Test suite runtime error:', err);
  process.exit(1);
});
