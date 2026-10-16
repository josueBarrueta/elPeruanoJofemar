import { Schema, model } from 'mongoose';

export function reservationInput(body: unknown) {
  const data = body as Record<string, unknown> | null;
  if (!data || typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 120 ||
      typeof data.guests !== 'number' || !Number.isSafeInteger(data.guests) || data.guests < 1 ||
      typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      !Number.isFinite(Date.parse(data.date)) || new Date(data.date).toISOString().slice(0, 10) !== data.date ||
      typeof data.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) {
    throw new Error('Introduce un nombre, un número entero de comensales mayor que cero y una fecha y hora válidas.');
  }
  return { name: data.name.trim(), guests: data.guests, date: data.date, time: data.time };
}

const reservationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  guests: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  date: { type: String, required: true },
  time: { type: String, required: true }
}, { timestamps: true });
reservationSchema.index({ date: 1, time: 1 });
export const Reservation = model('Reservation', reservationSchema);
