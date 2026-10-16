export class OrderInputError extends Error {}
export interface OrderLine { productId: string; name: string; unitPriceCents: number; quantity: number; notes: string; taxRate?: number | null; }
export interface ProductSnapshot { _id: unknown; name: string; price: number; active?: boolean; taxRate?: number | null; }
const text = (value: unknown, max: number, required = false): string => {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new OrderInputError('Revisa los campos de la comanda.');
  return value.trim();
};
export function orderInput(body: unknown) {
  const data = body as Record<string, unknown> | null;
  if (!data || !Number.isSafeInteger(data.guests) || Number(data.guests) < 1 || Number(data.guests) > 1000 || !Array.isArray(data.lines) || data.lines.length > 100) throw new OrderInputError('Introduce entre 1 y 1000 comensales y un máximo de 100 productos.');
  const seen = new Set<string>();
  const lines = data.lines.map((line: unknown) => {
    const row = line as Record<string, unknown> | null;
    if (!row || typeof row.productId !== 'string' || !/^[a-f0-9]{24}$/i.test(row.productId) || !Number.isSafeInteger(row.quantity) || Number(row.quantity) < 1 || Number(row.quantity) > 1000) throw new OrderInputError('Revisa los productos y sus cantidades (entre 1 y 1000).');
    const productId = row.productId.toLowerCase();
    if (seen.has(productId)) throw new OrderInputError('Agrupa las cantidades de un mismo producto.');
    seen.add(productId);
    return { productId, quantity: Number(row.quantity), notes: text(row.notes ?? '', 300) };
  });
  return { tableName: text(data.tableName, 40, true), guests: Number(data.guests), notes: text(data.notes ?? '', 1000), lines };
}
// Los importes proceden de la carta o del precio ya guardado, nunca del navegador.
export function priceOrder(lines: ReturnType<typeof orderInput>['lines'], products: ProductSnapshot[], previous: OrderLine[] = []) {
  const priced = lines.map(line => {
    const saved = previous.find(row => row.productId === line.productId);
    if (saved) return { ...line, name: saved.name, unitPriceCents: saved.unitPriceCents, taxRate: saved.taxRate ?? null };
    const product = products.find(row => String(row._id) === line.productId && row.active !== false);
    if (!product || !Number.isFinite(product.price) || product.price < 0 || product.price > 1000000) throw new OrderInputError('Un producto ya no está disponible. Actualiza la carta antes de añadirlo.');
    return { ...line, name: product.name, unitPriceCents: Math.round(product.price * 100), taxRate: product.taxRate ?? null };
  });
  const totalCents = priced.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0);
  if (!Number.isSafeInteger(totalCents)) throw new OrderInputError('El importe de la comanda es demasiado alto.');
  return { lines: priced, totalCents };
}
export function orderVersion(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new OrderInputError('La versión de la comanda no es válida. Vuelve a abrirla.');
  return value;
}
