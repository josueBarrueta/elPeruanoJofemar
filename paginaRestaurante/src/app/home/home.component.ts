import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Allergen {
  id: string;
  name: string;
  image: string;
}

interface MenuItem {
  name: string;
  price: number;
  allergens: string[]; // Array de IDs de alérgenos
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
  // Lista de alérgenos con sus IDs, nombres e imágenes
  allergensList: Allergen[] = [
    { id: 'Pescado', name: 'Pescado', image: 'Pescado.png' },
    { id: 'Apio', name: 'Apio', image: 'Apio.png' },
    { id: 'Huevos', name: 'Huevos', image: 'Huevos.png' },
    { id: 'FrutosSecos', name: 'Frutos de cáscara', image: 'FrutosSecos.png' },
    { id: 'Lacteos', name: 'Lácteos', image: 'Lacteos.png' },
    { id: 'Cacahuetes', name: 'Cacahuetes', image: 'Cacahuetes.png' },
    { id: 'Soja', name: 'Soja', image: 'Soja.png' },
    { id: 'Crustaceos', name: 'Crustáceos', image: 'Crustaceos.png' },
    { id: 'Moluscos', name: 'Moluscos', image: 'Moluscos.png' },
    { id: 'Gluten', name: 'Gluten', image: 'Gluten.png' },
    { id: 'Mostaza', name: 'Mostaza', image: 'Mostaza.png' },
    { id: 'Sulfitos', name: 'Sulfitos', image: 'Sulfitos.png' },
    { id: 'Sésamo', name: 'Sesamo', image: 'Sesamo.png' },
    { id: 'Altramuces', name: 'Altramuces', image: 'Altramuces.png' }

  ];

