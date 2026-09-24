import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
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
  constructor(router: Router) { router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(event => document.body.classList.toggle('admin-route', event.urlAfterRedirects.startsWith('/admin'))); }
}
