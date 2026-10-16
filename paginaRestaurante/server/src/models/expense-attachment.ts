import { FinanceInputError } from './finance-validation.js';
export function expenseAttachment(body: any) {
  if (body?.attachment == null) return {};
  const { name, mimeType, data } = body.attachment;
  if (typeof name !== 'string' || !name.trim() || name.length > 200 || typeof data !== 'string' || data.length > 2800000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) throw new FinanceInputError('Justificante no válido. Máximo 2 MB.');
  const bytes = Buffer.from(data, 'base64');
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new FinanceInputError('El justificante debe ocupar como máximo 2 MB.');
  const valid = mimeType === 'application/pdf' ? bytes.subarray(0,5).toString() === '%PDF-' : mimeType === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : mimeType === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!valid) throw new FinanceInputError('Adjunta un PDF, JPG o PNG válido.');
  return { attachmentName: name.trim(), attachment: { mimeType, data } };
}
