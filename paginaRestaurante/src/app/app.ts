import { Component } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

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
      if (event instanceof NavigationStart) {
        this.isRouteTransitioning = true;
      }
      if (event instanceof NavigationEnd) {
        document.body.classList.toggle('admin-route', event.urlAfterRedirects.startsWith('/admin'));
        window.setTimeout(() => this.isRouteTransitioning = false, 1100);
      }
    });
  }
}
