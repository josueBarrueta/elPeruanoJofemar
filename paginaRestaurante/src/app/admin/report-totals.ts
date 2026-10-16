import type { TableOrder } from './table-orders.service';
import type { ExpenseRecord, Invoice } from './finance.service';
export function reportTotals(receipts: TableOrder[], expenses: ExpenseRecord[], invoices: Invoice[] = []) {
  let salesCents = 0, paidCents = 0, cashCents = 0, cardCents = 0, baseCents = 0, taxCents = 0, unknownTaxCents = 0;
  const groups = new Map<number, { rate: number; baseCents: number; taxCents: number; grossCents: number }>();
  const addTax = (rate: number | null | undefined, gross: number, baseOverride?:number, taxOverride?:number) => {
    if (typeof rate !== 'number') { unknownTaxCents += gross; return; }
    const base = baseOverride ?? Math.round(gross / (1 + rate / 100)), tax = taxOverride ?? gross - base;
    baseCents += base; taxCents += tax;
    const group = groups.get(rate) || { rate, baseCents: 0, taxCents: 0, grossCents: 0 };
    group.baseCents += base; group.taxCents += tax; group.grossCents += gross; groups.set(rate, group);
  };
  for (const receipt of receipts) {
    salesCents += receipt.totalCents;
    if (receipt.payment) { paidCents += receipt.totalCents; cashCents += receipt.payment.cashCents; cardCents += receipt.payment.cardCents; }
    const issued = invoices.find(invoice => invoice.status === 'issued' && invoice.sourceOrderId === receipt._id && invoice.totalCents === receipt.totalCents);
    if (issued) for (const line of issued.lines) { const base=line.baseCents ?? Math.round(line.unitPrice*line.quantity*100), tax=line.taxCents ?? Math.round(base*line.taxRate/100); addTax(line.taxRate,line.grossCents ?? base+tax,base,tax); }
    else for (const line of receipt.lines) addTax(line.taxRate,line.quantity*line.unitPriceCents);
  }
  // Las facturas sin recibo son ventas adicionales; las vinculadas ya se contaron arriba.
  for (const invoice of invoices.filter(row => row.status === 'issued' && !row.sourceOrderId)) {
    salesCents += invoice.totalCents || 0;
    for (const line of invoice.lines) {const base=line.baseCents ?? Math.round(line.unitPrice*line.quantity*100), tax=line.taxCents ?? Math.round(base*line.taxRate/100);addTax(line.taxRate,line.grossCents ?? base+tax,base,tax);}
  }
  const expenseCents = expenses.reduce((n, row) => n + row.totalCents, 0);
  const expenseTaxCents = expenses.reduce((n, row) => n + (row.taxCents ?? 0), 0);
  const unknownExpenseTaxCents = expenses.filter(row => row.taxCents == null).reduce((n, row) => n + row.totalCents, 0);
  return { salesCents, paidCents, cashCents, cardCents, unrecordedPaymentCents: salesCents - paidCents, baseCents, taxCents, unknownTaxCents, expenseCents, expenseTaxCents, unknownExpenseTaxCents, groups: [...groups.values()].sort((a,b) => a.rate - b.rate) };
}
export function csvDocument(rows: unknown[][]): string {
  return '\uFEFF' + rows.map(row => row.map(value => '"' + String(value ?? '').replace(/^[\s]*[=+@\-]/,"'$&").replace(/"/g,'""') + '"').join(';')).join('\r\n');
}

export function madridTimestamp(value?: string): string {
  return value ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(value)) : '';
}
