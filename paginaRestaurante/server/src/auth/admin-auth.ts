import crypto from 'node:crypto';
import express from 'express';
import mongoose, { Schema, model } from 'mongoose';

export const AdminSession = model('AdminSession', new Schema({
  _id: { type: String, required: true },
  credentialVersion: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }));
export const sessionHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
export function credentialVersion(email: string, password: string) {
  return crypto.scryptSync(password, `jofemar-admin:${email}`, 32).toString('hex');
}
export function bearerToken(header?: string): string | null {
  return header && /^Bearer [a-f0-9]{64}$/.test(header) ? header.slice(7) : null;
}
export function createAdminAuth(email?: string, password?: string) {
  const version = email && password ? credentialVersion(email, password) : null;
  const router = express.Router();
  const requireAdmin: express.RequestHandler = async (req, res, next) => {
    const token = bearerToken(req.headers.authorization);
    if (!token || !version) { res.status(401).json({ message: 'Acceso no autorizado.' }); return; }
    if (mongoose.connection.readyState !== 1) { res.status(503).json({ message: 'Base de datos no disponible. Tu sesión se mantiene; vuelve a intentarlo.' }); return; }
    try {
      const session = await AdminSession.exists({ _id: sessionHash(token), credentialVersion: version });
      if (!session) { res.status(401).json({ message: 'Sesión no válida. Vuelve a iniciar sesión.' }); return; }
      next();
    } catch { res.status(503).json({ message: 'No se pudo comprobar la sesión. Vuelve a intentarlo.' }); }
  };
  router.post('/login', async (req, res) => {
    if (!version || req.body?.email !== email || req.body?.password !== password) { res.status(401).json({ message: 'Credenciales incorrectas.' }); return; }
    if (mongoose.connection.readyState !== 1) { res.status(503).json({ message: 'Base de datos no disponible. Vuelve a intentarlo.' }); return; }
    try {
      const token = crypto.randomBytes(32).toString('hex');
      // Solo se guarda la huella del token. No hay caducidad por tiempo ni estado en memoria.
      await AdminSession.create({ _id: sessionHash(token), credentialVersion: version });
      res.json({ token });
    } catch { res.status(503).json({ message: 'No se pudo guardar la sesión. Vuelve a intentarlo.' }); }
  });
  router.post('/logout', async (req, res) => {
    const token = bearerToken(req.headers.authorization);
    if (!token) { res.status(204).send(); return; }
    if (mongoose.connection.readyState !== 1) { res.status(503).json({ message: 'No se pudo revocar la sesión en el servidor.' }); return; }
    try { await AdminSession.deleteOne({ _id: sessionHash(token) }); res.status(204).send(); }
    catch { res.status(503).json({ message: 'No se pudo revocar la sesión en el servidor.' }); }
  });
  return { router, requireAdmin };
}
