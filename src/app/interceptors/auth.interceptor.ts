import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Ignorar check si es el propio login o rutinas de registro
  if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')) {
    return next(req);
  }

  const bearer = localStorage.getItem('bearerToken')?.trim() ?? localStorage.getItem('barerToken')?.trim();
  const token = bearer || (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : null);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: token,
      },
    });
  }

  return next(req);
};
