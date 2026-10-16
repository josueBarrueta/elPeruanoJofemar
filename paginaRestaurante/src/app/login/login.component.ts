import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  email = '';
  password = '';
  error = inject(ActivatedRoute).snapshot.queryParamMap.get('session') === 'invalid' ? 'La sesión ya no es válida. Vuelve a entrar para continuar.' : '';
  showPassword = false;
  loading = false;

  login(): void {
    if (this.loading) return;
    this.error = '';
    this.loading = true;
    this.auth.login(this.email, this.password).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (response) => this.error = response.status === 401
        ? 'El correo o la contraseña no son correctos. Inténtalo de nuevo.'
        : 'No hemos podido conectar. Espera un momento y vuelve a intentarlo.'
    });
  }
}
