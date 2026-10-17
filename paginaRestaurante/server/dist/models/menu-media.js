import { createHash } from 'node:crypto';
import { Router } from 'express';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { MenuItem } from './menu-item.model.js';
// Keep image decoding within the small Render instance's memory/CPU budget.
sharp.cache({ memory: 16, files: 0, items: 16 });
sharp.concurrency(1);
let imageQueue = Promise.resolve();
const apiOrigin = (process.env['PUBLIC_API_URL'] || 'https://elperuanojofemar.onrender.com').replace(/\/$/, '');
const imagePath = '/api/menu-images/';
const fields = ['name', 'category', 'subcategory', 'price', 'taxRate', 'allergens', 'imagePosition', 'imageZoom', 'description', 'order', 'active', 'createdAt', 'updatedAt'];
// MongoDB replaces the embedded photo before sending documents over the network.
export async function listMenuItems(id) {
    const projection = Object.fromEntries(fields.map(field => [field, 1]));
    projection['image'] = { $cond: [
            { $regexMatch: { input: { $ifNull: ['$image', ''] }, regex: '^data:image/' } },
            { $concat: [apiOrigin + imagePath, { $toString: '$_id' }, '?v=', { $convert: { input: '$updatedAt', to: 'string', onNull: 'original' } }] },
            '$image'
        ] };
    return MenuItem.aggregate([...(id ? [{ $match: { _id: new mongoose.Types.ObjectId(id) } }] : []), { $sort: { category: 1, subcategory: 1, order: 1 } }, { $project: projection }]).option({ maxTimeMS: 10000 });
}
// Editing a price or the crop must not replace the original photo with its preview URL.
export function menuPatch(body, id) {
    const patch = { ...body };
    delete patch['_id'];
    delete patch['createdAt'];
    delete patch['updatedAt'];
    delete patch['__v'];
    if (id && typeof patch['image'] === 'string') {
        try {
            const url = new URL(patch['image']);
            if (url.origin === new URL(apiOrigin).origin && url.pathname === imagePath + id)
                delete patch['image'];
        }
        catch { /* Local asset names and uploaded data URLs are kept as supplied. */ }
    }
    return patch;
}
const cache = new Map();
let cachedBytes = 0;
const maxCacheBytes = 16 * 1024 * 1024;
async function decodeMenuImage(source) {
    const match = /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(source);
    if (!match)
        throw new Error('Formato de foto no compatible');
    const input = Buffer.from(match[1], 'base64');
    return sharp(input, { limitInputPixels: 40000000 }).rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 }).toBuffer();
}
export function optimizeMenuImage(source) {
    const task = imageQueue.then(() => decodeMenuImage(source));
    imageQueue = task.catch(() => undefined);
    return task;
}
export function createMenuImagesRouter(load = async (id) => MenuItem.findById(id).select('image updatedAt').maxTimeMS(10000).lean()) {
    const router = Router();
    router.get('/:id', async (request, response) => {
        if (!mongoose.isValidObjectId(request.params.id)) {
            response.status(400).end();
            return;
        }
        // Only cache exact versioned URLs. An unversioned request always checks MongoDB.
        const version = typeof request.query['v'] === 'string' ? request.query['v'] : '';
        const key = request.params.id + ':' + version;
        let result = version ? cache.get(key) : undefined;
        try {
            if (!result) {
                const item = await load(request.params.id);
                if (!item?.image?.startsWith('data:image/')) {
                    response.status(404).end();
                    return;
                }
                const bytes = await optimizeMenuImage(item.image);
                result = { bytes, etag: '"' + createHash('sha256').update(bytes).digest('hex') + '"' };
                const actualVersion = item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt ?? 'original');
                if (version && version === actualVersion && bytes.length <= maxCacheBytes) {
                    while (cachedBytes + bytes.length > maxCacheBytes && cache.size) {
                        const oldest = cache.keys().next().value;
                        cachedBytes -= cache.get(oldest).bytes.length;
                        cache.delete(oldest);
                    }
                    const previous = cache.get(key);
                    if (previous)
                        cachedBytes -= previous.bytes.length;
                    cache.set(key, result);
                    cachedBytes += bytes.length;
                }
            }
            response.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=300', 'ETag': result.etag, 'X-Content-Type-Options': 'nosniff' });
            if (request.headers['if-none-match'] === result.etag) {
                response.status(304).end();
                return;
            }
            response.send(result.bytes);
        }
        catch (error) {
            console.error('No se pudo cargar una foto de la carta', error instanceof Error ? error.name : 'Error');
            response.status(503).set('Cache-Control', 'no-store').end();
        }
    });
    return router;
}
