import { Schema, model } from 'mongoose';

export interface MenuItemDocument {
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  allergens: string[];
  image?: string;
  imagePosition?: string;
  imageZoom?: number;
  description?: string;
  order: number;
  active: boolean;
}

const menuItemSchema = new Schema<MenuItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    subcategory: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    allergens: { type: [String], default: [] },
    image: { type: String, trim: true },
    imagePosition: { type: String, trim: true, default: '50% 50%' },
    imageZoom: { type: Number, min: 1, max: 3, default: 1 },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, subcategory: 1, order: 1 });

export const MenuItem = model<MenuItemDocument>('MenuItem', menuItemSchema);
