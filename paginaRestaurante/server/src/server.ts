import { notifyTableOrdersChanged, createLiveEvents } from './routes/table-order-events.js';
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { createAdminAuth } from './auth/admin-auth.js';
import { TableOrder } from './models/table-order.model.js';
import { invoiceIssuance } from './routes/invoice-issuance.js';
import { InvoiceCounter, InvoiceIssueEvent } from './models/invoice-counter.model.js';
import { expenseAttachment } from './models/expense-attachment.js';
import { receiptRange, receiptInvoiceInput } from './models/receipt-validation.js';
import { tableOrders } from './routes/table-orders.js';
import { Reservation, reservationInput } from './models/reservation.model.js';
import { MenuItem } from './models/menu-item.model.js';
import { listMenuItems, menuPatch, createMenuImagesRouter } from './models/menu-media.js';
import { DailyMenu } from './models/daily-menu.model.js';
import { InvoiceDraft, Expense, FinanceSettings } from './models/finance.model.js';
import { FinanceInputError, invoiceInput, expenseInput, settingsInput } from './models/finance-validation.js';

const app = express();
const port = Number(process.env['PORT'] ?? 3000);

app.use(cors());
app.use(express.json({ limit: '8mb' }));
const { router: adminAuth, requireAdmin } = createAdminAuth(process.env['ADMIN_EMAIL'], process.env['ADMIN_PASSWORD']);
app.use('/api/auth', adminAuth);

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/menu-images', createMenuImagesRouter());

app.get('/api/menu', async (_request, response) => {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'MongoDB todavía no está conectado.' });
    return;
  }

  const items = await listMenuItems();

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
  const items = await listMenuItems();
  response.json(items);
});

app.post('/api/admin/menu', requireAdmin, async (request, response) => {
  const item = await MenuItem.create(menuPatch(request.body));
  const saved = (await listMenuItems(String(item._id)))[0];
  response.status(201).json(saved);
});

app.patch('/api/admin/menu/:id', requireAdmin, async (request, response) => {
  const item = await MenuItem.findByIdAndUpdate(request.params['id'], menuPatch(request.body, String(request.params['id'])), { new: true, runValidators: true }).select('_id').lean();
  if (!item) {
    response.status(404).json({ message: 'Producto no encontrado.' });
    return;
  }
  const saved = (await listMenuItems(String(item._id)))[0];
  response.json(saved);
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
const reservationEvents = createLiveEvents();
// MongoDB delivers writes to every server instance, including rolling deployments.
let liveWatcher: ReturnType<typeof mongoose.connection.watch> | undefined;
let liveRetry: ReturnType<typeof setTimeout> | undefined;
function watchLiveChanges() {
  if (liveWatcher || mongoose.connection.readyState !== 1) return;
  clearTimeout(liveRetry);
  const watcher = mongoose.connection.watch([{ $match: { 'ns.coll': { $in: [Reservation.collection.name, TableOrder.collection.name] } } }]);
  liveWatcher = watcher;
  const recover = () => {
    if (liveWatcher !== watcher) return;
    liveWatcher = undefined;
    void watcher.close().catch(() => {});
    liveRetry = setTimeout(watchLiveChanges, 5000);
  };
  watcher.on('change', change => {
    if ('ns' in change && 'coll' in change.ns && change.ns.coll === Reservation.collection.name) reservationEvents.notify();
    else notifyTableOrdersChanged();
  });
  watcher.on('error', recover);
  watcher.on('close', recover);
}
mongoose.connection.on('connected', watchLiveChanges);

reservations.use(requireAdmin);
reservations.use((_req, res, next) => {
  if (mongoose.connection.readyState !== 1) { res.status(503).json({ message: 'Base de datos no disponible.' }); return; }
  next();
});
reservations.get('/events', reservationEvents.events);
reservations.get('/', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await Reservation.find().sort({ date: 1, time: 1, createdAt: 1 }).lean());
});
reservations.post('/', async (req, res) => {
  let input;
  try { input = reservationInput(req.body); }
  catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : 'Reserva no válida.' }); return; }
  const reservation = await Reservation.create(input);
  reservationEvents.notify();
  res.status(201).json(reservation);
});
reservations.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Reserva no válida.' }); return; }
  let input;
  try { input = reservationInput(req.body); }
  catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : 'Reserva no válida.' }); return; }
  const revision = req.body?.revision;
  if (!Number.isSafeInteger(revision) || revision < 0) { res.status(400).json({ message: 'Versión de reserva no válida.' }); return; }
  const version = revision === 0 ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] } : { revision };
  const reservation = await Reservation.findOneAndUpdate({ _id: req.params.id, ...version }, {
    $set: input, $inc: { revision: 1 }
  }, { new: true, runValidators: true }).lean();
  if (!reservation) { res.status(409).json({ message: 'Otro camarero ha cambiado esta reserva. Cierra el formulario y vuelve a abrirla para ver los datos actuales.' }); return; }
  reservationEvents.notify();
  res.json(reservation);
});
reservations.use((_error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ message: 'No se pudo completar la operación. Vuelve a intentarlo.' });
});
app.use('/api/admin/reservations', reservations);

