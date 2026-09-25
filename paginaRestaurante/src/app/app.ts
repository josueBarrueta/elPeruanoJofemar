import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'El Peruano Jofemar';
  currentYear = new Date().getFullYear();
  isRouteTransitioning = true;
  private transitionTimer?: number;
  private previousRoutePath: string | null = null;
  constructor(router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        document.body.classList.toggle('admin-route', event.urlAfterRedirects.startsWith('/admin'));
        const routePath = event.urlAfterRedirects.split(/[?#]/, 1)[0];
        if (this.previousRoutePath === routePath) return;
        this.previousRoutePath = routePath;
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
