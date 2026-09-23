import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  image?: string; // Imagen opcional del plato
}

interface MenuSubcategory {
  id: string;
  title: string;
  isOpen: boolean;
  items: MenuItem[];
}

interface MenuCategory {
  id: string;
  title: string;
  isOpen: boolean;
  items?: MenuItem[];
  subcategories?: MenuSubcategory[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  selectedCategory: MenuCategory | null = null;
  selectedParentCategory: MenuCategory | null = null;
  showAllergens = false;
  activeAboutQuestion: number | null = null;

  aboutFaqs = [
    { question: '¿Cómo comenzó nuestra historia?', answer: 'Prácticamente nacidos en Perú, decidimos arriesgarlo todo en busca de un futuro mejor en España. Comenzamos trabajando con mucha dedicación y humildad en una pequeña cafetería, un paso inicial que nos permitió conocer la ciudad, sus gentes y sus sabores.' },
    { question: '¿Cuándo nació nuestro primer restaurante?', answer: 'En 2010, gracias al esfuerzo constante y a la pasión por nuestra tierra y nuestra cocina, dimos vida a nuestro primer restaurante en la emblemática calle Julio Antonio de Valencia.' },
    { question: '¿De dónde viene el nombre Jofemar y cómo ha crecido nuestra familia?', answer: 'Lo llamamos Jofemar porque es una mezcla de los nombres de nuestra familia en ese momento: Josué, nuestro primer hijo; Mariana, la madre; y Fernando, el padre. Hoy, la familia ha crecido con la llegada de dos nuevos miembros, Thiago y Samantha, quienes llenan nuestro hogar y nuestro restaurante de alegría y energía renovada.' },
    { question: '¿Qué significa nuestro lema?', answer: 'El primer local, aunque pequeño, se convirtió en un refugio lleno de sabor y cariño. Así nació nuestro eslogan: “Un rinconcito pequeño con el corazón grande”.' },
    { question: '¿Qué representa Jofemar hoy?', answer: 'Después de varios años de éxito y reconocimiento, seguimos creciendo como punto de encuentro para los amantes de la auténtica gastronomía peruana en Valencia. En Jofemar, cada plato cuenta una historia, cada ingrediente es una herencia y cada cliente es parte de nuestra familia.' }
  ];
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

  readonly allergenById = new Map(this.allergensList.map(allergen => [allergen.id, allergen]));

  menuCategories: MenuCategory[] = [
    {
      id: 'entradas',
      title: 'Primer plato o Entradas',
      isOpen: false,
      items: [
        {
          name: 'Causa rellena',
          price: 7.50,
          allergens: ['Pescado', 'Apio'],
          image: 'causa-rellena-mejorada.png'
        },
        {
          name: 'Papa rellena',
          price: 7.50,
          allergens: ['Huevos', 'FrutosSecos'],
          image: 'papa-rellena-mejorada.png'
        },
        {
          name: 'Causa acevichada',
          price: 14.50,
          allergens: ['Pescado', 'Apio'],
          image: 'causa-rellena-acevichada-mejorada.png'
        },
        {
          name: 'Papa a la huancaina',
          price: 6.50,
          allergens: ['Huevos', 'Lacteos'],
          image: 'papa-a-la-huancaina-mejorada.png'
        },
        {
          name: 'Caldo de gallina',
          price: 9.50,
          allergens: []
        },
        {
          name: 'Ocopa',
          price: 7.50,
          allergens: ['Huevos', 'Cacahuetes', 'Lacteos'],
          image: 'ocopa-mejorada.png'
        },
        {
          name: 'Palta rellena',
          price: 7.50,
          allergens: ['Pescado', 'Soja'],
          image: 'aguacate-relleno-mejorada.png'
        },
        {
          name: 'Tamal',
          price: 6.50,
          allergens: ['Huevos'],
          image: 'tamal-mejorada.png'
        },
        {
          name: 'Anticuchos',
          price: 12.00,
          allergens: [],
          image: 'anticuchos-mejorada.png'
        },
        {
          name: 'Ensalada Jofemar',
          price: 8.50,
          allergens: ['Pescado', 'Huevos']
        },
        {
          name: 'Leche de tigre',
          price: 13.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos'],
          image: 'leche-de-tigre-mejorada.png'
        },
        {
          name: 'Aguacate relleno',
          price: 7.00,
          allergens: [],
          image: 'aguacate-relleno-mejorada.png'
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
          allergens: ['Crustaceos', 'Lacteos', 'Huevos'],
          image: 'chupe_de_langostinos.png'
        },
        {
          name: 'Parihuela',
          price: 14.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos'],
          image: 'parihuela.png'
        },
        {
          name: 'Ceviche mixto',
          price: 18.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos'],
          image: 'ceviche_mixto.png'
        },
        {
          name: 'Ceviche de pescado',
          price: 16.50,
          allergens: ['Pescado', 'Lacteos'],
          image: 'ceviche_de_pescado.png'
        },
        {
          name: 'Chaufa de mariscos',
          price: 14.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja'],
          image: 'chaufa_de_mariscos.png'
        },
        {
          name: 'Jalea personal',
          price: 19.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Huevos', 'Gluten'],
          image: 'jalea.png'
        },
        {
          name: 'Filete de pescado con frijoles y arroz',
          price: 10.00,
          allergens: ['Pescado']
        },
        {
          name: 'Arroz con mariscos',
          price: 16.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos'],
          image: 'arroz_con_mariscos.png'
        },
        {
          name: 'Aeropuerto de mariscos',
          price: 16.50,
          allergens: ['Gluten', 'Soja'],
          image: 'aeropuerto.png'
        },
        {
          name: 'Chicharrón de pescado',
          price: 14.50,
          allergens: ['Pescado', 'Gluten', 'Huevos'],
          image: 'chicharron_de_pescado.png'
        },
        {
          name: 'Dorada frita',
          price: 16.50,
          allergens: ['Pescado']
        },
        {
          name: 'Pescado a lo macho',
          price: 16.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Lacteos'],
          image: 'pescado_a_lo_macho.png'
        },
        {
          name: 'Pescado a la chorrillana',
          price: 12.00,
          allergens: ['Pescado', 'Soja'],
          image: 'pescado_a_la_chorrillana.png'
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
          allergens: ['Gluten', 'Soja'],
          image: 'tallarin_saltado_ternera.png'
        },
        {
          name: 'Tallarín saltado de mariscos',
          price: 14.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Gluten'],
          image: 'tallarin_saltado_de_mariscos.png'
        },
        {
          name: 'Tallarín verde con bistec',
          price: 12.50,
          allergens: ['Gluten', 'Lacteos'],
          image: 'tallarin_verde_bistec.png'
        },
        {
          name: 'Seco de cordero con frijoles',
          price: 12.50,
          allergens: ['Lacteos']
        },
        {
          name: 'Super parrillada Jofemar',
          price: 16.50,
          allergens: [],
          image: 'parrillada_jofemar.png'
        },
        {
          name: 'Bistec a lo pobre',
          price: 12.50,
          allergens: ['Huevos', 'Soja'],
          image: 'bistec_a_lo_pobre.png'
        },
        {
          name: 'Arroz chaufa',
          price: 12.00,
          allergens: ['Huevos', 'Soja'],
          image: 'arroz_chaufa.png'
        },
        {
          name: 'Arroz chaufa de ternera',
          price: 13.50,
          allergens: ['Huevos', 'Soja']
        },
        {
          name: 'Arroz con pato',
          price: 15.50,
          allergens: [],
          image: 'arroz_con_pato.png'
        },
        {
          name: 'Lomo saltado',
          price: 13.50,
          allergens: ['Soja'],
          image: 'lomo_saltado.png'
        },
        {
          name: 'Aeropuerto',
          price: 12.50,
          allergens: ['Gluten', 'Soja'],
          image: 'aeropuerto.png'
        },
        {
          name: 'Aeropuerto de ternera',
          price: 13.50,
          allergens: ['Gluten', 'Soja']
        },
        {
          name: 'Mostrito',
          price: 16.50,
          allergens: ['Soja'],
          image: 'mostrito.png'
        },
        {
          name: 'Arroz con pollo',
          price: 12.50,
          allergens: [],
          image: 'arroz_con_pollo.png'
        },
        {
          name: 'Pollo broaster',
          price: 13.50,
          allergens: ['Gluten', 'Huevos'],
          image: 'pollo_broaster.png'
        },
        {
          name: 'Aji de gallina',
          price: 12.50,
          allergens: ['Gluten', 'Huevos', 'Lacteos'],
          image: 'aji_de_gallina.png'
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
          allergens: [],
          image: 'seco_ternera_frijoles.png'
        },
        {
          name: 'Salchipapa',
          price: 7.50,
          allergens: [],
          image: 'salchipapa.png'
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
          allergens: ['Pescado', 'Lacteos', 'Gluten', 'Huevos'],
          image: 'chicharron_con_ceviche.png'
        },
        {
          name: 'Chaufa de mariscos con ceviche de pescado',
          price: 22.50,
          allergens: ['Pescado', 'Lacteos', 'Crustaceos', 'Moluscos', 'Soja'],
          image: 'chaufa_con_ceviche.png'
        },
        {
          name: 'Arroz chaufa con tallarín saltado',
          price: 22.50,
          allergens: ['Pescado', 'Crustaceos', 'Moluscos', 'Soja', 'Gluten', 'Huevos'],
          image: 'arroz_chaufa_con_tallarin.png'
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
          name: 'Trio Marino',
          price: 33.00,
          allergens: [],
          image: 'trio_ceviche_chicharron_chaufa.png'
        },
        {
          name: 'Trio Criollo',
          price: 33.00,
          allergens: [],
          image: 'trio_ceviche_huancaina_arroz_pollo.png'
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
            { name: 'Coca Cola', price: 2.00, allergens: [], image: 'coca-cola.jpeg' },
            { name: 'Seven Up', price: 2.00, allergens: [], image: 'seven-up.jpeg' },
            { name: 'Fanta', price: 2.00, allergens: [], image: 'fanta.jpeg'},
            { name: 'Nestea', price: 2.30, allergens: [], image: 'nestea.jpeg'},
            { name: 'Aquarius', price: 2.30, allergens: [], image: 'aquarius.jpeg'},
            { name: 'Inca Kola Pequeña', price: 3.50, allergens: [], image: 'inca-kola-pequena.jpeg'},
            { name: 'Inca Kola 2L 1/2', price: 9.50, allergens: [], image: 'inca-kola-grande.jpeg'},
            { name: 'Inca Kola 625ml', price: 7.00, allergens: [], image: 'inca-kola-gordita.jpeg'},

            // Aguas
            { name: 'Agua Pequeña', price: 1.50, allergens: [], image: 'agua-pequena.jpeg'},
            { name: 'Agua Grande', price: 2.00, allergens: [], image: 'agua-grande.jpeg'},
            { name: 'Agua con Gas', price: 2.50, allergens: [], image: 'agua-con-gas.jpeg'},

            // Bebidas de la casa
            { name: 'Tinto de Verano', price: 2.50, allergens: [], image: 'tinto-de-verano.jpeg'},
            { name: 'Casera', price: 2.50, allergens: [], image: 'casera.jpeg'},
            { name: 'Zumo de Melocotón', price: 2.00, allergens: [], image: 'zumo-melocoton.jpeg'},

            // Por vaso
            { name: 'Vaso de Chicha Morada', price: 2.50, allergens: [], image: 'vaso-chicha-morada.jpeg'},
            { name: 'Vaso de Maracuyá', price: 2.50, allergens: [], image: 'vaso-maracuya.jpeg'},

            // 1/2 Jarra
            { name: '1/2 Jarra de Chicha Morada', price: 4.00, allergens: [], image: 'media-jarra-chicha-morada.jpeg'},
            { name: '1/2 Jarra de Maracuyá', price: 4.00, allergens: [], image: 'media-jarra-maracuya.jpeg'},

            // Jarra completa
            { name: 'Jarra de Chicha Morada', price: 7.00, allergens: [], image: 'jarra-chicha-morada.jpeg'},
            { name: 'Jarra de Maracuyá', price: 7.00, allergens: [], image: 'jarra-maracuya.jpeg'},
            { name: 'Jarra de Sangría', price: 12.50, allergens: [], image: 'jarra-sangria.jpeg'}
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
            { name: 'Abadía (Tinto)', price: 7.00, allergens: ['Sulfitos'], image: 'abadia-tinto.jpeg'}
          ]
        },
        {
          id: 'vinos-tintos',
          title: 'Vinos Tintos',
          isOpen: false,
          items: [
            { name: 'Abadía', price: 7.00, allergens: ['Sulfitos'], image: 'abadia-tinto.jpeg'},
            { name: 'Arrios Joven', price: 7.00, allergens: ['Sulfitos'], image: 'arrios-joven-tinto.jpeg'},
            { name: 'El Coto', price: 12.00, allergens: ['Sulfitos'], image: 'el-coto-tinto.jpeg'},
            { name: 'Estola Crianza', price: 9.50, allergens: ['Sulfitos'], image: 'estola-crianza-tinto.jpeg'},
            { name: 'Hoya Cadenas 130', price: 10.50, allergens: ['Sulfitos'], image: 'hoya-cadenas-130-tinto.jpeg'}
          ]
        },
        {
          id: 'vinos-blancos',
          title: 'Vinos Blancos',
          isOpen: false,
          items: [
            { name: 'Abadía de Roble', price: 7.00, allergens: ['Sulfitos'], image: 'abadia-roble-blanco.jpeg'},
            { name: 'El Coto', price: 12.00, allergens: ['Sulfitos'], image: 'el-coto-blanco.jpeg'},
            { name: 'Boyante', price: 9.00, allergens: ['Sulfitos'], image: 'boyante-blanco.jpeg'}
          ]
        },
        {
          id: 'vinos-rosados',
          title: 'Vinos Rosados',
          isOpen: false,
          items: [
            { name: 'Viña Campus', price: 10.50, allergens: ['Sulfitos'], image: 'vina-campus.jpeg' }
          ]
        },
        {
          id: 'cocteles',
          title: 'Cócteles Peruanos',
          isOpen: false,
          items: [
            { name: 'Pisco Sour', price: 6.50, allergens: ['Huevos'], image: 'pisco-sour.jpeg'},
            { name: 'Chilcano de Pisco', price: 6.50, allergens: [], image: 'chilcano-pisco.jpeg'},
            { name: 'Perú Libre', price: 6.50, allergens: [], image: 'peru-libre.jpeg'},
            { name: 'Capitán', price: 6.00, allergens: [], image: 'capitan.jpeg'}
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
        { name: 'Tarta de Chocolate', price: 4.50, allergens: ['Gluten', 'Huevos', 'Lacteos'], image: 'tarta_chocolate.png' },
        { name: 'Crema Volteada', price: 4.00, allergens: ['Huevos', 'Lacteos'], image: 'crema_volteada.png' },
        { name: 'Tarta Helada', price: 5.00, allergens: ['Gluten', 'Huevos', 'Lacteos'], image: 'tarta_helada.png' },
        { name: 'Helado de Lucuma', price: 3.50, allergens: ['Lacteos'], image: 'helado_lucuma.png' },
        { name: 'Tarta de Tres Chocolates', price: 5.50, allergens: ['Gluten', 'Lacteos'], image: 'tarta_tres_chocolates.png' },
        { name: 'Pudin', price: 3.50, allergens: ['Gluten', 'Huevos', 'Lacteos', 'FrutosSecos'], image: 'pudin.png' },
        { name: 'Arroz con Leche', price: 3.00, allergens: ['Lacteos'], image: 'arroz_con_leche_combinado.png' },
        { name: 'Mazamorra', price: 3.00, allergens: ['Lacteos'], image: 'mazamorra.png' },
        { name: 'Gelatina', price: 2.50, allergens: [], image: 'gelatina.png' },
        { name: 'Pay de Limón', price: 4.50, allergens: ['Gluten', 'Huevos'], image: 'pay_limon.png' },
        { name: 'Tarta de Queso con Arándanos', price: 5.50, allergens: ['Gluten', 'Huevos', 'Lacteos', 'FrutosSecos'], image: 'tarta_queso_arandano.png' },
        { name: 'Tarta de Vainilla', price: 4.50, allergens: ['Huevos', 'Lacteos'], image: 'torta_vainilla.png' }
      ]
    }
  ];

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

  openCategory(category: MenuCategory): void {
    this.selectedCategory = category;
    this.selectedParentCategory = null;
    window.location.hash = `carta/${category.id}`;
    setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  openSubcategory(category: MenuCategory, subcategory: MenuSubcategory): void {
    this.selectedParentCategory = category;
    this.selectedCategory = { ...category, title: `${category.title} · ${subcategory.title}`, items: subcategory.items, subcategories: undefined };
    window.location.hash = `carta/${category.id}/${subcategory.id}`;
    setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  closeMenuView(): void {
    if (this.selectedParentCategory) {
      const parent = this.selectedParentCategory;
      this.selectedCategory = parent;
      this.selectedParentCategory = null;
      window.location.hash = `carta/${parent.id}`;
      setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }
    this.selectedCategory = null;
    window.location.hash = 'nuestra-carta';
    setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  goToMenu(event: Event): void {
    event.preventDefault();
    this.selectedCategory = null;
    this.selectedParentCategory = null;
    this.showAllergens = false;
    window.location.hash = 'nuestra-carta';
    setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  toggleAllergens(): void {
    this.showAllergens = !this.showAllergens;
  }

  toggleAboutAnswer(index: number): void {
    this.activeAboutQuestion = this.activeAboutQuestion === index ? null : index;
  }

  get whatsappUrl(): string {
    const hour = new Date().getHours();
    const greeting = hour < 12
      ? '¡Hola, buenos días! ¿Podría reservar una mesa, por favor?'
      : hour < 20
        ? '¡Hola, buenas tardes! ¿Podría reservar una mesa, por favor?'
        : '¡Hola, buenas noches! ¿Podría reservar una mesa, por favor?';

    return `https://wa.me/34606790925?text=${encodeURIComponent(greeting)}`;
  }


  toggleSubcategory(category: MenuCategory, subcategory: MenuSubcategory): void {
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
    const allergen = this.allergenById.get(allergenId);
    return allergen ? allergen.image : '';
  }

  // Obtener el nombre de un alérgeno por su ID
  getAllergenName(allergenId: string): string {
    const allergen = this.allergenById.get(allergenId);
    return allergen ? allergen.name : '';
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  trackByName(_: number, item: MenuItem): string {
    return item.name;
  }
}
