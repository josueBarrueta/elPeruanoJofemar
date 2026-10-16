export class FinanceInputError extends Error {
}
const fail = (message) => { throw new FinanceInputError(message); };
export function text(value, label, max = 500, required = false) { if (value === undefined || value === null)
    return required ? fail(`Completa ${label}.`) : ''; if (typeof value !== 'string')
    return fail(`${label}: texto no válido.`); const result = value.trim(); if (result.length > max || required && !result)
    return fail(`${label}: valor no válido.`); return result; }
export function date(value) { const result = text(value, 'fecha', 10, true); if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result + 'T12:00:00Z')) || new Date(result + 'T12:00:00Z').toISOString().slice(0, 10) !== result)
    return fail('Fecha no válida.'); return result; }
export function number(value, label, min, max) { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    return fail(`${label}: número no válido.`); return value; }
export function invoiceInput(body) {
    if (!body || !Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 100)
        return fail('Añade entre 1 y 100 conceptos.');
    const lines = body.lines.map((line) => ({ description: text(line?.description, 'concepto', 300, true), quantity: number(line?.quantity, 'cantidad', 0.001, 100000), unitPrice: number(line?.unitPrice, 'precio', 0, 1000000), taxRate: number(line?.taxRate, 'impuesto', 0, 100) }));
    let subtotalCents = 0, taxCents = 0;
    for (const line of lines) {
        const base = Math.round(line.quantity * line.unitPrice * 100);
        subtotalCents += base;
        taxCents += Math.round(base * line.taxRate / 100);
    }
    if (subtotalCents + taxCents > 1000000000)
        return fail('El importe supera el límite permitido.');
    return { clientName: text(body.clientName, 'cliente', 200, true), clientTaxId: text(body.clientTaxId, 'NIF del cliente', 40), clientAddress: text(body.clientAddress, 'domicilio del cliente', 500), date: date(body.date), notes: text(body.notes, 'notas', 2000), lines, subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
export function expenseInput(body) {
    if (!body)
        return fail('Gasto no válido.');
    const totalCents = Math.round(number(body.total, 'importe', 0.01, 10000000) * 100);
    const taxCents = body.taxAmount == null ? null : Math.round(number(body.taxAmount, 'cuota de IVA', 0, totalCents / 100) * 100);
    return { supplier: text(body.supplier, 'proveedor', 200, true), description: text(body.description, 'concepto', 500, true), category: text(body.category, 'categoría', 80, true), date: date(body.date), totalCents, taxCents, reference: text(body.reference, 'referencia', 100), paid: body.paid === true };
}
export function settingsInput(body) { const result = {}; for (const field of ['legalName', 'taxId', 'address', 'email', 'phone', 'invoiceSeries', 'currentBillingSystem'])
    result[field] = text(body?.[field], field, field === 'address' ? 500 : 200); if (body?.invoiceStartingNumber !== undefined) {
    const n = number(body.invoiceStartingNumber, 'primer número de la serie', 1, 999999999);
    if (!Number.isSafeInteger(n))
        return fail('El primer número debe ser entero.');
    result['invoiceStartingNumber'] = n;
} return result; }
