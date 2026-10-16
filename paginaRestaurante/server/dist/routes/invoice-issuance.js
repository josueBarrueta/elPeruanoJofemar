import express from 'express';
import mongoose from 'mongoose';
import { InvoiceDraft, FinanceSettings } from '../models/finance.model.js';
import { InvoiceCounter, InvoiceIssueEvent } from '../models/invoice-counter.model.js';
import { issuanceSnapshot, emissionRecord } from '../models/invoice-issuance.js';
import { FinanceInputError } from '../models/finance-validation.js';
export const invoiceIssuance = express.Router();
invoiceIssuance.post('/:id/issue', async (req, res, next) => {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
        next(new FinanceInputError('Identificador de factura no válido.'));
        return;
    }
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            const draft = await InvoiceDraft.findById(id).session(session).lean();
            if (!draft)
                throw new FinanceInputError('Factura no encontrada.');
            if (draft.status === 'issued') {
                result = draft;
                return;
            }
            if (draft.archived)
                throw new FinanceInputError('Restaura el borrador antes de emitirlo.');
            if (!req.body?.expectedUpdatedAt || new Date(req.body.expectedUpdatedAt).getTime() !== draft.updatedAt.getTime())
                throw new FinanceInputError('El borrador ha cambiado. Actualiza la lista y vuelve a revisarlo antes de emitir.');
            const settings = await FinanceSettings.findById('restaurant').session(session).lean();
            const now = new Date(), today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(now);
            const snapshot = issuanceSnapshot(draft, settings, today), counterKey = JSON.stringify([snapshot.issuer.taxId, snapshot.series]);
            let counter = await InvoiceCounter.findById(counterKey).session(session).lean();
            if (!counter) {
                const [created] = await InvoiceCounter.create([{ _id: counterKey, lastNumber: snapshot.startingNumber - 1, lastHash: '' }], { session });
                counter = { lastNumber: created.lastNumber, lastIssueDate: created.lastIssueDate, lastHash: created.lastHash };
            }
            if (counter.lastIssueDate && counter.lastIssueDate > today)
                throw new FinanceInputError('La serie contiene una fecha posterior. Revisa la configuración de fecha antes de emitir.');
            const sequence = counter.lastNumber + 1;
            if (!Number.isSafeInteger(sequence) || sequence > 999999999)
                throw new FinanceInputError('La serie ha alcanzado su límite de numeración.');
            const record = emissionRecord(snapshot, sequence, now, counter.lastHash || ''), invoiceKey = JSON.stringify([snapshot.issuer.taxId, snapshot.series, sequence]);
            result = await InvoiceDraft.findOneAndUpdate({ _id: id, status: { $ne: 'issued' }, updatedAt: draft.updatedAt }, { $set: { ...record, invoiceKey } }, { new: true, runValidators: true, session }).lean();
            if (!result)
                throw new FinanceInputError('La factura cambió durante la emisión. Actualiza la lista.');
            await InvoiceCounter.updateOne({ _id: counterKey }, { $set: { lastNumber: sequence, lastIssueDate: today, lastHash: record.recordHash } }, { session });
            await InvoiceIssueEvent.create([{ invoiceId: String(id), invoiceNumber: record.invoiceNumber, counterKey, recordHash: record.recordHash, previousHash: record.previousHash, payload: record }], { session });
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
    finally {
        await session.endSession();
    }
});
