import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  return next(request).pipe(catchError(error => {
    const token = localStorage.getItem('admin_token');
    // Una petición antigua no debe borrar una sesión iniciada después.
    if (error.status === 401 && request.url.startsWith('https://axwxlsai9xocqzi5jvnbebks.2.31.73.77.sslip.io/api/') &&
        !request.url.endsWith('/auth/login') && token && request.headers.get('Authorization') === `Bearer ${token}`) {
      localStorage.removeItem('admin_token');
      void router.navigate(['/login'], { queryParams: { session: 'invalid' }, replaceUrl: true });
    }
    // Los fallos de conexión y los 503 conservan la sesión.
    return throwError(() => error);
  }));
};
