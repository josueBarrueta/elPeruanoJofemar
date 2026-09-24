import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { MenuItem } from './models/menu-item.model.js';

const app = express();
const port = Number(process.env['PORT'] ?? 3000);

app.use(cors());
app.use(express.json());
const adminEmail = process.env['ADMIN_EMAIL'] ?? 'admin@jofemar.local';
const adminPassword = process.env['ADMIN_PASSWORD'] ?? 'cambia-esta-clave';
const adminToken = crypto.randomBytes(32).toString('hex');
const requireAdmin = (request: express.Request, response: express.Response, next: express.NextFunction) => { if (request.headers.authorization === `Bearer ${adminToken}`) next(); else response.status(401).json({ message: 'Acceso no autorizado.' }); };
app.post('/api/auth/login', (request, response) => { if (request.body?.email === adminEmail && request.body?.password === adminPassword) response.json({ token: adminToken }); else response.status(401).json({ message: 'Credenciales incorrectas.' }); });

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/menu', async (_request, response) => {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'MongoDB todavía no está conectado.' });
    return;
  }

  const items = await MenuItem.find({ active: true })
    .sort({ category: 1, subcategory: 1, order: 1 })
    .lean();

  response.json(items);
});

app.get('/api/admin/menu', requireAdmin, async (_request, response) => {
  const items = await MenuItem.find().sort({ category: 1, subcategory: 1, order: 1 }).lean();
  response.json(items);
});

app.post('/api/admin/menu', requireAdmin, async (request, response) => {
  const item = await MenuItem.create(request.body);
  response.status(201).json(item);
});

app.patch('/api/admin/menu/:id', requireAdmin, async (request, response) => {
  const item = await MenuItem.findByIdAndUpdate(request.params['id'], request.body, { new: true, runValidators: true }).lean();
  if (!item) {
    response.status(404).json({ message: 'Producto no encontrado.' });
    return;
  }
  response.json(item);
});

app.delete('/api/admin/menu/:id', requireAdmin, async (request, response) => {
  const item = await MenuItem.findByIdAndDelete(request.params['id']);
  if (!item) {
    response.status(404).json({ message: 'Producto no encontrado.' });
    return;
  }
  response.status(204).send();
});

async function start(): Promise<void> {
  const mongoUri = process.env['MONGODB_URI'];

  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log('Conectado a MongoDB');
  } else {
    console.log('MONGODB_URI no configurada: servidor iniciado en modo preparación');
  }

  app.listen(port, () => {
    console.log(`API de Jofemar disponible en http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error('No se pudo iniciar la API', error);
  process.exit(1);
});
