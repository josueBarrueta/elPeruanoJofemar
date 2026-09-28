import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';

export interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
  source: string;
  initials: string;
  food?: number;
  service?: number;
  atmosphere?: number;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewsComponent implements OnInit, OnDestroy {
  constructor(private readonly changeDetector: ChangeDetectorRef) {}
  readonly reviews: Review[] = [
    {
      author: 'Maria GS',
      rating: 5,
      date: '2 years ago',
      text: 'No soy especialmente amante de la comida peruana, por eso me sorprendieron aún más la comida y el servicio de este restaurante. Además, fue muy fácil encontrar una mesa para 3 un viernes por la noche sin reservar. Lo que más disfruté fueron los entrantes. Buenas cantidades y una excelente relación calidad-precio. Sin duda lo recomiendo.',
      source: 'Google',
      initials: 'MG',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Najim',
      rating: 5,
      date: 'a year ago',
      text: 'Pequeño restaurante peruano. ¡La comida es increíble! Los precios son muy correctos, unos 10-13 € por plato principal. Me gustó mucho y volveré. El personal también es amable y atento. Tienen una pequeña terraza exterior en una calle tranquila. ¡Una experiencia muy agradable!',
      source: 'Google',
      initials: 'N',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Erez Peretz',
      rating: 4,
      date: '4 years ago',
      text: 'Ceviche bastante auténtico, aunque con demasiada cebolla. Los tallarines están buenos. El servicio fue muy acogedor.',
      source: 'Google',
      initials: 'EP'
    },
    {
      author: 'Liliana Peinado',
      rating: 5,
      date: 'a year ago',
      text: 'Hemos disfrutado mucho de la comida, ¡estaba deliciosa! El servicio también fue muy amable y pasamos un buen rato en familia.',
      source: 'Google',
      initials: 'LP',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'John Peerless',
      rating: 5,
      date: '3 years ago',
      text: 'Comida casera realmente fantástica. Me quedé satisfecho y lleno durante bastante tiempo después del variado y colorido plato que probé.',
      source: 'Google',
      initials: 'JP'
    },
    {
      author: 'Lalalala',
      rating: 5,
      date: 'a year ago',
      text: '¡¡Comida peruana auténtica!! Muy bien, ¡¡realmente muy buena!! ⸜(｡˃ ᵕ ˂ )⸝',
      source: 'Google',
      initials: 'L',
      food: 5,
      service: 5,
      atmosphere: 3
    },
    {
      author: 'Emil Krause',
      rating: 5,
      date: '2 years ago',
      text: 'Tomé aquí un menú del día increíble.',
      source: 'Google',
      initials: 'EK'
    },
    {
      author: 'Roman Stepanenko',
      rating: 5,
      date: '3 years ago',
      text: 'Ceviche excelente. Servicio agradable.',
      source: 'Google',
      initials: 'RS',
      food: 5,
      service: 5,
      atmosphere: 4
    },
    {
      author: 'Dario Melguizo Sanchis',
      rating: 5,
      date: '8 years ago',
      text: 'Excelente comida y servicio.',
      source: 'Google',
      initials: 'DM'
    },
    {
      author: 'Tania Quezada',
      rating: 5,
      date: '2 months ago',
      text: 'Todo estaba delicioso. Fuimos entre semana y su menú del día estaba muy bueno. Pedí anticuchos de entrante y seco de pollo con frijoles de plato principal. Incluía postre y bebida por 13,50 €. El servicio fue excelente y sin duda volveré.',
      source: 'Google',
      initials: 'TQ',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Ana Patricia Diaz Merino',
      rating: 5,
      date: '3 months ago',
      text: '¡Siempre es un acierto! Es un restaurante familiar y acogedor al que da gusto ir. No esperes un lujo de cinco estrellas, pero la relación calidad-precio es excelente. Todo lo de la carta está delicioso: el menú del día merece mucho la pena, el ceviche y la leche de tigre son espectaculares y los anticuchos están increíbles. Lo mejor, sin duda, es el servicio; el personal es encantador y te hace sentir como en casa. ¡Muy recomendable!',
      source: 'Google',
      initials: 'AP',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Jenn FMD',
      rating: 5,
      date: '6 months ago',
      text: 'Era nuestra primera vez allí y no pudo ir mejor. Todo estaba exquisito, el servicio fue rápido y el trato espectacular. El ceviche estaba delicioso, el pescado frito fue espectacular; todo estuvo de diez.',
      source: 'Google',
      initials: 'JF',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Carmen Perales',
      rating: 5,
      date: '6 years ago',
      text: 'Hoy comí con mi pareja para celebrar mi santo. Nos encanta comer en este restaurante por varios motivos. Para empezar, la comida es deliciosa y el personal es cercano y amable. He ido varias veces y cada vez pruebo un plato diferente. ¡Me encanta! ¡Volveremos!',
      source: 'Google',
      initials: 'CP'
    },
    {
      author: 'David Gómez',
      rating: 5,
      date: '7 months ago',
      text: '¡El ceviche estaba delicioso! Tomé el menú del día y tiene una relación calidad-precio excelente. El servicio fue fantástico.',
      source: 'Google',
      initials: 'DG',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Periwell',
      rating: 5,
      date: 'Edited a year ago',
      text: 'No es fácil preparar buena comida tradicional lejos de su país de origen, pero en Jofemar lo han conseguido excepcionalmente bien. Las raciones son generosas y el sazón es excelente. El servicio es amable y rápido. Aunque algunos días está lleno, el servicio siempre es bueno. El restaurante tiene aire acondicionado y la camarera es muy amable y atenta. He probado el lomo saltado, el seco de ternera con frijoles, el ají de gallina, los anticuchos, las papas a la huancaína y la jalea, y puedo confirmar que cada vez que he ido la comida ha estado deliciosa. Espero que sigan así para poder volver y probar más platos peruanos tradicionales.',
      source: 'Google',
      initials: 'P'
    },
    {
      author: 'Ma Carmen',
      rating: 5,
      date: '8 years ago',
      text: 'La comida estaba deliciosa, auténtica comida peruana, y el personal fue amable y eficiente. El local, decorado con motivos peruanos, está limpio y ordenado. Las raciones son generosas, como en Perú, y muy buenas: el ceviche, los anticuchos, el lomo... y para acompañarlo, un pisco sour. ¡Riquísimo! Ya hemos ido varias veces y sin duda volveremos.',
      source: 'Google',
      initials: 'MC'
    },
    {
      author: 'RafaNelia FabraFabra',
      rating: 5,
      date: '5 years ago',
      text: 'Bar peruano con deliciosa comida tradicional. Tienen un menú de mediodía entre semana con una excelente relación calidad-precio. Su clientela no es solo española, también hay muchos peruanos, lo cual es significativo. Tienen terraza. Nos encantó el ceviche de pescado y los anticuchos también estaban muy buenos.',
      source: 'Google',
      initials: 'RF'
    },
    {
      author: 'Celia GM',
      rating: 5,
      date: '7 years ago',
      text: 'Es un restaurante peruano fantástico. La comida es casera, típica de Perú, deliciosa y llena de sabor, y las raciones son generosas. Además, tiene una excelente relación calidad-precio. El servicio y la atención son magníficos. El local es muy acogedor y cómodo. Lo recomiendo totalmente.',
      source: 'Google',
      initials: 'CG'
    },
    {
      author: 'Alejandra Contreras',
      rating: 5,
      date: 'a year ago',
      text: 'Solo sé que la comida es excelente y el sazón es buenísimo. La primera vez que probé comida peruana fue aquí, y menos mal, porque después fui a otro restaurante peruano pensando que todos serían igual de buenos, ¡y no fue así!',
      source: 'Google',
      initials: 'AC',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Kiefer leonel Ferreyra coloma',
      rating: 5,
      date: '3 months ago',
      text: '¡Muy recomendable! El ceviche mixto con jalea y el arroz chaufa de marisco estaban deliciosos, y el sazón era de primera. ¡La experiencia no pudo ser mejor! Sin duda volveremos. ¡Gracias, Miriam!',
      source: 'Google',
      initials: 'KF'
    },
    {
      author: 'Sy Yh',
      rating: 5,
      date: '8 months ago',
      text: '¡Perfecto! Comida 100 % peruana, ¡estaba deliciosa!',
      source: 'Google',
      initials: 'SY',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Mar Barber',
      rating: 5,
      date: '4 years ago',
      text: 'Restaurante con una comida excelente. Raciones generosas y un servicio muy atento. En general, es un lugar muy familiar. 100 % recomendable.',
      source: 'Google',
      initials: 'MB'
    },
    {
      author: 'Mirella Verastegui',
      rating: 5,
      date: '3 months ago',
      text: 'Disfruté mucho de la comida, lo recomiendo totalmente; es como estar en mi hermoso Perú.',
      source: 'Google',
      initials: 'MV'
    },
    {
      author: 'Allison Huachaca',
      rating: 5,
      date: '7 years ago',
      text: 'El menú del día cuesta 8,50 € entre semana y todo está absolutamente delicioso. El servicio fue excelente y la comida llegó rápido. Es uno de los mejores restaurantes peruanos en los que he estado. El ceviche y el pollo a la brasa son 100 % recomendables.',
      source: 'Google',
      initials: 'AH'
    },
    {
      author: 'Alex Saavedra',
      rating: 5,
      date: '2 years ago',
      text: 'Un lugar muy agradable, con una comida y un sazón excelentes. Los precios son bastante razonables y quedé muy satisfecho.',
      source: 'Google',
      initials: 'AS',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'paola aracelli quiroz rios',
      rating: 5,
      date: 'a month ago',
      text: 'Comida deliciosa y servicio excelente. Siempre voy allí con mi familia.',
      source: 'Google',
      initials: 'PA',
      food: 5,
      service: 5,
      atmosphere: 5
    },
    {
      author: 'Jana B.',
      rating: 5,
      date: '8 years ago',
      text: 'Por fin, comida peruana auténtica en Valencia a precios muy competitivos. El local no es precisamente lujoso, pero si quieres comida peruana de verdad, este es el sitio, con una carta muy amplia y variada.',
      source: 'Google',
      initials: 'JB'
    },
    {
      author: 'Sheila Mateo',
      rating: 5,
      date: '9 months ago',
      text: '¡Un lugar realmente estupendo! El arroz chaufa está delicioso, el ceviche también y muchos otros platos. El servicio es muy amable y atento. Es verdad que el restaurante no es muy grande, pero caben bastantes personas; juntando las mesas pueden sentarse unas ocho. ¡Recomiendo mucho ir a Jofemar si buscas comida peruana auténtica!',
      source: 'Google',
      initials: 'SM',
      food: 5,
      service: 5,
      atmosphere: 4
    },
    {
      author: 'Erick BP SAMP',
      rating: 5,
      date: '4 years ago',
      text: 'Un lugar precioso, el servicio fue excelente y rápido, y me sorprendió gratamente. Productos de calidad para satisfacer el paladar. Ideal para una cena con amigos o una celebración de cumpleaños. En conclusión, ¡muy recomendable para quienes disfrutan de la gastronomía peruana!',
      source: 'Google',
      initials: 'EB'
    },
    {
      author: 'Rosma',
      rating: 5,
      date: 'Edited 5 years ago',
      text: 'La comida estaba realmente buena; me recordó a esos platos caseros que comes cuando vives en tu tierra 😊🤣👏👌',
      source: 'Google',
      initials: 'R'
    },
    {
      author: 'ED',
      rating: 5,
      date: '4 years ago',
      text: 'Bueno y barato. Lo tiene todo: precios asequibles, raciones generosas, comida sabrosa y un servicio inmejorable.',
      source: 'Google',
      initials: 'ED'
    },
    {
      author: 'Marco De Rossi',
      rating: 4,
      date: '6 years ago',
      text: 'Es un restaurante peruano agradable, los platos principales eran bastante abundantes y sabrosos. Los entrantes son un poco pequeños y me pareció que faltaba un sazón peruano más intenso, quizá para adaptarse al paladar español.',
      source: 'Google',
      initials: 'MR'
    },
    {
      author: 'Saki',
      rating: 4,
      date: '3 years ago',
      text: '¡La comida estaba deliciosa y el servicio fue estupendo! Pensé que los precios podían ser algo altos, pero las raciones eran enormes y un plato fue suficiente para llenarme. Me encantó el pollo frito: estaba crujiente y combinaba perfectamente con una bebida, aunque la próxima vez me gustaría probar también el pollo a la brasa. 😋 ¡Me encantaría volver a probar el Aeropuerto y el ceviche!',
      source: 'Google',
      initials: 'S',
      food: 5,
      service: 5,
      atmosphere: 5
    }
  ];

  readonly overallRating = '4.3';
  readonly overallCount = 749;
  currentIndex = 0;
  selectedReview: Review | null = null;
  isSliding = false;
  cardsPerView = 3;
  isReviewsExpanded = false;
  private touchStartX = 0;
  private touchDeltaX = 0;
  private suppressCardClick = false;
  private autoSlide?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.updateCardsPerView();
    if (this.isReviewsExpanded) this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();
    this.autoSlide = setInterval(() => this.next(), 7500);
  }

  private stopAutoSlide(): void {
    if (this.autoSlide) {
      clearInterval(this.autoSlide);
      this.autoSlide = undefined;
    }
  }

  get filteredReviews(): Review[] {
    return this.reviews.filter(review => review.rating >= 4);
  }

  shortAuthor(author: string): string {
    return author.trim().split(/\s+/)[0] || author;
  }

  toggleReviews(): void {
    this.isReviewsExpanded = !this.isReviewsExpanded;
    if (this.isReviewsExpanded) this.startAutoSlide();
    else this.stopAutoSlide();
    this.changeDetector.markForCheck();
  }

  get visibleReviews(): Review[] {
    const reviews = this.filteredReviews;
    if (reviews.length <= this.cardsPerView) return reviews;
    return Array.from({ length: this.cardsPerView }, (_, offset) => reviews[(this.currentIndex + offset) % reviews.length]);
  }

  @HostListener('window:resize')
  updateCardsPerView(): void {
    const nextCardsPerView = Math.min(6, Math.max(1, Math.floor((window.innerWidth - 160) / 220)));
    if (nextCardsPerView !== this.cardsPerView) {
      this.cardsPerView = nextCardsPerView;
      this.currentIndex = Math.min(this.currentIndex, Math.max(0, this.filteredReviews.length - 1));
      this.changeDetector.markForCheck();
    }
  }

  next(): void {
    if (!this.filteredReviews.length) return;
    this.isSliding = true;
    this.changeDetector.markForCheck();
    setTimeout(() => {
      this.currentIndex = (this.currentIndex + this.cardsPerView) % this.filteredReviews.length;
      this.isSliding = false;
      this.changeDetector.markForCheck();
    }, 380);
  }

  previous(): void {
    if (!this.filteredReviews.length) return;
    this.isSliding = true;
    this.changeDetector.markForCheck();
    setTimeout(() => {
      this.currentIndex = (this.currentIndex - this.cardsPerView + this.filteredReviews.length) % this.filteredReviews.length;
      this.isSliding = false;
      this.changeDetector.markForCheck();
    }, 380);
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.isReviewsExpanded || event.touches.length !== 1) return;
    this.touchStartX = event.touches[0].clientX;
    this.touchDeltaX = 0;
    this.stopAutoSlide();
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isReviewsExpanded || event.touches.length !== 1 || !this.touchStartX) return;
    this.touchDeltaX = event.touches[0].clientX - this.touchStartX;
    if (Math.abs(this.touchDeltaX) > 10) this.suppressCardClick = true;
  }

  onTouchEnd(): void {
    if (!this.isReviewsExpanded || !this.touchStartX) return;
    const swipeDistance = this.touchDeltaX;
    this.touchStartX = 0;
    this.touchDeltaX = 0;
    if (Math.abs(swipeDistance) >= 45) {
      if (swipeDistance < 0) this.next();
      else this.previous();
    }
    this.startAutoSlide();
    window.setTimeout(() => this.suppressCardClick = false, 0);
  }

  openReview(review: Review): void {
    if (this.suppressCardClick) return;
    this.stopAutoSlide();
    this.selectedReview = review;
    this.changeDetector.markForCheck();
  }

  closeReview(): void {
    this.selectedReview = null;
    this.startAutoSlide();
    this.changeDetector.markForCheck();
  }
}
