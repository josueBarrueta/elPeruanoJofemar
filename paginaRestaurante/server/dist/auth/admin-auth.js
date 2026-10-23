import crypto from 'node:crypto';
import express from 'express';
import mongoose, { Schema, model } from 'mongoose';
export const AdminSession = model('AdminSession', new Schema({
    _id: { type: String, required: true },
    credentialVersion: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }));
export const sessionHash = (token) => crypto.createHash('sha256').update(token).digest('hex');
export function credentialVersion(email, password) {
    return crypto.scryptSync(password, `jofemar-admin:${email}`, 32).toString('hex');
}
export function bearerToken(header) {
    return header && /^Bearer [a-f0-9]{64}$/.test(header) ? header.slice(7) : null;
}
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export function createAdminAuth(email, password, now = Date.now) {
    const version = email && password ? credentialVersion(email, password) : null;
    const router = express.Router();
    // Account-wide limit also works behind Render without trusting forwarded IP headers.
    let attempts = 0;
    let windowEnd = 0;
    const requireAdmin = async (req, res, next) => {
        const token = bearerToken(req.headers.authorization);
        if (!token || !version) {
            res.status(401).json({ message: 'Acceso no autorizado.' });
            return;
        }
        if (mongoose.connection.readyState !== 1) {
            res.status(503).json({ message: 'Base de datos no disponible. Tu sesión se mantiene; vuelve a intentarlo.' });
            return;
        }
        try {
            const session = await AdminSession.exists({ _id: sessionHash(token), credentialVersion: version, expiresAt: { $gt: new Date(now()) } });
            if (!session) {
                res.status(401).json({ message: 'Sesión no válida. Vuelve a iniciar sesión.' });
                return;
            }
            next();
        }
        catch {
            res.status(503).json({ message: 'No se pudo comprobar la sesión. Vuelve a intentarlo.' });
        }
    };
    router.post('/login', async (req, res) => {
        const current = now();
        if (current >= windowEnd) {
            attempts = 0;
            windowEnd = current + 15 * 60 * 1000;
        }
        if (++attempts > 10) {
            res.setHeader('Retry-After', String(Math.max(1, Math.ceil((windowEnd - current) / 1000))));
            res.status(429).json({ message: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.' });
            return;
        }
        res.setHeader('Cache-Control', 'no-store');
        if (!version || req.body?.email !== email || req.body?.password !== password) {
            res.status(401).json({ message: 'Credenciales incorrectas.' });
            return;
        }
        if (mongoose.connection.readyState !== 1) {
            res.status(503).json({ message: 'Base de datos no disponible. Vuelve a intentarlo.' });
            return;
        }
        try {
            const token = crypto.randomBytes(32).toString('hex');
            // Solo se guarda la huella; se comprueba la caducidad incluso antes de la limpieza TTL.
            await AdminSession.create({ _id: sessionHash(token), credentialVersion: version, expiresAt: new Date(now() + SESSION_DURATION_MS) });
            res.json({ token });
        }
        catch {
            res.status(503).json({ message: 'No se pudo guardar la sesión. Vuelve a intentarlo.' });
        }
    });
    router.post('/logout', async (req, res) => {
        const token = bearerToken(req.headers.authorization);
        if (!token) {
            res.status(204).send();
            return;
        }
        if (mongoose.connection.readyState !== 1) {
            res.status(503).json({ message: 'No se pudo revocar la sesión en el servidor.' });
            return;
        }
        try {
            await AdminSession.deleteOne({ _id: sessionHash(token) });
            res.status(204).send();
        }
        catch {
            res.status(503).json({ message: 'No se pudo revocar la sesión en el servidor.' });
        }
    });
    return { router, requireAdmin };
}
