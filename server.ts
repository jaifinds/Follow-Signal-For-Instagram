import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { instagramRouter } from './src/providers/instagram/instagramRoutes';
import { authRouter } from './src/providers/auth/authRoutes';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount authentication and official Instagram provider routes
  app.use('/api/auth', authRouter);
  app.use('/api/instagram', instagramRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Follow Signal — Instagram Relationship Intelligence',
      time: new Date().toISOString(),
      instagramConfigured: Boolean(
        process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET
      ),
    });
  });

  if (!isProd) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Follow Signal Server] running at http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[Follow Signal Server] Fatal start error:', err);
  process.exit(1);
});
