import { REVIEWS } from './reviews.data';
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
  readonly reviews: Review[] = REVIEWS;

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
