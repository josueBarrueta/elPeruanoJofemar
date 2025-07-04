import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MenuItem {
  name: string;
  price: number;
  description: string;
}

interface MenuCategory {
  id: string;
  title: string;
  isOpen: boolean;
  items?: MenuItem[];
  subcategories?: {
    id: string;
    title: string;
    isOpen: boolean;
    items: MenuItem[];
  }[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  menuCategories: MenuCategory[] = [
    {
      id: 'entradas',
      title: 'Primer plato o Entradas',
      isOpen: false,
      items: [
        { name: 'Causa Limeña', price: 8.50, description: 'Deliciosa causa rellena de pollo o atún, con aguacate y mayonesa de ají amarillo.' },
        { name: 'Papa a la Huancaína', price: 7.50, description: 'Patatas cocidas bañadas en nuestra exquisita salsa de queso y ají amarillo.' },
        { name: 'Tequeños', price: 6.50, description: 'Delicados rollitos de masa rellenos de queso, acompañados de guacamole.' },
        { name: 'Anticuchos', price: 9.00, description: 'Brochetas de corazón de res marinadas en ají panca y vinagre.' },
        { name: 'Tamal', price: 7.00, description: 'Masa de maíz rellena de carne, envuelta en hojas de plátano y cocida al vapor.' },
        { name: 'Choros a la Chalaca', price: 8.50, description: 'Mejillones al vapor con cebolla, tomate, ají y limón.' }
      ]
    },
    {
      id: 'pescado-mariscos',
      title: 'Pescado y Mariscos',
      isOpen: false,
      items: [
        { name: 'Ceviche de Pescado', price: 14.90, description: 'Pescado fresco marinado en jugo de limón, con cebolla, ají y camote.' },
        { name: 'Arroz con Mariscos', price: 16.90, description: 'Arroz con una selección de mariscos frescos y salsa de la casa.' },
        { name: 'Parihuela', price: 17.50, description: 'Sopa espesa de pescados y mariscos con un toque de vino y especias.' },
        { name: 'Chupe de Camarones', price: 16.00, description: 'Sopa cremosa de camarones con arroz, huevo y queso.' },
        { name: 'Jalea Mixta', price: 18.90, description: 'Fritura de mariscos y pescado acompañado de yuca y salsa tártara.' },
        { name: 'Tiradito de Pescado', price: 15.50, description: 'Finas láminas de pescado crudo en salsa de ají amarillo.' }
      ]
    },
    {
      id: 'carnes-pollo',
      title: 'Carnes y Pollo',
      isOpen: false,
      items: [
        { name: 'Lomo Saltado', price: 15.50, description: 'Trozos tiernos de lomo de res salteados con cebolla, tomate y papas fritas.' },
        { name: 'Aji de Gallina', price: 13.50, description: 'Pollo desmenuzado en salsa de ají amarillo, leche y pan, servido con arroz y papas.' },
        { name: 'Pollo a la Brasa', price: 12.90, description: 'Pollo asado al carbón, acompañado de papas fritas y ensalada.' },
        { name: 'Seco de Carne', price: 14.50, description: 'Estofado de carne con frijoles, cilantro y arroz.' },
        { name: 'Anticuchos de Corazón', price: 11.90, description: 'Brochetas de corazón de res a la parrilla con papas y choclo.' },
        { name: 'Carne al Jugo', price: 15.90, description: 'Ternera jugosa en su propia salsa, acompañada de arroz y verduras salteadas.' }
      ]
    },
    {
      id: 'combinados',
      title: 'Platos Combinados',
      isOpen: false,
      items: [
        { name: 'Combinado Peruano', price: 18.50, description: 'Porción pequeña de lomo saltado, arroz y tallarines saltados.' },
        { name: 'Combinado Marino', price: 19.90, description: 'Ceviche, chicharrón de calamar y arroz con mariscos.' },
        { name: 'Combinado Familiar', price: 32.00, description: 'Para 2 personas: lomo saltado, arroz chaufa, tallarín saltado y porción de chaufa de mariscos.' },
        { name: 'Combinado Especial', price: 16.50, description: 'Pollo a la brasa con ensalada, papas fritas y salsa especial.' },
        { name: 'Combinado Vegetariano', price: 14.50, description: 'Arroz chaufa de verduras, tallarín saltado de verduras y ensalada fresca.' },
        { name: 'Combinado de Mar y Tierra', price: 21.50, description: 'Lomo saltado con arroz y chaufa de mariscos.' }
      ]
    },
    {
      id: 'bebidas',
      title: 'Bebidas',
      isOpen: false,
      subcategories: [
        {
          id: 'refrescos',
          title: 'Refrescos',
          isOpen: false,
          items: [
            { name: 'Inca Kola', price: 2.50, description: 'Refresco peruano de sabor único.' },
            { name: 'Chicha Morada', price: 3.00, description: 'Refrescante bebida peruana hecha de maíz morado.' },
            { name: 'Maracuyá', price: 3.50, description: 'Refresco natural de maracuyá.' },
            { name: 'Limonada', price: 3.00, description: 'Limonada natural con hierbabuena.' },
            { name: 'Jugo de Naranja', price: 3.50, description: 'Jugo natural de naranja recién exprimido.' },
            { name: 'Gaseosas', price: 2.50, description: 'Coca Cola, Fanta, Sprite o Inca Kola.' }
          ]
        },
        {
          id: 'cervezas',
          title: 'Cervezas',
          isOpen: false,
          items: [
            { name: 'Cusqueña Dorada', price: 3.50, description: 'Cerveza lager peruana.' },
            { name: 'Cusqueña Trigo', price: 4.00, description: 'Cerveza de trigo peruana.' },
            { name: 'Cristal', price: 3.00, description: 'Cerveza rubia peruana.' },
            { name: 'Pilsen Callao', price: 3.25, description: 'Cerveza lager tradicional.' },
            { name: 'Cusqueña Malta', price: 4.50, description: 'Cerveza negra con notas tostadas.' }
          ]
        },
        {
          id: 'vinos-tintos',
          title: 'Vinos Tintos',
          isOpen: false,
          items: [
            { name: 'Intipalka Tinto', price: 5.00, description: 'Vino tinto peruano con cuerpo y sabor intenso.' },
            { name: 'Santiago Queirolo Tinto', price: 5.50, description: 'Vino tinto seco con notas a frutos rojos.' },
            { name: 'Tacama Gran Tinto', price: 6.50, description: 'Vino tinto reserva con cuerpo y taninos suaves.' }
          ]
        },
        {
          id: 'vinos-blancos',
          title: 'Vinos Blancos',
          isOpen: false,
          items: [
            { name: 'Tacama Blanco', price: 4.50, description: 'Vino blanco fresco y afrutado.' },
            { name: 'Intipalka Blanco', price: 5.00, description: 'Vino blanco seco con notas cítricas.' },
            { name: 'Santiago Queirolo Blanco', price: 4.75, description: 'Vino blanco fresco y ligero.' }
          ]
        },
        {
          id: 'vinos-rosados',
          title: 'Vinos Rosados',
          isOpen: false,
          items: [
            { name: 'Tacama Rosado', price: 4.75, description: 'Vino rosado refrescante con notas de frutos rojos.' },
            { name: 'Intipalka Rosado', price: 5.00, description: 'Vino rosado frutal y fresco.' }
          ]
        },
        {
          id: 'cocteles',
          title: 'Cócteles Peruanos',
          isOpen: false,
          items: [
            { name: 'Pisco Sour', price: 6.50, description: 'El cóctel bandera del Perú, preparado con pisco, limón, clara de huevo y amargo de angostura.' },
            { name: 'Chilcano', price: 5.50, description: 'Refrescante cóctel de pisco con ginger ale y limón.' },
            { name: 'Algarrobina', price: 6.00, description: 'Pisco, leche evaporada, canela, clavo de olor y jarabe de algarrobina.' },
            { name: 'Chilcano de Maracuyá', price: 6.50, description: 'Variante del clásico chilcano con jugo de maracuyá.' },
            { name: 'Pisco Sour de Frutos Rojos', price: 7.00, description: 'Pisco sour con un toque de frutos rojos.' }
          ]
        },
        {
          id: 'chupitos',
          title: 'Chupitos',
          isOpen: false,
          items: [
            { name: 'Chilcano Shot', price: 4.00, description: 'Versión en shot del clásico Chilcano.' },
            { name: 'Pisco Puro', price: 3.50, description: 'Shot de pisco puro de uva quebranta.' },
            { name: 'Algarrobina Shot', price: 4.50, description: 'Versión en shot del cóctel de algarrobina.' },
            { name: 'Macerado de Frutas', price: 4.00, description: 'Shot de pisco macerado con frutas de temporada.' }
          ]
        }
      ]
    },
    {
      id: 'postres',
      title: 'Postres',
      isOpen: false,
      items: [
        { name: 'Suspiro a la Limeña', price: 6.50, description: 'Delicado postre de manjarblanco con merengue italiano.' },
        { name: 'Mazamorra Morada', price: 5.50, description: 'Postre típico peruano a base de maíz morado.' },
        { name: 'Arroz con Leche', price: 5.00, description: 'Clásico arroz con leche espolvoreado con canela.' },
        { name: 'Picarones', price: 6.00, description: 'Rosquillas fritas de harina de camote y zapallo, bañadas en miel de chancaca.' },
        { name: 'Trufa de Chocolate', price: 7.00, description: 'Deliciosa trufa de chocolate negro con relleno de lúcuma.' }
      ]
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // Todas las categorías comienzan cerradas por defecto
  }

  toggleCategory(category: MenuCategory): void {
    // Cerrar todas las categorías primero
    this.menuCategories.forEach(cat => {
      if (cat.id !== category.id) {
        cat.isOpen = false;
        // Cerrar también todas las subcategorías al cambiar de categoría
        if (cat.subcategories) {
          cat.subcategories.forEach(sub => sub.isOpen = false);
        }
      }
    });
    // Alternar la categoría seleccionada
    category.isOpen = !category.isOpen;
  }

  toggleSubcategory(category: MenuCategory, subcategory: any): void {
    if (!category.subcategories) return;
    
    // Cerrar otras subcategorías de la misma categoría
    category.subcategories.forEach(sub => {
      if (sub.id !== subcategory.id) {
        sub.isOpen = false;
      }
    });
    
    // Alternar la subcategoría seleccionada
    subcategory.isOpen = !subcategory.isOpen;
  }
}
