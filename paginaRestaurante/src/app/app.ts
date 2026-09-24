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
  isRouteTransitioning = false;
  constructor(router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        document.body.classList.toggle('admin-route', event.urlAfterRedirects.startsWith('/admin'));
        // La transición se muestra una sola vez, al terminar de entrar en la nueva pantalla.
        this.isRouteTransitioning = true;
        window.setTimeout(() => this.isRouteTransitioning = false, 1100);
      }
    });
  }
}
