// Datos públicos del restaurante, disponibles también al volver desde otra ruta.
export const RESTAURANT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": "https://elperuanojofemar.com/#restaurante",
  "name": "El Peruano Jofemar",
  "url": "https://elperuanojofemar.com/",
  "description": "Restaurante peruano en Valencia. Descubre nuestra carta y menú del día en Calle Marqués de Zenete, 17. Consulta horarios y reserva por WhatsApp o teléfono.",
  "telephone": "+34606790925",
  "servesCuisine": "Peruana",
  "image": [
    "https://elperuanojofemar.com/assets/hero/papa-a-la-huancaina.webp"
  ],
  "logo": "https://elperuanojofemar.com/assets/images/logo-elperuanojofemar.png",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Calle Marqués de Zenete, 17, bajo izquierda",
    "addressLocality": "Valencia",
    "addressRegion": "Valencia",
    "postalCode": "46007",
    "addressCountry": "ES"
  },
  "hasMap": "https://maps.app.goo.gl/X5c5Aah1y5yrFJB67",
  "hasMenu": "https://elperuanojofemar.com/#nuestra-carta",
  "sameAs": [
    "https://www.instagram.com/restauranteperuano.jofemar/",
    "https://www.facebook.com/p/Restaurante-Peruano-Jofemar-100061924994153/"
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "12:45",
      "closes": "16:30"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Friday",
        "Saturday"
      ],
      "opens": "20:00",
      "closes": "23:00"
    }
  ]
};