  menuCategories: MenuCategory[] = [
    {
      id: 'entradas',
      title: 'Primer plato o Entradas',
      isOpen: false,
      items: [
        { 
          name: 'Causa rellena', 
          price: 7.50,
          allergens: ['Pescado', 'Apio']
        },
        { 
          name: 'Papa rellena', 
          price: 7.50,
          allergens: ['Huevos', 'FrutosSecos']
        },
        { 
          name: 'Causa acevichada', 
          price: 14.50,
          allergens: ['Pescado', 'Apio']
        },
        { 
          name: 'Papa a la huancaina', 
          price: 6.50,
          allergens: ['Huevos', 'Lacteos']
        },
        { 
          name: 'Caldo de gallina', 
          price: 9.50,
          allergens: []
        },
        { 
          name: 'Ocopa', 
          price: 7.50,
          allergens: ['Huevos', 'Cacahuetes', 'Lacteos']
        },
        { 
          name: 'Palta rellena', 
          price: 7.50,
          allergens: ['Pescado', 'Soja']
        },
        { 
          name: 'Tamal', 
          price: 6.50,
          allergens: ['Huevos']
        },
        { 
          name: 'Anticuchos', 
          price: 12.00,
          allergens: []
        },
        { 
          name: 'Ensalada Jofemar', 
          price: 8.50,
          allergens: ['Pescado', 'Huevos']
        },
        { 
          name: 'Leche de tigre', 
          price: 13.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos']
        },
        { 
          name: 'Aguacate relleno', 
          price: 7.00,
          allergens: []
        }
      ]
    },
    {
      id: 'pescado-mariscos',
      title: 'Pescado y Mariscos',
      isOpen: false,
      items: [
        { 
          name: 'Picante de marisco', 
          price: 14.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Lacteos'] 
        },
        { 
          name: 'Chupe de langostino', 
          price: 14.50, 
          allergens: ['Crustaceos', 'Lacteos', 'Huevos'] 
        },
        { 
          name: 'Parihuela', 
          price: 14.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos'] 
        },
        { 
          name: 'Ceviche mixto', 
          price: 18.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos'] 
        },
        { 
          name: 'Ceviche de pescado', 
          price: 16.50, 
          allergens: ['Pescado', 'Lacteos'] 
        },
        { 
          name: 'Chaufa de mariscos', 
          price: 14.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja'] 
        },
        { 
          name: 'Jalea personal', 
          price: 19.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Huevos', 'Gluten'] 
        },
        { 
          name: 'Filete de pescado con frijoles y arroz', 
          price: 10.00, 
          allergens: ['Pescado'] 
        },
        { 
          name: 'Arroz con mariscos', 
          price: 16.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos'] 
        },
        { 
          name: 'Aeropuerto de mariscos', 
          price: 16.50, 
          allergens: ['Gluten', 'Soja'] 
        },
        { 
          name: 'Chicharrón de pescado', 
          price: 14.50, 
          allergens: ['Pescado', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Dorada frita', 
          price: 16.50, 
          allergens: ['Pescado'] 
        },
        { 
          name: 'Pescado a lo macho', 
          price: 16.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Lacteos'] 
        },
        { 
          name: 'Pescado a la chorrillana', 
          price: 12.00, 
          allergens: ['Pescado', 'Soja'] 
        }
      ]
    },
    {
      id: 'carnes-pollo',
      title: 'Carnes y Pollo',
      isOpen: false,
      items: [
        { 
          name: 'Tallarín saltado de ternera', 
          price: 12.50, 
          allergens: ['Gluten', 'Soja'] 
        },
        { 
          name: 'Tallarín saltado de mariscos', 
          price: 14.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Gluten'] 
        },
        { 
          name: 'Tallarín verde con bistec', 
          price: 12.50, 
          allergens: ['Gluten', 'Lacteos'] 
        },
        { 
          name: 'Seco de cordero con frijoles', 
          price: 12.50, 
          allergens: ['Lacteos'] 
        },
        { 
          name: 'Super parrillada Jofemar', 
          price: 16.50, 
          allergens: [] 
        },
        { 
          name: 'Bistec a lo pobre', 
          price: 12.50, 
          allergens: ['Huevos', 'Soja'] 
        },
        { 
          name: 'Arroz chaufa', 
          price: 12.00, 
          allergens: ['Huevos', 'Soja'] 
        },
        { 
          name: 'Arroz chaufa de ternera', 
          price: 13.50, 
          allergens: ['Huevos', 'Soja'] 
        },
        { 
          name: 'Arroz con pato', 
          price: 15.50, 
          allergens: [] 
        },
        { 
          name: 'Lomo saltado', 
          price: 13.50, 
          allergens: ['Soja'] 
        },
        { 
          name: 'Aeropuerto', 
          price: 12.50, 
          allergens: ['Gluten', 'Soja'] 
        },
        { 
          name: 'Aeropuerto de ternera', 
          price: 13.50, 
          allergens: ['Gluten', 'Soja'] 
        },
        { 
          name: 'Mostrito', 
          price: 16.50, 
          allergens: ['Soja'] 
        },
        { 
          name: 'Arroz con pollo', 
          price: 12.50, 
          allergens: [] 
        },
        { 
          name: 'Pollo broaster', 
          price: 13.50, 
          allergens: ['Gluten', 'Huevos'] 
        },
        { 
          name: 'Aji de gallina', 
          price: 12.50, 
          allergens: ['Gluten', 'Huevos', 'Lacteos'] 
        },
        { 
          name: 'Chicharrón de cerdo con camote y salsa criolla', 
          price: 10.00, 
          allergens: [] 
        },
        { 
          name: 'Chuleta de cerdo con patatas fritas', 
          price: 10.00, 
          allergens: [] 
        },
        { 
          name: 'Seco de pollo con frijoles y arroz', 
          price: 12.50, 
          allergens: [] 
        },
        { 
          name: 'Seco de ternera con frijoles y arroz', 
          price: 12.50, 
          allergens: [] 
        },
        { 
          name: 'Salchipapa', 
          price: 7.50, 
          allergens: [] 
        }
      ]
    },
    {
      id: 'combinados',
      title: 'Platos Combinados',
      isOpen: false,
      items: [
        { 
          name: 'Chicharrón de pescado con ceviche de pescado', 
          price: 22.50, 
          allergens: ['Pescado', 'Lacteos', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Chaufa de mariscos con ceviche de pescado', 
          price: 22.50, 
          allergens: ['Pescado', 'Lacteos', 'Crustaceos', 'Moluscos', 'Soja'] 
        },
        { 
          name: 'Arroz chaufa con tallarín saltado', 
          price: 22.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Aeropuerto con chicharrón de pescado', 
          price: 22.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Ceviche de pescado con arroz chaufa', 
          price: 22.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Ceviche de pescado con aeropuerto', 
          price: 22.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Ceviche de pescado con arroz con marisco', 
          price: 25.00, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Ceviche de pescado con chaufa de pescado', 
          price: 25.00, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Ceviche de pescado con chaufa de marisco', 
          price: 25.00, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Ceviche mixto con aeropuerto', 
          price: 25.00, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Ceviche mixto con chicharrón de pescado', 
          price: 25.00, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Ceviche de pescado con chicharrón de pescado', 
          price: 22.50, 
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'] 
        },
        { 
          name: 'Trio Jofemar', 
          price: 33.00, 
          allergens: [] 
        },
        { 
          name: 'Trio Marino', 
          price: 33.00, 
          allergens: [] 
        },
        { 
          name: 'Arroz chaufa y chicharrón de pescado', 
          price: 22.50, 
          allergens: ['Pescado', 'Lacteos', 'Gluten', 'Huevos'] 
        }
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
            // Bebidas en botella/lata
            { name: 'Coca Cola', price: 2.00, allergens: [] },
            { name: 'Seven Up', price: 2.00, allergens: [] },
            { name: 'Fanta', price: 2.00, allergens: [] },
            { name: 'Nestea', price: 2.30, allergens: [] },
            { name: 'Aquarius', price: 2.30, allergens: [] },
            { name: 'Inca Kola Pequeña', price: 3.50, allergens: [] },
            { name: 'Inca Kola 2L 1/2', price: 9.50, allergens: [] },
            { name: 'Inca Kola 625ml', price: 7.00, allergens: [] },
            
            // Aguas
            { name: 'Agua Pequeña', price: 1.50, allergens: [] },
            { name: 'Agua Grande', price: 2.00, allergens: [] },
            { name: 'Agua con Gas', price: 2.50, allergens: [] },
            
            // Bebidas de la casa
            { name: 'Tinto de Verano', price: 2.50, allergens: [] },
            { name: 'Casera', price: 2.50, allergens: [] },
            { name: 'Zumo de Melocotón', price: 2.00, allergens: [] },
            
            // Por vaso
            { name: 'Vaso de Chicha Morada', price: 2.50, allergens: [] },
            { name: 'Vaso de Maracuyá', price: 2.50, allergens: [] },
            
            // 1/2 Jarra
            { name: '1/2 Jarra de Chicha Morada', price: 4.00, allergens: [] },
            { name: '1/2 Jarra de Maracuyá', price: 4.00, allergens: [] },
            
            // Jarra completa
            { name: 'Jarra de Chicha Morada', price: 7.00, allergens: [] },
            { name: 'Jarra de Maracuyá', price: 7.00, allergens: [] },
            { name: 'Jarra de Sangría', price: 12.50, allergens: [] }
          ]
        },
        {
          id: 'cervezas',
          title: 'Cervezas',
          isOpen: false,
          items: [
            // Cervezas en botella/lata
            { name: 'Cuzqueña Rubia', price: 3.50, allergens: ['Gluten'] },
            { name: 'Cuzqueña Negra', price: 3.50, allergens: ['Gluten'] },
            { name: 'Cuzqueña Trigo', price: 3.50, allergens: ['Gluten'] },
            { name: 'Pilsen', price: 3.50, allergens: ['Gluten'] },
            { name: 'Heineken', price: 2.50, allergens: ['Gluten'] },
            { name: 'Águila', price: 2.00, allergens: ['Gluten'] },
            { name: 'Amstel', price: 2.00, allergens: ['Gluten'] },
            { name: 'Amstel Sin Alcohol', price: 2.50, allergens: ['Gluten'] },
            { name: 'Radler', price: 2.50, allergens: ['Gluten'] },
            
            // Formatos de cerveza de barril
            { name: 'Caña', price: 2.00, allergens: ['Gluten'] },
            { name: 'Doble', price: 2.50, allergens: ['Gluten'] },
            { name: 'Tanque', price: 4.00, allergens: ['Gluten'] },
            { name: 'Jarra de Cerveza 1L', price: 7.00, allergens: ['Gluten'] }
          ]
        },
        {
          id: 'vinos-casa',
          title: 'Vino de la Casa',
          isOpen: false,
          items: [
            { name: 'Abadía (Tinto)', price: 7.00, allergens: ['Sulfitos'] }
          ]
        },
        {
          id: 'vinos-tintos',
          title: 'Vinos Tintos',
          isOpen: false,
          items: [
            { name: 'Abadía', price: 7.00, allergens: ['Sulfitos'] },
            { name: 'Arrios Joven', price: 7.00, allergens: ['Sulfitos'] },
            { name: 'El Coto', price: 12.00, allergens: ['Sulfitos'] },
            { name: 'Estola Crianza', price: 9.50, allergens: ['Sulfitos'] },
            { name: 'Hoya Cadenas 130', price: 10.50, allergens: ['Sulfitos'] }
          ]
        },
        {
          id: 'vinos-blancos',
          title: 'Vinos Blancos',
          isOpen: false,
          items: [
            { name: 'Abadía de Roble', price: 7.00, allergens: ['Sulfitos'] },
            { name: 'El Coto', price: 12.00, allergens: ['Sulfitos'] },
            { name: 'Boyante', price: 9.00, allergens: ['Sulfitos'] }
          ]
        },
        {
          id: 'vinos-rosados',
          title: 'Vinos Rosados',
          isOpen: false,
          items: [
            { name: 'Viña Campus', price: 10.50, allergens: ['Sulfitos'] }
          ]
        },
        {
          id: 'cocteles',
          title: 'Cócteles Peruanos',
          isOpen: false,
          items: [
            { name: 'Pisco Sour', price: 6.50, allergens: ['Huevos'] },
            { name: 'Chilcano de Pisco', price: 6.50, allergens: [] },
            { name: 'Perú Libre', price: 6.50, allergens: [] },
            { name: 'Capitán', price: 6.00, allergens: [] }
          ]
        },
        {
          id: 'chupitos',
          title: 'Chupitos',
          isOpen: false,
          items: [
            { name: 'Chupito de Pisco', price: 3.00, allergens: [] },
            { name: 'Chupito de Orujo de Hierbas', price: 1.50, allergens: [] },
            { name: 'Chupito de Arroz', price: 1.50, allergens: [] },
            { name: 'Chupito de Limoncello', price: 1.50, allergens: [] },
            { name: 'Chupito de Crema de Orujo', price: 1.50, allergens: ['Lacteos'] },
            { name: 'Chupito de Whisky', price: 2.00, allergens: [] },
            { name: 'Chupito de Bayles', price: 2.00, allergens: [] },
            { name: 'Chupito de Coñac', price: 2.00, allergens: [] },
            { name: 'Chupito de Cazalla', price: 1.50, allergens: [] }
          ]
        }
      ]
    },
    {
      id: 'postres',
      title: 'Postres',
      isOpen: false,
      items: [
        { name: 'Tarta de Chocolate', price: 0, allergens: ['Gluten', 'Huevos', 'Lacteos'] },
        { name: 'Crema Volteada', price: 0, allergens: ['Huevos', 'Lacteos'] },
        { name: 'Tarta Helada', price: 0, allergens: ['Gluten', 'Huevos', 'Lacteos'] },
        { name: 'Helado de Lucuma', price: 0, allergens: ['Lacteos'] },
        { name: 'Tarta de Tres Chocolates', price: 0, allergens: ['Gluten', 'Lacteos'] },
        { name: 'Pudin', price: 0, allergens: ['Gluten', 'Huevos', 'Lacteos', 'FrutosSecos'] },
        { name: 'Arroz con Leche', price: 0, allergens: ['Lacteos'] },
        { name: 'Mazamorra', price: 0, allergens: ['Lacteos'] },
        { name: 'Gelatina', price: 0, allergens: [] },
        { name: 'Pay de Limón', price: 0, allergens: ['Gluten', 'Huevos'] },
        { name: 'Tarta de Queso con Arándanos', price: 0, allergens: ['Gluten', 'Huevos', 'Lacteos', 'FrutosSecos'] },
        { name: 'Tarta de Vainilla', price: 0, allergens: ['Huevos', 'Lacteos'] }
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

  // Obtener la ruta de la imagen de un alérgeno por su ID
  getAllergenImage(allergenId: string): string {
    const allergen = this.allergensList.find(a => a.id === allergenId);
    return allergen ? allergen.image : '';
  }

  // Obtener el nombre de un alérgeno por su ID
  getAllergenName(allergenId: string): string {
    const allergen = this.allergensList.find(a => a.id === allergenId);
    return allergen ? allergen.name : '';
  }
}
