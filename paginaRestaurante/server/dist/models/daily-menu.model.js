import { Schema, model } from 'mongoose';
const dailyMenuSchema = new Schema({
    date: { type: String, required: true },
    starters: { type: [String], required: true },
    mains: { type: [String], required: true },
    dessert: { type: String, default: '' },
    price: { type: String, default: '13,50€' }
}, { timestamps: true });
export const DailyMenu = model('DailyMenu', dailyMenuSchema);
