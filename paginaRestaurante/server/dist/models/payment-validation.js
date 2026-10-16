import { OrderInputError } from './table-order-validation.js';
function cents(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000000000 || Math.abs(value * 100 - Math.round(value * 100)) > .00001)
        throw new OrderInputError(`${label}: introduce un importe válido con hasta dos decimales.`);
    return Math.round(value * 100);
}
export function paymentInput(body, totalCents) {
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0)
        throw new OrderInputError('La comanda debe tener un total mayor que cero para registrar un cobro.');
    const method = body?.method;
    if (!['cash', 'card', 'mixed'].includes(method))
        throw new OrderInputError('Selecciona efectivo, tarjeta o pago dividido.');
    let cashCents = 0, cardCents = 0, tenderedCents = 0;
    if (method === 'cash') {
        cashCents = totalCents;
        tenderedCents = cents(body.tendered, 'Efectivo recibido');
        if (tenderedCents < cashCents)
            throw new OrderInputError('El efectivo recibido no cubre el total.');
    }
    else if (method === 'card')
        cardCents = totalCents;
    else {
        cashCents = cents(body.cash, 'Parte en efectivo');
        if (cashCents <= 0 || cashCents >= totalCents)
            throw new OrderInputError('En un pago dividido, la parte en efectivo debe ser mayor que cero y menor que el total.');
        tenderedCents = cashCents;
        cardCents = totalCents - cashCents;
    }
    return { method, cashCents, cardCents, tenderedCents, changeCents: tenderedCents - cashCents };
}
