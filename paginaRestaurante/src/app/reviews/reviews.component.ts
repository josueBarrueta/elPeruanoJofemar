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
      text: 'I am not particularly a Peruvian food lover, this is why I was doubled impressed with the food and the service of this restaurant. First of all, it was dead easy to find a table for 3 on a Friday night without any booking! The starters were especially what I most enjoyed. Nice quantities and good value for money. I would definitely recommend it.',
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
      text: 'Small Peruvian restaurant. The food is amazing!! Price are very correct, around 10-13€ for a main meal. I really liked it and will come back. The staff is friendly and helpful too. They have a small outside terrace in a calm street. Very enjoyable!',
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
      text: 'Quite authentic Ceviche withway too much onion, Tallarines are nice. Service was welcoming.',
      source: 'Google',
      initials: 'EP'
    },
    {
      author: 'Liliana Peinado',
      rating: 5,
      date: 'a year ago',
      text: 'We have enjoyed the food, very delicious! Also very gentle service, together with my family we had a good time.',
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
      text: 'Really fantastic wholesome food. I was satisfyingly full for a while after the varied and colourful dish I had.',
      source: 'Google',
      initials: 'JP'
    },
    {
      author: 'Lalalala',
      rating: 5,
      date: 'a year ago',
      text: 'authentic peruvian food !! muy bien, really really good !! ⸜(｡˃ ᵕ ˂ )⸝',
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
      text: 'Had an amazing menu del dia here',
      source: 'Google',
      initials: 'EK'
    },
    {
      author: 'Roman Stepanenko',
      rating: 5,
      date: '3 years ago',
      text: 'Great ceviche. Pleasant service.',
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
      text: 'Excellent food and service',
      source: 'Google',
      initials: 'DM'
    },
    {
      author: 'Tania Quezada',
      rating: 5,
      date: '2 months ago',
      text: 'Everything was delicious. We went during the week and their daily menu was really good. I ordered anticuchos as a starter and seco de pollo with beans as a main course. It included dessert and a drink for 13.50. The service was excellent and I will definitely return.',
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
      text: "Always a sure bet! It's a family-run, welcoming restaurant that's a pleasure to visit. Don't expect five-star luxury, but the quality-to-price ratio is excellent. Everything on the menu is delicious: the daily set menu is definitely worth it, the ceviche and leche de tigre are spectacular, and the anticuchos are out of this world. Best of all, without a doubt, is the service; the staff is lovely and makes you feel right at home. Highly recommended!",
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
      text: "It was our first time there and it couldn't have been better, everything was exquisite, the service was fast, the treatment was spectacular, the ceviche was delicious, the fried fish was spectacular, everything was a 10.",
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
      text: "Today I had lunch with my partner to celebrate my name day. We really enjoy eating at this restaurant for several reasons. First, the food is delicious, and the staff is warm and friendly. I've been several times, and each time I try a different dish. I love it! We'll be back!",
      source: 'Google',
      initials: 'CP'
    },
    {
      author: 'David Gómez',
      rating: 5,
      date: '7 months ago',
      text: 'The ceviche was delicious! I had the set menu, great value for money. The service was fantastic.',
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
      text: "Making good traditional food far from its country of origin isn't easy, but at Jofemar they've done it exceptionally well. The portions are generous and the seasoning is excellent. The service is friendly and prompt. While it's busy on some days, the service is always good. The restaurant is air-conditioned, and the waitress is very friendly and helpful. I've tried the Lomo Saltado, the Seco de Ternera with beans (white beans that are so perfectly cooked they're almost like a paste), Ají de Gallina, Anticuchos, Papas a la Huancaína, and Jalea, and I can attest that every time I've been (and I travel 59 kilometers from the provinces to Valencia), the food has always been delicious. I hope they continue to do well so I can keep coming back and trying more traditional Peruvian dishes.",
      source: 'Google',
      initials: 'P'
    },
    {
      author: 'Ma Carmen',
      rating: 5,
      date: '8 years ago',
      text: "The food was delicious, authentic Peruvian fare, and the staff was friendly and efficient. The place, decorated with Peruvian themes, is clean and tidy. The portions are generous (just like in Peru) and very good—the ceviche, the anticuchos, the lomo...and then, to wash it all down, a pisco sour...yum! We've been several times already and we'll definitely be back.",
      source: 'Google',
      initials: 'MC'
    },
    {
      author: 'RafaNelia FabraFabra',
      rating: 5,
      date: '5 years ago',
      text: 'Peruvian bar with delicious traditional food. They have a weekday lunch menu with excellent value for money. Their clientele is not only Spanish but also Peruvian, which is significant. They have a terrace. We loved the fish ceviche and the anticuchos were also good.',
      source: 'Google',
      initials: 'RF'
    },
    {
      author: 'Celia GM',
      rating: 5,
      date: '7 years ago',
      text: "It's a fantastic Peruvian restaurant. The food is homemade, typical of Peru, delicious, full of flavor, and the portions are generous. Plus, it's excellent value for money. The service and attention are superb. The place is very cozy and comfortable. I highly recommend it.",
      source: 'Google',
      initials: 'CG'
    },
    {
      author: 'Alejandra Contreras',
      rating: 5,
      date: 'a year ago',
      text: "All I know is that the food is excellent, the seasoning is great. My first time eating Peruvian food was here, and thank goodness, because later I went to another Peruvian restaurant thinking it would all be as good as this one, and it wasn't!",
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
      text: "Highly recommended! The mixed ceviche with jalea and the seafood chaufa rice were delicious, and the seasoning was top-notch. The experience couldn't have been better! We would definitely return! Thank you, Miriam!",
      source: 'Google',
      initials: 'KF'
    },
    {
      author: 'Sy Yh',
      rating: 5,
      date: '8 months ago',
      text: 'Perfect! 100% Peruvian food, the food was delicious!',
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
      text: 'Restaurant with excellent food. Generous portions. Very attentive service. Overall, a very family-friendly place. 100% recommended.',
      source: 'Google',
      initials: 'MB'
    },
    {
      author: 'Mirella Verastegui',
      rating: 5,
      date: '3 months ago',
      text: "I really enjoyed the food there, I highly recommend it; it's like being in my beautiful Peru.",
      source: 'Google',
      initials: 'MV'
    },
    {
      author: 'Allison Huachaca',
      rating: 5,
      date: '7 years ago',
      text: "The set menu costs €8.50 on weekdays and everything is absolutely delicious. The service was excellent and the food arrived quickly. It's one of the best Peruvian restaurants I've ever been to. The ceviche and the rotisserie chicken are 100% recommended.",
      source: 'Google',
      initials: 'AH'
    },
    {
      author: 'Alex Saavedra',
      rating: 5,
      date: '2 years ago',
      text: 'A very nice place, excellent food and seasoning, the prices are quite reasonable, I was very satisfied.',
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
      text: 'Delicious food and excellent service. I always go there with my family.',
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
      text: "Finally, authentic Peruvian food in Valencia at very competitive prices. The place isn't exactly fancy, but if you want real Peruvian food, this is the place, with a very extensive and varied menu.",
      source: 'Google',
      initials: 'JB'
    },
    {
      author: 'Sheila Mateo',
      rating: 5,
      date: '9 months ago',
      text: "A really great place! The chaufa rice is delicious, the ceviche too, and many other dishes. The service is very friendly and helpful. It's true the restaurant isn't very big, but it can fit quite a few people; if you push the tables together, you can seat about eight. I highly recommend going to Jofemar if you're looking for authentic Peruvian food!",
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
      text: 'Beautiful place, the service was excellent and fast, I was pleasantly surprised. Quality products to satisfy our taste buds. Ideal for a dinner with friends or a birthday celebration. In conclusion, highly recommended for those who enjoy Peruvian cuisine!',
      source: 'Google',
      initials: 'EB'
    },
    {
      author: 'Rosma',
      rating: 5,
      date: 'Edited 5 years ago',
      text: 'The food was really good, it reminded me of the home-cooked meals you eat when you live in your homeland 😊🤣👏👌',
      source: 'Google',
      initials: 'R'
    },
    {
      author: 'ED',
      rating: 5,
      date: '4 years ago',
      text: 'Good and cheap. It has it all. Affordable prices, generous portions, tasty food, and unbeatable service.',
      source: 'Google',
      initials: 'ED'
    },
    {
      author: 'Marco De Rossi',
      rating: 4,
      date: '6 years ago',
      text: 'It is a nice Peruvian restaurant, the main dishes were quite abundant and tasty. The starters are a bit small and I felt it lacked a stronger Peruvian spice, maybe due to accommodating to Spanish sensitivity.',
      source: 'Google',
      initials: 'MR'
    },
    {
      author: 'Saki',
      rating: 4,
      date: '3 years ago',
      text: "The food was delicious and the service was great! I thought the prices might be a bit high, but the portions were huge and one dish was enough to fill me up. I loved the fried chicken - it was crunchy and went perfectly with alcohol, but next time I'd like to try the grilled chicken too... 😋 I'd love to try both the Aeropuerto and the ceviche again!",
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
