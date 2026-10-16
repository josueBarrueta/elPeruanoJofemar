import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { TableOrder } from './models/table-order.model.js';
import { expenseAttachment } from './models/expense-attachment.js';
import { receiptRange, receiptInvoiceInput } from './models/receipt-validation.js';
import { tableOrders } from './routes/table-orders.js';
import { Reservation, reservationInput } from './models/reservation.model.js';
import { MenuItem } from './models/menu-item.model.js';
import { DailyMenu } from './models/daily-menu.model.js';
import { InvoiceDraft, Expense, FinanceSettings } from './models/finance.model.js';
import { FinanceInputError, invoiceInput, expenseInput, settingsInput } from './models/finance-validation.js';
const app = express();
const port = Number(process.env['PORT'] ?? 3000);
app.use(cors());
app.use(express.json({ limit: '8mb' }));
const adminEmail = process.env['ADMIN_EMAIL'];
const adminPassword = process.env['ADMIN_PASSWORD'];
const adminToken = crypto.randomBytes(32).toString('hex');
const requireAdmin = (request, response, next) => { if (request.headers.authorization === `Bearer ${adminToken}`)
    next();
else
    response.status(401).json({ message: 'Acceso no autorizado.' }); };
app.post('/api/auth/login', (request, response) => { if (adminEmail && adminPassword && request.body?.email === adminEmail && request.body?.password === adminPassword)
    response.json({ token: adminToken });
else
    response.status(401).json({ message: 'Credenciales incorrectas.' }); });
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
    const items = await MenuItem.find()
        .sort({ category: 1, subcategory: 1, order: 1 })
        .lean();
    response.json(items);
});
app.get('/api/daily-menu', async (_request, response) => {
    const menu = await DailyMenu.findOne().lean();
    response.json(menu ?? { date: new Date().toISOString().slice(0, 10), starters: ['', '', ''], mains: ['', '', ''], dessert: '', price: '13,50€' });
});
app.put('/api/admin/daily-menu', requireAdmin, async (request, response) => {
    const { dessert: _dessert, ...menuData } = request.body ?? {};
    const menu = await DailyMenu.findOneAndUpdate({}, { $set: { ...menuData, price: '13,50€' }, $unset: { dessert: 1 } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).lean();
    response.json(menu);
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
app.use('/api/admin/table-orders', requireAdmin, tableOrders);
// Las reservas manuales solo están disponibles para administración.
const reservations = express.Router();
reservations.use(requireAdmin);
reservations.use((_req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ message: 'Base de datos no disponible.' });
        return;
    }
    next();
});
reservations.get('/', async (_req, res) => {
    res.json(await Reservation.find().sort({ date: 1, time: 1, createdAt: 1 }).lean());
});
reservations.post('/', async (req, res) => {
    let input;
    try {
        input = reservationInput(req.body);
    }
    catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : 'Reserva no válida.' });
        return;
    }
    res.status(201).json(await Reservation.create(input));
});
reservations.use((_error, _req, res, _next) => {
    res.status(500).json({ message: 'No se pudo completar la operación. Vuelve a intentarlo.' });
});
app.use('/api/admin/reservations', reservations);
// La gestión financiera es privada y nunca se publica en la API de la carta.
const finance = express.Router();
finance.use(requireAdmin);
finance.use((_req, res, next) => { if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Base de datos no disponible.' });
    return;
} next(); });
finance.post('/menu-tax', async (req, res) => {
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
    const rate = req.body?.taxRate;
    if (category.length > 100 || typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 100)
        throw new FinanceInputError('Selecciona una categoría y un tipo de IVA válido.');
    const result = await MenuItem.updateMany(category ? { category } : {}, { $set: { taxRate: rate } }, { runValidators: true });
    res.json({ updated: result.matchedCount });
});
finance.get('/settings', async (_req, res) => { res.json(await FinanceSettings.findById('restaurant').lean() ?? {}); });
finance.put('/settings', async (req, res) => { res.json(await FinanceSettings.findByIdAndUpdate('restaurant', { $set: settingsInput(req.body) }, { upsert: true, new: true, runValidators: true }).lean()); });
// Las comandas cerradas son la fuente única del recibo y de los ingresos registrados.
finance.get('/receipts', async (req, res) => {
    const { start, end } = receiptRange(req.query['from'], req.query['to']);
    const rows = await TableOrder.find({ status: 'closed', 'lines.0': { $exists: true }, closedAt: { $exists: true }, $expr: { $and: [
                { $gte: [{ $dateToString: { date: '$closedAt', format: '%Y-%m-%d', timezone: 'Europe/Madrid' } }, start] },
                { $lte: [{ $dateToString: { date: '$closedAt', format: '%Y-%m-%d', timezone: 'Europe/Madrid' } }, end] }
            ] } }).sort({ closedAt: -1 }).lean();
    res.json(rows);
});
finance.post('/receipts/:id/invoice', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
        throw new FinanceInputError('Recibo no válido.');
    const receipt = await TableOrder.findOne({ _id: req.params.id, status: 'closed' }).lean();
    if (!receipt) {
        res.status(404).json({ message: 'Recibo no encontrado.' });
        return;
    }
    const input = receiptInvoiceInput(req.body, receipt);
    // El vínculo único impide crear dos facturas para el mismo recibo.
    const draft = await InvoiceDraft.findOneAndUpdate({ sourceOrderId: String(receipt._id) }, { $set: input }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).lean();
    res.json(draft);
});
finance.get('/invoices', async (_req, res) => { res.json(await InvoiceDraft.find().sort({ date: -1, createdAt: -1 }).lean()); });
finance.post('/invoices', async (req, res) => { res.status(201).json(await InvoiceDraft.create(invoiceInput(req.body))); });
finance.put('/invoices/:id', async (req, res) => { if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Identificador no válido.' });
    return;
} if (await InvoiceDraft.exists({ _id: req.params.id, sourceOrderId: { $exists: true } })) {
    res.status(409).json({ message: 'Modifica esta factura desde su recibo para conservar los importes originales.' });
    return;
} const doc = await InvoiceDraft.findByIdAndUpdate(req.params.id, { $set: invoiceInput(req.body) }, { new: true, runValidators: true }); if (!doc) {
    res.status(404).json({ message: 'Borrador no encontrado.' });
    return;
} res.json(doc); });
finance.get('/expenses/:id/attachment', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
        throw new FinanceInputError('Identificador no válido.');
    const expense = await Expense.findById(req.params.id).select('+attachment').lean();
    if (!expense?.attachment?.data) {
        res.status(404).json({ message: 'Justificante no encontrado.' });
        return;
    }
    res.setHeader('Content-Type', expense.attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(expense.attachmentName || 'justificante'));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(Buffer.from(expense.attachment.data, 'base64'));
});
finance.get('/expenses', async (_req, res) => { res.json(await Expense.find().sort({ date: -1, createdAt: -1 }).lean()); });
finance.post('/expenses', async (req, res) => { const expense = await Expense.create({ ...expenseInput(req.body), ...expenseAttachment(req.body) }); const { attachment: _attachment, ...result } = expense.toObject(); res.status(201).json(result); });
finance.put('/expenses/:id', async (req, res) => { if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Identificador no válido.' });
    return;
} const doc = await Expense.findByIdAndUpdate(req.params.id, { $set: { ...expenseInput(req.body), ...expenseAttachment(req.body) } }, { new: true, runValidators: true }); if (!doc) {
    res.status(404).json({ message: 'Gasto no encontrado.' });
    return;
} res.json(doc); });
finance.patch('/:kind/:id/archive', async (req, res) => { if (!['invoices', 'expenses'].includes(req.params.kind) || !mongoose.isValidObjectId(req.params.id) || typeof req.body?.archived !== 'boolean') {
    res.status(400).json({ message: 'Solicitud no válida.' });
    return;
} const doc = req.params.kind === 'invoices' ? await InvoiceDraft.findByIdAndUpdate(req.params.id, { $set: { archived: req.body.archived } }, { new: true }) : await Expense.findByIdAndUpdate(req.params.id, { $set: { archived: req.body.archived } }, { new: true }); if (!doc) {
    res.status(404).json({ message: 'Registro no encontrado.' });
    return;
} res.json(doc); });
finance.use((error, _req, res, _next) => { if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
    res.status(409).json({ message: 'El recibo ya tiene una factura. Actualiza los datos e inténtalo de nuevo.' });
    return;
} if (error instanceof FinanceInputError || error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: error.message });
    return;
} console.error('Error de gestión financiera', error instanceof Error ? error.name : 'Error'); res.status(500).json({ message: 'No se pudo completar la operación. Vuelve a intentarlo.' }); });
app.use('/api/admin/finance', finance);
async function start() {
    const mongoUri = process.env['MONGODB_URI'];
    if (mongoUri) {
        await mongoose.connect(mongoUri);
        await MenuItem.updateOne({ name: 'Ceviche de pescado con chicharrón de pescado y chaufa de marisco', category: 'Platos Combinados' }, { $setOnInsert: {
                name: 'Ceviche de pescado con chicharrón de pescado y chaufa de marisco',
                category: 'Platos Combinados', subcategory: '', price: 33,
                allergens: ['Pescado', 'Lacteos', 'Crustaceos', 'Soja', 'Gluten', 'Huevos'],
                image: 'trio_ceviche_chicharron_chaufa.png',
                description: 'Trío peruano que reúne ceviche de pescado, chicharrón dorado y chaufa de mariscos, acompañado de una combinación de sabores frescos, crujientes y caseros.',
                order: 1003, active: true
            } }, { upsert: true });
        // Espera al índice que evita comandas abiertas duplicadas por mesa.
        await TableOrder.init();
        await InvoiceDraft.init();
        console.log('Conectado a MongoDB');
    }
    else {
        console.log('MONGODB_URI no configurada: servidor iniciado en modo preparación');
    }
    app.listen(port, () => {
        console.log(`API de Jofemar disponible en http://localhost:${port}`);
    });
}
start().catch((error) => {
    console.error('No se pudo iniciar la API', error);
    process.exit(1);
});
