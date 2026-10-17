import { RESTAURANT_SCHEMA } from './restaurant-schema';
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const origin = 'https://elperuanojofemar.com';
const homeTitle = 'El Peruano Jofemar | Restaurante peruano en Valencia';
const homeDescription = 'Restaurante peruano en Valencia. Descubre nuestra carta y menú del día en Calle Marqués de Zenete, 17. Consulta horarios y reserva por WhatsApp o teléfono.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private document = inject(DOCUMENT);
  private title = inject(Title);
  private meta = inject(Meta);
  private restaurantSchema = JSON.stringify(RESTAURANT_SCHEMA);
  update(path: string) {
    path = path.replace(/\/+$/, '') || '/';
    const privatePage = /^\/(admin|login)(\/|$)/.test(path);
    const menuPage = path === '/carta';
    const indexable = path === '/' || menuPage;
    const title = privatePage ? 'Administración | El Peruano Jofemar'
      : menuPage ? 'Carta de comida peruana en Valencia | El Peruano Jofemar' : homeTitle;
    const description = privatePage ? 'Acceso privado a la administración de El Peruano Jofemar.'
      : menuPage ? 'Consulta la carta de El Peruano Jofemar: platos peruanos, precios y alérgenos. Estamos en Calle Marqués de Zenete, 17, Valencia.' : homeDescription;
    // Legacy category routes show the same homepage; consolidate them into its canonical URL.
    const canonicalUrl = menuPage ? `${origin}/carta/` : `${origin}/`;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: privatePage ? 'noindex, nofollow' : indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow' });
    for (const [property, content] of Object.entries({ 'og:title': title, 'og:description': description, 'og:url': canonicalUrl })) {
      this.meta.updateTag({ property, content });
    }
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.document.querySelector('link[rel="canonical"]')?.remove();
    if (!privatePage) {
      const canonical = this.document.createElement('link');
      canonical.rel = 'canonical'; canonical.href = canonicalUrl; this.document.head.appendChild(canonical);
    }
    this.document.getElementById('restaurant-schema')?.remove();
    if (path === '/' && this.restaurantSchema) {
      const script = this.document.createElement('script');
      script.id = 'restaurant-schema'; script.type = 'application/ld+json'; script.textContent = this.restaurantSchema;
      this.document.head.appendChild(script);
    }
  }
}
