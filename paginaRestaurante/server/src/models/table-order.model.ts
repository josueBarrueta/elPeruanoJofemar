import { Schema, model } from 'mongoose';
const lineSchema = new Schema({
  productId: { type: String, required: true }, name: { type: String, required: true },
  unitPriceCents: { type: Number, required: true, min: 0 }, quantity: { type: Number, required: true, min: 1 },
  notes: { type: String, default: '', maxlength: 300 }
}, { _id: false });
const tableOrderSchema = new Schema({
  tableName: { type: String, required: true, maxlength: 40 },
  tableKey: { type: String, required: true },
  guests: { type: Number, required: true, min: 1, max: 1000 },
  notes: { type: String, default: '', maxlength: 1000 },
  lines: { type: [lineSchema], default: [] }, totalCents: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['open', 'closed'], default: 'open', required: true },
  closedAt: { type: Date }, revision: { type: Number, default: 0, required: true }
}, { timestamps: true });
// Una sola comanda abierta por mesa, incluso si dos tablets la abren a la vez.
tableOrderSchema.index({ tableKey: 1 }, { unique: true, partialFilterExpression: { status: 'open' } });
tableOrderSchema.index({ status: 1, createdAt: -1 });
export const TableOrder = model('TableOrder', tableOrderSchema);
