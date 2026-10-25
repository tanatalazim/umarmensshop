import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  revokeSession,
  logAudit,
  requireAuth
} from '../auth.js';

export const authRouter = Router();

// Login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Введите email и пароль' });
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.trim().toLowerCase()) as any;
  if (!user || !verifyPassword(password, user.password_hash)) {
    logAudit(null, 'LOGIN_FAILED', 'USER', email, { reason: 'Invalid credentials' }, req.ip);
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Неверный email или пароль' });
  }

  const token = createSession(user.id, req.ip, req.headers['user-agent']);

  // Fetch roles
  const roles = (db.prepare(`SELECT role_id FROM user_roles WHERE user_id = ?`).all(user.id) as any[]).map(r => r.role_id);
  const permissions = (db.prepare(`
    SELECT DISTINCT rp.permission_id
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = ?
  `).all(user.id) as any[]).map(p => p.permission_id);

  logAudit(user.id, 'LOGIN_SUCCESS', 'USER', user.id, { roles }, req.ip);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      roles,
      permissions
    }
  });
});

// Logout
authRouter.post('/logout', (req, res) => {
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }
  res.json({ success: true });
});

// Current user info
authRouter.get('/me', (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  res.json({ user: req.user });
});

// Public Customer Registration — STRICT: Role is ALWAYS CUSTOMER, cannot be escalated!
authRouter.post('/register', (req, res) => {
  const { email, password, fullName, phone } = req.body;
  if (!email || !password || !fullName || !phone) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Заполните все обязательные поля' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'Пользователь с таким email уже зарегистрирован' });
  }

  const userId = `usr_${crypto.randomUUID()}`;
  const passwordHash = hashPassword(password);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, phone)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, cleanEmail, passwordHash, fullName.trim(), phone.trim());

  // Strictly enforce CUSTOMER role
  db.prepare(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES (?, 'CUSTOMER')
  `).run(userId);

  // Create customer entity
  const customerId = `cust_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO customers (id, user_id, email, phone, full_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(customerId, userId, cleanEmail, phone.trim(), fullName.trim());

  const token = createSession(userId, req.ip, req.headers['user-agent']);
  logAudit(userId, 'USER_REGISTERED', 'USER', userId, { role: 'CUSTOMER' }, req.ip);

  res.status(201).json({
    token,
    user: {
      id: userId,
      email: cleanEmail,
      fullName: fullName.trim(),
      phone: phone.trim(),
      roles: ['CUSTOMER'],
      permissions: ['orders:create', 'orders:read_own', 'profile:manage']
    }
  });
});

// Dev-only demo accounts listing to easily switch personas in test mode
authRouter.get('/demo-accounts', (req, res) => {
  res.json({
    isDev: true,
    accounts: [
      { role: 'OWNER', email: 'owner@umarmens.kz', name: 'Умар Сериков (Владелец)', password: 'UmarShop2026!Secure', description: 'Полный доступ: админка, склад, финансы, роли, настройки' },
      { role: 'MANAGER', email: 'manager@umarmens.kz', name: 'Данияр Ахметов (Менеджер)', password: 'UmarShop2026!Secure', description: 'Обработка заказов, клиентские диалоги, без доступа к финансам и настройкам' },
      { role: 'WAREHOUSE', email: 'warehouse@umarmens.kz', name: 'Ернар Кусаинов (Склад)', password: 'UmarShop2026!Secure', description: 'Комплектация заказов, приёмка, остатки по SKU, без доступа к ценам и клиентам' },
      { role: 'CUSTOMER', email: 'customer@gmail.com', name: 'Арман Бауыржанулы (Покупатель)', password: 'UmarShop2026!Secure', description: 'Публичный магазин, личный кабинет, свои заказы' }
    ]
  });
});
