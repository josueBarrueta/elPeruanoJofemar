import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function metadata(html, title, description, canonical, indexable) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(/(<meta\b[^>]*(?:name|property)="(?:description|og:description|twitter:description)"[^>]*content=")[^"]*(")/g, `$1${description}$2`);
  html = html.replace(/(<meta\b[^>]*(?:name|property)="(?:og:title|twitter:title)"[^>]*content=")[^"]*(")/g, `$1${title}$2`);
  html = html.replace(/<script\b[^>]*id="restaurant-schema"[^>]*>[\s\S]*?<\/script>/, '');
  if (indexable) {
    html = html.replace(/(<link\b[^>]*rel="canonical"[^>]*href=")[^"]*(")/g, `$1${canonical}$2`);
    html = html.replace(/(<meta\b[^>]*property="og:url"[^>]*content=")[^"]*(")/g, `$1${canonical}$2`);
  } else {
    html = html.replace(/<link\b[^>]*rel="canonical"[^>]*>/g, '');
    html = html.replace(/<meta\b[^>]*property="og:url"[^>]*>/g, '');
    html = html.replace(/(<meta\b[^>]*name="robots"[^>]*content=")[^"]*(")/g, '$1noindex, nofollow$2');
  }
  return html;
}

// Each known route gets a real file on GitHub Pages rather than relying on its HTTP 404 SPA fallback.
export function preparePages(output) {
  const root = resolve(output);
  const source = readFileSync(resolve(root, 'index.html'), 'utf8');
  if (!/<base href="\/"/.test(source) || !/rel="canonical"/.test(source) || !/name="robots"/.test(source)) {
    throw new Error('The built homepage is missing required SEO metadata or the root base URL.');
  }
  for (const route of ['login', 'admin']) {
    const html = metadata(source, 'Administración | El Peruano Jofemar', 'Acceso privado a la administración de El Peruano Jofemar.', '', false)
      .replace(/<noscript>[\s\S]*?<\/noscript>/, '<noscript><p>Activa JavaScript para acceder a la administración.</p></noscript>');
    mkdirSync(resolve(root, route), { recursive: true });
    writeFileSync(resolve(root, route, 'index.html'), html);
  }
  const menu = metadata(source, 'Carta de comida peruana en Valencia | El Peruano Jofemar', 'Consulta la carta de El Peruano Jofemar: platos peruanos, precios y alérgenos. Estamos en Calle Marqués de Zenete, 17, Valencia.', 'https://elperuanojofemar.com/carta/', true)
    .replace(/<noscript>[\s\S]*?<\/noscript>/, '<noscript><main><h1>Carta de El Peruano Jofemar</h1><p>Activa JavaScript para consultar los platos y precios actualizados. También puedes llamar al <a href="tel:+34606790925">606 790 925</a>.</p><a href="/">Volver al restaurante</a></main></noscript>');
  mkdirSync(resolve(root, 'carta'), { recursive: true });
  writeFileSync(resolve(root, 'carta', 'index.html'), menu);
  // Unknown paths remain HTTP 404 and must never advertise the homepage as indexable.
  const fallback = metadata(source, 'Página no encontrada | El Peruano Jofemar', 'La página solicitada no existe.', '', false)
    .replace(/<noscript>[\s\S]*?<\/noscript>/, '<noscript><main><h1>Página no encontrada</h1><a href="/">Volver al restaurante</a></main></noscript>');
  writeFileSync(resolve(root, '404.html'), fallback);
  // Prevent Jekyll transformations and preserve files beginning with an underscore.
  writeFileSync(resolve(root, '.nojekyll'), '');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/prepare-pages.mjs <browser-output-directory>');
  preparePages(process.argv[2]);
}
