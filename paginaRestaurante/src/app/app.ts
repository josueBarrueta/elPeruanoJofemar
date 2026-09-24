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
  constructor(router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        document.body.classList.toggle('admin-route', event.urlAfterRedirects.startsWith('/admin'));
        // Reiniciamos una única animación al entrar en la pantalla nueva.
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
