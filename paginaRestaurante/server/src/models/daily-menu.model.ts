import { Schema, model } from 'mongoose';

export interface DailyMenuDocument {
  date: string;
  starters: string[];
  mains: string[];
  dessert: string;
  price: string;
}

const dailyMenuSchema = new Schema<DailyMenuDocument>({
  date: { type: String, required: true },
  starters: { type: [String], required: true },
  mains: { type: [String], required: true },
  dessert: { type: String, default: '' },
  price: { type: String, default: '13,50€' }
}, { timestamps: true });

export const DailyMenu = model<DailyMenuDocument>('DailyMenu', dailyMenuSchema);
