import { FinanceInputError, text, date, number } from './finance-validation.js';
export function receiptRange(from: unknown, to: unknown) {
  const start = date(from), end = date(to);
  if (start > end) throw new FinanceInputError('La fecha inicial debe ser anterior o igual a la final.');
  return { start, end };
}
interface ReceiptLine { name: string; quantity: number; unitPriceCents: number; }
export function receiptInvoiceInput(body: any, receipt: { lines: ReceiptLine[]; totalCents: number; closedAt?: Date | null }) {
  if (!receipt.lines.length) throw new FinanceInputError('Una comanda vacía no puede convertirse en factura.');
  if (!Array.isArray(body?.taxRates) || body.taxRates.length !== receipt.lines.length) throw new FinanceInputError('Selecciona el impuesto de cada producto.');
  let subtotalCents = 0, taxCents = 0;
  const lines = receipt.lines.map((line, index) => {
    const taxRate = number(body.taxRates[index], 'impuesto', 0, 100);
    const grossCents = line.unitPriceCents * line.quantity;
    const baseCents = Math.round(grossCents / (1 + taxRate / 100));
    const lineTaxCents = grossCents - baseCents;
    subtotalCents += baseCents; taxCents += lineTaxCents;
    return { description: line.name, quantity: line.quantity, unitPrice: baseCents / 100 / line.quantity, taxRate, baseCents, taxCents: lineTaxCents, grossCents };
  });
  if (subtotalCents + taxCents !== receipt.totalCents) throw new FinanceInputError('El total de la comanda no coincide con sus productos.');
  return {
    clientName: text(body.clientName, 'nombre del cliente', 200, true),
    clientTaxId: text(body.clientTaxId, 'NIF del cliente', 40, true),
    clientAddress: text(body.clientAddress, 'domicilio del cliente', 500, true),
    date: date(body.date), notes: text(body.notes, 'notas', 2000),
    lines, subtotalCents, taxCents, totalCents: receipt.totalCents
  };
}
