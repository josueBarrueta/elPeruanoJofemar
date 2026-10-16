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
  private restaurantSchema = this.document.getElementById('restaurant-schema')?.textContent || '';
  update(path: string) {
    const privatePage = /^\/(admin|login)(\/|$)/.test(path);
    const reviews = path === '/resenas';
    const title = privatePage ? 'Administración | El Peruano Jofemar'
      : reviews ? 'Opiniones de El Peruano Jofemar | Restaurante peruano en Valencia' : homeTitle;
    const description = privatePage ? 'Acceso privado a la administración de El Peruano Jofemar.'
      : reviews ? 'Lee las opiniones de clientes de El Peruano Jofemar, restaurante peruano en Valencia. Consulta nuestra carta, ubicación y cómo reservar.' : homeDescription;
    // Legacy category routes show the same homepage; consolidate them into its canonical URL.
    const canonicalUrl = `${origin}${reviews ? '/resenas' : '/'}`;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: privatePage ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' });
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
    if (!privatePage && !reviews && this.restaurantSchema) {
      const script = this.document.createElement('script');
      script.id = 'restaurant-schema'; script.type = 'application/ld+json'; script.textContent = this.restaurantSchema;
      this.document.head.appendChild(script);
    }
  }
}
