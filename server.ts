import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { runBootstrap } from './server/bootstrap.js';
import { authenticateMiddleware } from './server/auth.js';
import { authRouter } from './server/routes/auth.js';
import { catalogRouter } from './server/routes/catalog.js';
import { ordersRouter } from './server/routes/orders.js';
import { paymentsRouter } from './server/routes/payments.js';
import { accountRouter } from './server/routes/account.js';
import { staffRouter } from './server/routes/staff.js';
import { adminRouter } from './server/routes/admin.js';
import { telegramService } from './server/telegram/bot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & demo records
runBootstrap();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Authentication parser (extracts Bearer token & sets req.user)
app.use(authenticateMiddleware);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/account', accountRouter);
app.use('/api/staff', staffRouter);
app.use('/api/admin', adminRouter);

// Telegram Webhook route
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const result = await telegramService.handleWebhookUpdate(req.body);
    res.json(result);
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    res.status(500).json({ error: 'TELEGRAM_ERROR' });
  }
});

// Vite or Static Production build
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  const distDir = path.resolve(__dirname, 'dist');
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 UMAR MENS SHOP server running on http://0.0.0.0:${PORT}`);
});
