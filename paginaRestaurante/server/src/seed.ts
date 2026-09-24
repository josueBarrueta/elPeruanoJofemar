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
  const items = flattenCategories(source).map((item) => ({ ...item, active: true }));

  for (const item of items) {
    await MenuItem.updateOne(
      { name: item.name, category: item.category, subcategory: item.subcategory ?? null },
      { $set: item },
      { upsert: true }
    );
  }
  console.log(`Importados ${items.length} platos y bebidas.`);
  await mongoose.disconnect();
}

seed().catch((error: unknown) => {
  console.error('No se pudo importar la carta', error);
  process.exit(1);
});
