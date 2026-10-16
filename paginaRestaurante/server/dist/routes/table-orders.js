import express from 'express';
import mongoose from 'mongoose';
import { TableOrder } from '../models/table-order.model.js';
import { MenuItem } from '../models/menu-item.model.js';
import { OrderInputError, orderInput, orderVersion, priceOrder } from '../models/table-order-validation.js';
import { paymentInput } from '../models/payment-validation.js';
import { notifyTableOrdersChanged, tableOrderEvents } from './table-order-events.js';
export const tableOrders = express.Router();
tableOrders.use((_req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ message: 'Base de datos no disponible.' });
        return;
    }
    next();
});
tableOrders.get('/events', tableOrderEvents);
tableOrders.get('/', async (req, res) => {
    const status = req.query['status'] === 'closed' ? 'closed' : 'open';
    res.json(await TableOrder.find(status === 'closed' ? { status, 'lines.0': { $exists: true } } : { status }).sort({ createdAt: -1 }).limit(status === 'closed' ? 100 : 1000).lean());
});
tableOrders.post('/', async (req, res) => {
    const input = orderInput(req.body);
    const products = await MenuItem.find({ _id: { $in: input.lines.map(line => line.productId) } }).lean();
    const priced = priceOrder(input.lines, products);
    const order = await TableOrder.create({ ...input, ...priced, tableKey: input.tableName.toLocaleLowerCase('es') });
    notifyTableOrdersChanged();
    res.status(201).json(order);
});
tableOrders.put('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
        throw new OrderInputError('Identificador de comanda no válido.');
    const revision = orderVersion(req.body?.revision);
    const input = orderInput(req.body);
    const existing = await TableOrder.findOne({ _id: req.params.id, status: 'open', revision }).lean();
    if (!existing) {
        res.status(409).json({ message: 'La comanda cambió o se cerró en otro dispositivo. Cierra el formulario y actualiza las mesas.' });
        return;
    }
    const products = await MenuItem.find({ _id: { $in: input.lines.map(line => line.productId) } }).lean();
    const priced = priceOrder(input.lines, products, existing.lines);
    const order = await TableOrder.findOneAndUpdate({ _id: existing._id, revision, status: 'open' }, {
        $set: { ...input, ...priced, tableKey: input.tableName.toLocaleLowerCase('es') }, $inc: { revision: 1 }
    }, { new: true, runValidators: true }).lean();
    if (!order) {
        res.status(409).json({ message: 'La comanda ha cambiado. Cierra el formulario y actualiza las mesas.' });
        return;
    }
    notifyTableOrdersChanged();
    res.json(order);
});
tableOrders.post('/:id/close', (_req, res) => { res.status(409).json({ message: 'Actualiza el panel y utiliza Cobrar y cerrar para registrar la forma de pago.' }); });
tableOrders.post('/:id/checkout', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
        throw new OrderInputError('Identificador de comanda no válido.');
    const revision = orderVersion(req.body?.revision);
    const existing = await TableOrder.findOne({ _id: req.params.id, status: 'open', revision }).lean();
    if (!existing) {
        res.status(409).json({ message: 'La comanda cambió o ya se cerró. Actualiza las mesas antes de cobrar.' });
        return;
    }
    const payment = existing.lines.length ? { ...paymentInput(req.body?.payment, existing.totalCents), paidAt: new Date() } : undefined;
    const order = await TableOrder.findOneAndUpdate({ _id: req.params.id, status: 'open', revision }, {
        $set: { status: 'closed', closedAt: new Date(), ...(payment ? { payment } : {}) }, $inc: { revision: 1 }
    }, { new: true, runValidators: true }).lean();
    if (!order) {
        res.status(409).json({ message: 'La comanda ha cambiado o ya está cerrada. Actualiza las mesas.' });
        return;
    }
    notifyTableOrdersChanged();
    res.json(order);
});
tableOrders.use((error, _req, res, _next) => {
    if (error instanceof OrderInputError || error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        res.status(409).json({ message: 'Esta mesa ya tiene una comanda abierta. Utiliza otro nombre o abre su comanda actual.' });
        return;
    }
    res.status(500).json({ message: 'No se pudo guardar la comanda. Vuelve a intentarlo.' });
});
