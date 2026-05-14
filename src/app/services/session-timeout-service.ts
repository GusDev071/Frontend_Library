import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

type SessionTimeoutReason =  'session-expired';

@Injectable({
  providedIn: 'root',
})
export class SessionTimeoutService {

  private warnTimerId: number | null = null;
  private logoutTimerId: number | null = null;
  private isLoggingOut = false;

  constructor(private readonly router: Router) {}

  public start(options?: {sessionMs?: number, warnBeforeMs?: number}): void{
    const sessionMs = options?.sessionMs ?? 60 * 60 * 1000;
    const warnBeforeMs = options?.warnBeforeMs ?? 5 * 60 * 1000; 

    const now = Date.now();
    const expiresAt = now + sessionMs;
    localStorage.setItem('sessionExpiresAt', String(expiresAt));
    localStorage.setItem('sessionStartedAt', String(now));

    this.schedule(expiresAt, warnBeforeMs);
  }

  public initFromStorage(options?: { warnBeforeMs?: number; sessionMsIfMissing?: number }): void {
    const warnBeforeMs = options?.warnBeforeMs ?? 5 * 60 * 1000;
    const sessionMsIfMissing = options?.sessionMsIfMissing ?? 60 * 60 * 1000;

    // Compatibilidad con claves antiguas y nuevas.
    const bearer = localStorage.getItem('bearerToken')?.trim() ?? localStorage.getItem('barerToken')?.trim();
    const token = localStorage.getItem('token')?.trim() ?? localStorage.getItem('access_token')?.trim();
    const hasAuth = Boolean(bearer || token);

    if (!hasAuth) {
      this.stop();
      return;
    }

     const raw = localStorage.getItem('sessionExpiresAt');
    const expiresAt = raw ? Number(raw) : NaN;
    if (!Number.isFinite(expiresAt)) {
      this.start({ sessionMs: sessionMsIfMissing, warnBeforeMs });
      return;
    }

    if (Date.now() >= expiresAt) {
      this.logout('session-expired');
      return;
    }

    this.schedule(expiresAt, warnBeforeMs);

  }

  private schedule(expiresAt: number, warnBeforeMs: number): void {
    this.stop();


    const now = Date.now();
    const remainingMS = expiresAt - now;

    if (remainingMS <= 0) {
      this.logout('session-expired');
      return;
    }

    const warnInMs = Math.max(0, remainingMS - warnBeforeMs);
    this.warnTimerId = window.setTimeout(() => {
      if(this.isLoggingOut) return;
      alert('Tu sesión está por expirar. Por favor, guarda tu trabajo.');
    }, warnInMs);

    this.logoutTimerId = window.setTimeout(() => {
      this.logout('session-expired');
    }, remainingMS);
  }

  public stop(): void {
    if (this.warnTimerId != null) {
      clearTimeout(this.warnTimerId);
      this.warnTimerId = null;
    }
    if (this.logoutTimerId != null) {
      clearTimeout(this.logoutTimerId);
      this.logoutTimerId = null;
    }
  }

  private logout(reason:SessionTimeoutReason): void{
    if(this.isLoggingOut) return;
    this.isLoggingOut = true;
    this.stop();

    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('bearerToken');
    localStorage.removeItem('barerToken');
    localStorage.removeItem('auth');
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('sessionStartedAt');

    this.router.navigate(['/login'], { queryParams: { reason } });

  }

}
