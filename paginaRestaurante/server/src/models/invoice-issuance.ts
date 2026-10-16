import { createHash } from 'node:crypto';
import { FinanceInputError, text, number, date } from './finance-validation.js';
export function issuanceSnapshot(draft: any, settings: any, today: string) {
  const issuer = { legalName: text(settings?.legalName, 'razón social del restaurante', 200, true), taxId: text(settings?.taxId, 'NIF del restaurante', 40, true).toUpperCase(), address: text(settings?.address, 'domicilio fiscal del restaurante', 500, true), email: text(settings?.email, 'correo', 200), phone: text(settings?.phone, 'teléfono', 200) };
  const series = text(settings?.invoiceSeries, 'serie de facturas', 30, true).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._/-]*$/.test(series)) throw new FinanceInputError('La serie admite letras, números, punto, guion y barra.');
  const startingNumber = number(settings?.invoiceStartingNumber ?? 1, 'primer número de la serie', 1, 999999999);
  if (!Number.isSafeInteger(startingNumber)) throw new FinanceInputError('El primer número debe ser entero.');
  const operationDate = date(draft.operationDate || draft.date);
  if (operationDate > today) throw new FinanceInputError('La fecha de la operación no puede ser futura.');
  const clientName = text(draft.clientName, 'nombre del cliente', 200, true), clientTaxId = text(draft.clientTaxId, 'NIF del cliente', 40, true), clientAddress = text(draft.clientAddress, 'domicilio del cliente', 500, true);
  if (!Array.isArray(draft.lines) || !draft.lines.length || draft.lines.length > 100) throw new FinanceInputError('Añade entre 1 y 100 conceptos.');
  let subtotalCents = 0, taxCents = 0;
  const lines = draft.lines.map((line: any) => {
    const description = text(line.description, 'concepto', 300, true), quantity = number(line.quantity, 'cantidad', .001, 100000), unitPrice = number(line.unitPrice, 'precio', 0, 1000000), taxRate = number(line.taxRate, 'IVA', 0, 100);
    const baseCents = line.baseCents ?? Math.round(quantity * unitPrice * 100), lineTax = line.taxCents ?? Math.round(baseCents * taxRate / 100), grossCents = line.grossCents ?? baseCents + lineTax;
    if (![baseCents, lineTax, grossCents].every(n => Number.isSafeInteger(n) && n >= 0) || baseCents + lineTax !== grossCents) throw new FinanceInputError('Los importes de los conceptos no cuadran.');
    subtotalCents += baseCents; taxCents += lineTax;
    return { description, quantity, unitPrice, taxRate, baseCents, taxCents: lineTax, grossCents };
  });
  if (subtotalCents + taxCents <= 0 || subtotalCents + taxCents > 1000000000 || subtotalCents !== draft.subtotalCents || taxCents !== draft.taxCents || subtotalCents + taxCents !== draft.totalCents) throw new FinanceInputError('El total de la factura no es válido. Revisa el borrador.');
  return { issuer, series, startingNumber, operationDate, date: today, clientName, clientTaxId, clientAddress, lines, notes: text(draft.notes, 'notas', 2000), subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
export function emissionRecord(snapshot: ReturnType<typeof issuanceSnapshot>, sequence: number, issuedAt: Date, previousHash: string) {
  const { startingNumber: _starting, series, issuer, ...data } = snapshot;
  const invoiceNumber = `${series}/${String(sequence).padStart(6, '0')}`;
  const record = { ...data, issuerSnapshot: issuer, invoiceNumber, issueSequence: sequence, issuedAt, previousHash, status: 'issued' as const };
  return { ...record, recordHash: createHash('sha256').update(JSON.stringify(record)).digest('hex') };
}
