import type { TableOrder } from './table-orders.service';
import type { ExpenseRecord } from './finance.service';
export function reportTotals(receipts: TableOrder[], expenses: ExpenseRecord[]) {
  let salesCents = 0, paidCents = 0, cashCents = 0, cardCents = 0, baseCents = 0, taxCents = 0, unknownTaxCents = 0;
  const groups = new Map<number, { rate: number; baseCents: number; taxCents: number; grossCents: number }>();
  for (const receipt of receipts) {
    salesCents += receipt.totalCents;
    if (receipt.payment) { paidCents += receipt.totalCents; cashCents += receipt.payment.cashCents; cardCents += receipt.payment.cardCents; }
    for (const line of receipt.lines) {
      const gross = line.quantity * line.unitPriceCents;
      if (typeof line.taxRate !== 'number') { unknownTaxCents += gross; continue; }
      const base = Math.round(gross / (1 + line.taxRate / 100));
      const tax = gross - base;
      baseCents += base; taxCents += tax;
      const group = groups.get(line.taxRate) || { rate: line.taxRate, baseCents: 0, taxCents: 0, grossCents: 0 };
      group.baseCents += base; group.taxCents += tax; group.grossCents += gross; groups.set(line.taxRate, group);
    }
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
