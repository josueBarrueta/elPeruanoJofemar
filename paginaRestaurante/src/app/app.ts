import { ConsentComponent } from './consent/consent.component';
import { ConsentService } from './consent/consent.service';
import { SeoService } from './seo.service';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConsentComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'El Peruano Jofemar';
  currentYear = new Date().getFullYear();
  isRouteTransitioning = false;
  showPublicConsent = false;
  private transitionTimer?: number;
  private previousRoutePath: string | null = null;
  constructor(router: Router, seo: SeoService, consent: ConsentService) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        document.body.classList.toggle('admin-route', event.urlAfterRedirects.startsWith('/admin'));
        const routePath = event.urlAfterRedirects.split(/[?#]/, 1)[0];
        this.showPublicConsent = !/^\/(admin|login)(\/|$)/.test(routePath);
        if (this.previousRoutePath === routePath) return;
        const firstNavigation = this.previousRoutePath === null;
        this.previousRoutePath = routePath;
        seo.update(routePath);
        consent.page(routePath);
        // On entry show the page immediately; retain the logo transition between routes.
        if (firstNavigation) return;
        // Animamos únicamente al cambiar de pantalla real, nunca al cambiar de hash.
        this.isRouteTransitioning = false;
        window.requestAnimationFrame(() => {
          this.isRouteTransitioning = true;
          window.clearTimeout(this.transitionTimer);
          this.transitionTimer = window.setTimeout(() => this.isRouteTransitioning = false, 1100);
        });
      }
    });
  }
}
