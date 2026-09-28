import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';
import { ReviewsComponent } from './reviews/reviews.component';
import { DailyMenuAdminComponent } from './daily-menu-admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'resenas', component: ReviewsComponent },
  { path: 'menu-del-dia', component: DailyMenuAdminComponent, canActivate: [authGuard] },
  { path: ':category/:subcategory', component: HomeComponent },
  { path: ':category', component: HomeComponent },
  { path: '**', redirectTo: '' }
];
