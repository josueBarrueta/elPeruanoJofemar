import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { retry } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MenuApiService, ApiMenuItem } from '../menu-api.service';
import { ReviewsComponent } from '../reviews/reviews.component';
import { DailyMenu, DailyMenuService } from '../daily-menu.service';

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
  imagePosition?: string;
  imageZoom?: number;
  description?: string;
  active?: boolean;
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
  imports: [CommonModule, ReviewsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements AfterViewInit {
  dailyMenu: DailyMenu;
  readonly todayDate = new Date();
  readonly todayDateLabel = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(this.todayDate);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly dailyMenuService = inject(DailyMenuService);
  showDailyMenuModal = false;
  dailyMenuClosing = false;
  private readonly categoryOrder = [
    'Primer plato o Entradas',
    'Pescado y Mariscos',
    'Carnes y Pollo',
    'Platos Combinados',
    'Bebidas',
    'Postres'
  ];
  private readonly subcategoryOrder: Record<string, string[]> = {
    'Bebidas': ['Refrescos', 'Cervezas', 'Vino de la Casa', 'Vinos Tintos', 'Vinos Blancos', 'Vinos Rosados', 'Cócteles Peruanos', 'Chupitos']
  };
  private readonly menuApi: MenuApiService | null;
  selectedCategory: MenuCategory | null = null;
  selectedParentCategory: MenuCategory | null = null;
  showAllergens = false;
  activeAboutQuestion: number | null = null;
  selectedItem: MenuItem | null = null;
  menuLoading = true;
  menuLoadError = false;

  constructor() {
    this.dailyMenu = this.dailyMenuService.get();
    this.dailyMenuService.loadRemote().subscribe({ next: menu => { this.dailyMenu = { ...menu, date: this.todayDate.toISOString().slice(0, 10) }; this.changeDetector.markForCheck(); }, error: () => undefined });
    const seedMode = (globalThis as { __JOFEMAR_SEED__?: boolean }).__JOFEMAR_SEED__ === true;
    this.menuApi = seedMode ? null : inject(MenuApiService);
    this.menuLoading = true;
    if (this.menuApi) {
      this.menuApi.getMenu().pipe(retry({ count: 3, delay: 1800 })).subscribe({
        next: (items) => {
          this.menuCategories = this.groupApiItems(items);
          this.menuLoading = false;
          this.menuLoadError = false;
          this.applyUrlSelection();
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.menuLoading = false;
          this.menuLoadError = true;
          this.changeDetector.markForCheck();
        }
      });
    }
    if (typeof window !== 'undefined') window.addEventListener('popstate', () => this.applyUrlSelection());
  }

  ngAfterViewInit(): void {
    if (window.location.hash === '#/' || window.location.hash === '') {
      window.history.scrollRestoration = 'manual';
      window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 0);
      window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 250);
    }
  }

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

  aboutFaqs = [
    { question: '¿Cómo comenzó nuestra historia?', answer: 'Prácticamente nacidos en Perú, decidimos arriesgarlo todo en busca de un futuro mejor en España. Comenzamos trabajando con mucha dedicación y humildad en una pequeña cafetería, un paso inicial que nos permitió conocer la ciudad, sus gentes y sus sabores.' },
    { question: '¿Cuándo nació nuestro primer restaurante?', answer: 'En 2010, gracias al esfuerzo constante y a la pasión por nuestra tierra y nuestra cocina, dimos vida a nuestro primer restaurante en la emblemática calle Julio Antonio de Valencia.' },
    { question: '¿De dónde viene el nombre Jofemar y cómo ha crecido nuestra familia?', answer: 'Lo llamamos Jofemar porque es una mezcla de los nombres de nuestra familia en ese momento: Josué, nuestro primer hijo; Mariana, la madre; y Fernando, el padre. Hoy, la familia ha crecido con la llegada de dos nuevos miembros, Thiago y Samantha, quienes llenan nuestro hogar y nuestro restaurante de alegría y energía renovada.' },
    { question: '¿Qué significa nuestro lema?', answer: 'El primer local, aunque pequeño, se convirtió en un refugio lleno de sabor y cariño. Así nació nuestro eslogan: “Un rinconcito pequeño con el corazón grande”.' },
    { question: '¿Qué representa Jofemar hoy?', answer: 'Después de varios años de éxito y reconocimiento, seguimos creciendo como punto de encuentro para los amantes de la auténtica gastronomía peruana en Valencia. En Jofemar, cada plato cuenta una historia, cada ingrediente es una herencia y cada cliente es parte de nuestra familia.' }
  ];

  openDailyMenu(): void { this.dailyMenuClosing = false; this.showDailyMenuModal = true; }
  closeDailyMenu(): void {
    this.showDailyMenuModal = false;
    this.dailyMenuClosing = true;
    window.setTimeout(() => { this.dailyMenuClosing = false; }, 600);
  }

  // The public menu comes exclusively from the database.
  menuCategories: MenuCategory[] = [];
  private groupApiItems(items: ApiMenuItem[]): MenuCategory[] {
    const categories = new Map<string, MenuCategory>();

    for (const item of items) {
      const categoryId = this.toSlug(item.category);
      let category = categories.get(categoryId);
      if (!category) {
        category = { id: categoryId, title: item.category, isOpen: false, items: [] };
        categories.set(categoryId, category);
      }

      const menuItem: MenuItem = {
        name: item.name,
        price: item.price,
        allergens: item.allergens,
        image: item.image,
        description: item.description,
        active: item.active !== false
      };

      if (!item.subcategory) {
        category.items!.push(menuItem);
        continue;
      }

      category.items = undefined;
      category.subcategories ??= [];
      const subcategoryId = this.toSlug(item.subcategory);
      let subcategory = category.subcategories.find((entry) => entry.id === subcategoryId);
      if (!subcategory) {
        subcategory = { id: subcategoryId, title: item.subcategory, isOpen: false, items: [] };
        category.subcategories.push(subcategory);
      }
      subcategory.items.push(menuItem);
    }

    return [...categories.values()]
      .map((category) => {
        if (category.subcategories) {
          const order = this.subcategoryOrder[category.title] || [];
          category.subcategories.sort((a, b) => {
            const aIndex = order.indexOf(a.title);
            const bIndex = order.indexOf(b.title);
            return (aIndex === -1 ? order.length : aIndex) - (bIndex === -1 ? order.length : bIndex);
          });
        }
        return category;
      })
      .sort((a, b) => this.compareCategories(a.title, b.title));
  }

  private compareCategories(a: string, b: string): number {
    const aIndex = this.categoryOrder.indexOf(a);
    const bIndex = this.categoryOrder.indexOf(b);
    const normalizedA = aIndex === -1 ? this.categoryOrder.length : aIndex;
    const normalizedB = bIndex === -1 ? this.categoryOrder.length : bIndex;
    return normalizedA - normalizedB || a.localeCompare(b);
  }

  private toSlug(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

  openCategory(category: MenuCategory): void {
    this.setMenuUrl(category.id);
    this.selectedCategory = category;
    this.selectedParentCategory = null;
    setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  openSubcategory(category: MenuCategory, subcategory: MenuSubcategory): void {
    this.setMenuUrl(category.id, subcategory.id);
    this.selectedParentCategory = category;
    this.selectedCategory = { ...category, title: `${category.title} · ${subcategory.title}`, items: subcategory.items, subcategories: undefined };
    setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  closeMenuView(): void {
    if (this.selectedParentCategory) {
      const parent = this.selectedParentCategory;
      this.setMenuUrl(parent.id);
      this.selectedCategory = parent;
      this.selectedParentCategory = null;
      setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }
    this.setMenuUrl();
    this.selectedCategory = null;
    setTimeout(() => document.getElementById('nuestra-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  openDish(item: MenuItem): void {
    this.selectedItem = item;
    document.body.classList.add('modal-open');
  }

  closeDish(): void {
    this.selectedItem = null;
    document.body.classList.remove('modal-open');
  }

  goToMenu(event: Event): void {
    event.preventDefault();
    this.selectedCategory = null;
    this.selectedParentCategory = null;
    this.showAllergens = false;
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

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private setMenuUrl(categoryId?: string, subcategoryId?: string): void {
    const path = categoryId ? `#/${categoryId}${subcategoryId ? `/${subcategoryId}` : ''}` : '#/';
    window.history.pushState({}, '', path);
  }

  private applyUrlSelection(): void {
    const hashPath = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
    if (!hashPath || hashPath === 'login' || hashPath === 'admin') return;
    const [categoryId, subcategoryId] = hashPath.split('/');
    const category = this.menuCategories.find((entry) => entry.id === categoryId);
    if (!category) return;
    if (subcategoryId && category.subcategories) {
      const subcategory = category.subcategories.find((entry) => entry.id === subcategoryId);
      if (subcategory) {
        this.selectedParentCategory = category;
        this.selectedCategory = { ...category, title: `${category.title} · ${subcategory.title}`, items: subcategory.items, subcategories: undefined };
        return;
      }
    }
    this.selectedParentCategory = null;
    this.selectedCategory = category;
  }

  getImageSource(image?: string): string {
    if (!image) return 'assets/images/peru-flag.png';
    return image.startsWith('data:image/') || image.startsWith('http') ? image : `assets/images/${image}`;
  }

  getImageTransform(item: MenuItem): string {
    const [x, y] = (item.imagePosition || '50% 50%').split('%').map(value => Number(value.trim()));
    const zoom = item.imageZoom || 1;
    const availablePan = Math.max(0, zoom - 1) * 50;
    return `translate(${((50 - (Number.isFinite(x) ? x : 50)) / 50) * availablePan}%, ${((50 - (Number.isFinite(y) ? y : 50)) / 50) * availablePan}%) scale(${zoom})`;
  }

  getDishDescription(item: MenuItem): string {
    if (item.description) return item.description;

    const name = item.name.toLowerCase();
    const descriptions: Array<[string, string]> = [
      ['causa acevichada', 'Causa de patata amarilla sazonada con lima, rellena y coronada con pescado marinado al estilo ceviche.'],
      ['causa rellena', 'Patata amarilla prensada con lima y ají amarillo, rellena de una cremosa preparación de pescado y verduras.'],
      ['causa', 'Patata amarilla sazonada con lima y ají amarillo, acompañada de un relleno fresco y sabroso.'],
      ['papa rellena', 'Patata rellena de un guiso casero de carne, cebolla y especias, rebozada y frita hasta quedar dorada.'],
      ['papa a la huancaina', 'Rodajas de patata cocida con la tradicional salsa huancaína de queso, leche, ají amarillo y galleta.'],
      ['ocopa', 'Patata cocida acompañada de salsa de huacatay, queso, leche, cacahuetes y ají amarillo.'],
      ['caldo de gallina', 'Caldo casero reconfortante con gallina, patata, fideos y hierbas aromáticas.'],
      ['tamal', 'Masa de maíz sazonada y cocida al vapor, con un sabroso relleno y envuelta en hoja de plátano.'],
      ['anticuchos', 'Brochetas de corazón de ternera marinadas con ají panca y especias, acompañadas de patata y maíz.'],
      ['ensalada', 'Ensalada fresca de la casa con verduras seleccionadas y un aliño ligero.'],
      ['leche de tigre', 'Marinada cítrica de pescado con lima, cebolla roja, ají y cilantro, servida bien fría.'],
      ['ceviche mixto', 'Pescado, mariscos y cebolla roja marinados en lima, ají y cilantro, acompañados de guarnición peruana.'],
      ['ceviche de pescado', 'Dados de pescado fresco marinados en lima con cebolla roja, ají y cilantro.'],
      ['parihuela', 'Sopa marina intensa con pescado, mariscos, tomate, ají y hierbas, servida bien caliente.'],
      ['marisco', 'Preparación de arroz o pasta salteada con mariscos, verduras y el toque criollo de la casa.'],
      ['pescado', 'Pescado seleccionado preparado con sazón peruana y acompañado de guarnición de la casa.'],
      ['jalea', 'Fritura crujiente de pescado y mariscos con cebolla criolla, lima y salsa de la casa.'],
      ['tallarín', 'Tallarines salteados al wok con verduras, salsa de soja y el ingrediente principal elegido.'],
      ['chaufa', 'Arroz salteado al wok con huevo, cebolleta, salsa de soja y el ingrediente principal del plato.'],
      ['aeropuerto', 'Combinación de arroz chaufa y tallarines salteados al wok con verduras y salsa de soja.'],
      ['lomo saltado', 'Tiras de ternera salteadas con cebolla, tomate, cilantro y salsa de soja, con patatas y arroz.'],
      ['seco', 'Guiso lento de carne con cilantro y especias, servido con frijoles y arroz blanco.'],
      ['arroz con pato', 'Arroz verde aromático preparado con cilantro y acompañado de pato guisado al estilo norteño.'],
      ['pollo broaster', 'Pollo marinado y crujiente, acompañado de patatas fritas y salsa de la casa.'],
      ['ají de gallina', 'Guiso cremoso de gallina deshilachada con ají amarillo, pan, leche y nueces, servido con arroz.'],
      ['chicharrón de cerdo', 'Cerdo cocinado hasta quedar tierno y dorado, servido con camote y salsa criolla.'],
      ['salchipapa', 'Patatas fritas con salchicha dorada y salsas para compartir.'],
      ['tarta', 'Porción de tarta casera elaborada con ingredientes seleccionados y servida lista para disfrutar.'],
      ['crema volteada', 'Postre suave de huevo, leche y caramelo, con textura cremosa y delicada.'],
      ['helado', 'Helado cremoso de lúcuma, con el sabor dulce y característico de esta fruta peruana.'],
      ['arroz con leche', 'Postre tradicional de arroz cocido lentamente con leche, canela y un toque de limón.'],
      ['mazamorra', 'Postre peruano dulce y cremoso preparado con fruta, canela y especias.'],
      ['chicha morada', 'Bebida tradicional peruana de maíz morado, piña, canela y clavo, servida fría.'],
      ['maracuyá', 'Bebida refrescante de maracuyá con su equilibrio natural entre dulzor y acidez.'],
      ['pisco sour', 'Cóctel peruano de pisco, lima, jarabe de goma y clara de huevo, terminado con amargo de angostura.'],
      ['chilcano', 'Cóctel de pisco con ginger ale, lima y unas gotas de amargo, ligero y refrescante.'],
      ['capitán', 'Cóctel clásico de pisco y vermut rojo, equilibrado y aromático.'],
      ['vino', 'Copa o botella de vino seleccionada para acompañar nuestra cocina.'],
      ['cerveza', 'Cerveza fría servida en el formato elegido.'],
      ['cuzqueña', 'Cerveza peruana de carácter maltoso, servida bien fría.'],
      ['agua', 'Agua mineral servida fría, con o sin gas según la elección.'],
      ['coca cola', 'Refresco de cola servido frío.'],
      ['fanta', 'Refresco de naranja servido frío.'],
      ['seven up', 'Refresco de lima-limón servido frío.'],
      ['nestea', 'Refresco de té con limón servido frío.'],
      ['aquarius', 'Bebida refrescante con sales minerales y sabor ligero.'],
      ['zumo', 'Zumo refrescante de fruta servido frío.'],
      ['chupito', 'Medida de licor servida fría, ideal para terminar la comida.']
    ];

    const match = descriptions.find(([keyword]) => name.includes(keyword));
    return match?.[1] ?? `Preparación de la casa elaborada con ingredientes seleccionados y la sazón peruana de Jofemar.`;
  }

  isFoodItem(item: MenuItem): boolean {
    return !item.image || item.image.toLowerCase().endsWith('.png');
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  trackByName(_: number, item: MenuItem): string {
    return item.name;
  }
}
