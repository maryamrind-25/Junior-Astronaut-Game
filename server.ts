import 'dotenv/config';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load user's attached Express backend (/backend/app.js)
const backendApp = require('./backend/app.js') as express.Express;

async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    backendApp.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    backendApp.use(express.static(distDir));
    backendApp.get('{*path}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  backendApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Junior Astronaut Trainer + Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