// La gestión financiera es privada y nunca se publica en la API de la carta.
const finance = express.Router();
finance.use(requireAdmin);
finance.use((_req,res,next)=>{if(mongoose.connection.readyState!==1){res.status(503).json({message:'Base de datos no disponible.'});return;}next();});
finance.post('/menu-tax', async (req, res) => {
  const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
  const rate = req.body?.taxRate;
  if (category.length > 100 || typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 100) throw new FinanceInputError('Selecciona una categoría y un tipo de IVA válido.');
  const result = await MenuItem.updateMany(category ? { category } : {}, { $set: { taxRate: rate } }, { runValidators: true });
  res.json({ updated: result.matchedCount });
});
finance.get('/settings',async(_req,res)=>{res.json(await FinanceSettings.findById('restaurant').lean() ?? {});});
finance.put('/settings',async(req,res)=>{res.json(await FinanceSettings.findByIdAndUpdate('restaurant',{$set:settingsInput(req.body)},{upsert:true,new:true,runValidators:true}).lean());});
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
  if (!mongoose.isValidObjectId(req.params.id)) throw new FinanceInputError('Recibo no válido.');
  const receipt = await TableOrder.findOne({ _id: req.params.id, status: 'closed' }).lean();
  if (!receipt) { res.status(404).json({ message: 'Recibo no encontrado.' }); return; }
  if(await InvoiceDraft.exists({sourceOrderId:String(receipt._id),status:'issued'})){res.status(409).json({message:'Este recibo ya tiene una factura emitida. Reimprime la factura existente.'});return;}
  const input = receiptInvoiceInput(req.body, receipt);
  // El vínculo único impide crear dos facturas para el mismo recibo.
  const draft = await InvoiceDraft.findOneAndUpdate({ sourceOrderId: String(receipt._id), status: { $ne: 'issued' } }, { $set: input }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).lean();
  res.json(draft);
});
finance.use('/invoices', invoiceIssuance);
finance.get('/invoices',async(_req,res)=>{res.json(await InvoiceDraft.find().sort({date:-1,createdAt:-1}).lean());});
finance.post('/invoices',async(req,res)=>{res.status(201).json(await InvoiceDraft.create(invoiceInput(req.body)));});
finance.put('/invoices/:id',async(req,res)=>{if(!mongoose.isValidObjectId(req.params.id)){res.status(400).json({message:'Identificador no válido.'});return;}if(await InvoiceDraft.exists({_id:req.params.id,status:'issued'})){res.status(409).json({message:'Una factura emitida no se puede editar. Reimprime su versión definitiva.'});return;}if(await InvoiceDraft.exists({_id:req.params.id,sourceOrderId:{$exists:true}})){res.status(409).json({message:'Modifica esta factura desde su recibo para conservar los importes originales.'});return;}const doc=await InvoiceDraft.findOneAndUpdate({_id:req.params.id,status:{$ne:'issued'}},{$set:invoiceInput(req.body)},{new:true,runValidators:true});if(!doc){res.status(404).json({message:'Borrador no encontrado.'});return;}res.json(doc);});
finance.get('/expenses/:id/attachment', async(req,res)=>{
 if(!mongoose.isValidObjectId(req.params.id))throw new FinanceInputError('Identificador no válido.');
 const expense=await Expense.findById(req.params.id).select('+attachment').lean();
 if(!expense?.attachment?.data){res.status(404).json({message:'Justificante no encontrado.'});return;}
 res.setHeader('Content-Type',expense.attachment.mimeType||'application/octet-stream');
 res.setHeader('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(expense.attachmentName||'justificante'));
 res.setHeader('X-Content-Type-Options','nosniff');
 res.send(Buffer.from(expense.attachment.data,'base64'));
});
finance.get('/expenses',async(_req,res)=>{res.json(await Expense.find().sort({date:-1,createdAt:-1}).lean());});
finance.post('/expenses',async(req,res)=>{const expense=await Expense.create({...expenseInput(req.body),...expenseAttachment(req.body)});const {attachment:_attachment,...result}=expense.toObject();res.status(201).json(result);});
finance.put('/expenses/:id',async(req,res)=>{if(!mongoose.isValidObjectId(req.params.id)){res.status(400).json({message:'Identificador no válido.'});return;}const doc=await Expense.findByIdAndUpdate(req.params.id,{$set:{...expenseInput(req.body),...expenseAttachment(req.body)}},{new:true,runValidators:true});if(!doc){res.status(404).json({message:'Gasto no encontrado.'});return;}res.json(doc);});
finance.patch('/:kind/:id/archive',async(req,res)=>{if(!['invoices','expenses'].includes(req.params.kind)||!mongoose.isValidObjectId(req.params.id)||typeof req.body?.archived!=='boolean'){res.status(400).json({message:'Solicitud no válida.'});return;}const doc=req.params.kind==='invoices'?await InvoiceDraft.findOneAndUpdate({_id:req.params.id,status:{$ne:'issued'}},{$set:{archived:req.body.archived}},{new:true}):await Expense.findByIdAndUpdate(req.params.id,{$set:{archived:req.body.archived}},{new:true});if(!doc){res.status(404).json({message:'Registro no encontrado o factura ya emitida. Las emitidas no se pueden archivar.'});return;}res.json(doc);});
finance.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{if(error&&typeof error==='object'&&'code' in error&&error.code===20){res.status(503).json({message:'La emisión necesita transacciones de MongoDB. Utiliza MongoDB Atlas o una base de datos con réplica.'});return;}if(error&&typeof error==='object'&&'code' in error&&error.code===11000){res.status(409).json({message:'La factura o la serie se han actualizado. Actualiza la lista e inténtalo de nuevo. Una factura ya emitida conserva su número.'});return;}if(error instanceof FinanceInputError||error instanceof mongoose.Error.ValidationError){res.status(400).json({message:error.message});return;}console.error('Error de gestión financiera',error instanceof Error?error.name:'Error');res.status(500).json({message:'No se pudo completar la operación. Vuelve a intentarlo.'});});
app.use('/api/admin/finance',finance);

async function start(): Promise<void> {
  const mongoUri = process.env['MONGODB_URI'];

  if (mongoUri) {
    await mongoose.connect(mongoUri);
    await MenuItem.updateOne(
      { name: 'Ceviche de pescado con chicharrón de pescado y chaufa de marisco', category: 'Platos Combinados' },
      { $setOnInsert: {
        name: 'Ceviche de pescado con chicharrón de pescado y chaufa de marisco',
        category: 'Platos Combinados', subcategory: '', price: 33,
        allergens: ['Pescado', 'Lacteos', 'Crustaceos', 'Soja', 'Gluten', 'Huevos'],
        image: 'trio_ceviche_chicharron_chaufa.png',
        description: 'Trío peruano que reúne ceviche de pescado, chicharrón dorado y chaufa de mariscos, acompañado de una combinación de sabores frescos, crujientes y caseros.',
        order: 1003, active: true
      } },
      { upsert: true }
    );
    // Espera al índice que evita comandas abiertas duplicadas por mesa.
    await TableOrder.init();
    await InvoiceDraft.init();
    await InvoiceCounter.init();
    await InvoiceIssueEvent.init();
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
