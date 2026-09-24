import 'dotenv/config';
import mongoose from 'mongoose';
import { MenuItem } from './models/menu-item.model.js';
import { HomeComponent } from '../../src/app/home/home.component.ts';
function flattenCategories(categories, parent) {
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
async function seed() {
    const mongoUri = process.env['MONGODB_URI'];
    if (!mongoUri)
        throw new Error('Configura MONGODB_URI antes de ejecutar el importador.');
    await mongoose.connect(mongoUri);
    const home = new HomeComponent();
    const source = home.menuCategories;
    const items = flattenCategories(source).map((item) => ({ ...item, active: true }));
    await MenuItem.deleteMany({});
    await MenuItem.insertMany(items);
    console.log(`Importados ${items.length} platos y bebidas.`);
    await mongoose.disconnect();
}
seed().catch((error) => {
    console.error('No se pudo importar la carta', error);
    process.exit(1);
});
