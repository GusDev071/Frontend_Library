import { inject } from '@angular/core';
import { Routes, Router, CanActivateFn } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './pages/dashboard/dashboard';

const authGuard: CanActivateFn =  () =>{
    const router = inject(Router);

    // Compatibilidad con claves antiguas y nuevas.
    const bearer = localStorage.getItem('bearerToken')?.trim() ?? localStorage.getItem('barerToken')?.trim();
    const token = localStorage.getItem('token')?.trim() ?? localStorage.getItem('access_token')?.trim();
    const hasAuth = Boolean(bearer || token);

    if (!hasAuth)  return router.createUrlTree(['/login']);

    const expiresAtRaw = localStorage.getItem('sessionExpiresAt');
    const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : NaN;
    if( Number.isFinite(expiresAt) && Date.now() >= expiresAt){
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('bearerToken');
        localStorage.removeItem('barerToken');
        localStorage.removeItem('auth');
        localStorage.removeItem('sessionExpiresAt');
        localStorage.removeItem('sessionStartedAt');
        return router.createUrlTree(['/login'], {queryParams: {reason: 'session-expired'}});
    }

    return true;
};

export const routes: Routes = [
 { path: '', redirectTo: 'login', pathMatch: 'full' },
 { path: 'login', component: Login },
 { path: 'register', component: Register },
 { 
   path: 'dashboard', 
   component: Dashboard, 
   canActivate: [authGuard],
   children: [
     { path: '', redirectTo: 'books', pathMatch: 'full' },
     { 
       path: 'books', 
       loadComponent: () => import('./pages/dashboard/books/book-list/book-list').then(m => m.BookList)
     },
     { 
       path: 'books/new', 
       loadComponent: () => import('./pages/dashboard/books/book-form/book-form').then(m => m.BookForm)
     },
     { 
       path: 'books/edit/:id', 
       loadComponent: () => import('./pages/dashboard/books/book-form/book-form').then(m => m.BookForm)
     }
   ]
 }
];
