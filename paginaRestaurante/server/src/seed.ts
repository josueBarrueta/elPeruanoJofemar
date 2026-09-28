import 'dotenv/config';
import '@angular/compiler';
import mongoose from 'mongoose';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { MenuItem } from './models/menu-item.model.js';
import { HomeComponent } from '../../src/app/home/home.component';
import { MenuApiService } from '../../src/app/menu-api.service';

type LegacyItem = {
  name: string;
  price: number;
  allergens: string[];
  image?: string;
  description?: string;
};

type LegacyCategory = {
  title: string;
  items?: LegacyItem[];
  subcategories?: LegacyCategory[];
};

const requestedPrices: Record<string, number> = {
  'leche de tigre': 13.50, 'causa rellena': 8.50, 'causa rellena acevichada': 14.50,
  'papa rellena': 8.50, 'papa a la huancaina': 6.50, 'ocopa': 6.50, 'palta rellena': 8.50,
  'tamal': 6.50, 'anticuchos': 13.00, 'ceviche de pescado': 16.00, 'ceviche mixto': 18.50,
  'chaufa de mariscos': 15.00, 'jalea': 19.50, 'jalea personal': 19.50, 'arroz con mariscos': 16.50,
  'chicharron de pescado': 14.50, 'pescado a lo macho': 16.50, 'tallarin saltado de mariscos': 16.50,
  'chicharron de pescado con ceviche de pescado': 22.50, 'chaufa de mariscos con ceviche de pescado': 25.00,
  'arroz chaufa con tallarin saltado': 22.50, 'arroz con pollo con huancaina y aji de gallina': 25.00,
  'ceviche de pescado con huancaina y arroz con pollo': 22.50, 'chupe de langostinos': 14.50,
  'chupe de langostino': 14.50, 'parihuela': 16.50, 'lomo saltado': 14.50, 'aeropuerto': 13.50,
  'mostrito': 13.50, 'arroz con pollo': 13.50, 'bistec a lo pobre': 12.50, 'arroz chaufa': 12.50,
  'pescado a la chorrillana': 12.00, 'arroz con pato': 16.50, 'tallarin saltado de ternera': 13.50,
  'tallarin verde con bistec': 13.50, 'seco de ternera con frijoles': 14.50,
  'seco de ternera con frijoles y arroz': 14.50, 'super parrillada jofemar': 19.50,
  'pollo broaster': 13.50, 'aji de gallina': 13.50, 'salchipapa': 8.50,
  'tallarines a la huancaina con lomo saltado': 15.00
};

const normalize = (value: string): string => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function flattenCategories(categories: LegacyCategory[], parent?: string): Array<LegacyItem & { category: string; subcategory?: string; order: number }> {
  return categories.flatMap((category, categoryIndex) => {
    const directItems = (category.items ?? []).map((item, itemIndex) => ({
      ...item,
      category: parent ?? category.title,
      subcategory: parent ? category.title : undefined,
      order: categoryIndex * 1000 + itemIndex
    }));

    const nestedItems = category.subcategories
      ? flattenCategories(category.subcategories, parent ?? category.title)
      : [];

    return [...directItems, ...nestedItems];
  });
}

async function seed(): Promise<void> {
  const mongoUri = process.env['MONGODB_URI'];
  if (!mongoUri) throw new Error('Configura MONGODB_URI antes de ejecutar el importador.');

  await mongoose.connect(mongoUri);
  (globalThis as { __JOFEMAR_SEED__?: boolean }).__JOFEMAR_SEED__ = true;
  const injector = createEnvironmentInjector([provideHttpClient(), MenuApiService], undefined as never);
  const home = runInInjectionContext(injector, () => new HomeComponent());
  const source = home.menuCategories as unknown as LegacyCategory[];
  const items = flattenCategories(source).map((item) => {
    const key = normalize(item.name);
    const canonical = key === 'causa acevichada' ? 'causa rellena acevichada' : key;
    const price = requestedPrices[canonical];
    return { ...item, name: canonical === 'causa rellena acevichada' ? 'Causa rellena acevichada' : item.name, price: price ?? item.price, active: price !== undefined || item.category === 'Bebidas' || item.category === 'Postres' };
  });

  const additions: Array<LegacyItem & { category: string; subcategory?: string; order: number; active: boolean }> = [
    { name: 'Arroz con pollo con huancaina y aji de gallina', price: 25.00, allergens: [], image: 'arroz_con_pollo_huancaina_aji_gallina.png', category: 'Platos Combinados', order: 1000, active: true },
    { name: 'Ceviche de pescado con huancaina y arroz con pollo', price: 22.50, allergens: ['Pescado'], image: 'trio_ceviche_huancaina_arroz_pollo.png', category: 'Platos Combinados', order: 1001, active: true },
    { name: 'Tallarines a la huancaina con lomo saltado', price: 15.00, allergens: ['Gluten', 'Lacteos'], image: 'tallarines_huancaina_lomo.png', category: 'Platos Combinados', order: 1002, active: true }
  ];
  items.push(...additions);

  for (const item of items) {
    await MenuItem.updateOne(
      { name: item.name, category: item.category, subcategory: item.subcategory ?? null },
      { $set: item },
      { upsert: true }
    );
  }
  const foodCategories = ['Primer plato o Entradas', 'Pescado y Mariscos', 'Carnes y Pollo', 'Platos Combinados'];
  const visibleFoodNames = items.filter((item) => foodCategories.includes(item.category) && item.active).map((item) => item.name);
  await MenuItem.deleteMany({ category: { $in: foodCategories }, name: { $nin: visibleFoodNames } });
  console.log(`Importados ${items.length} platos y bebidas.`);
  await mongoose.disconnect();
}

seed().catch((error: unknown) => {
  console.error('No se pudo importar la carta', error);
  process.exit(1);
});
