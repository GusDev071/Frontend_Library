import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { LoginModel } from '../../interfaces/login-model';
import { LoginServices } from '../../services/login-services';
import { SessionTimeoutService } from '../../services/session-timeout-service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  protected showPassword = false;
  protected isSubmitting = false;
  protected errorMessage: string | null = null;
  protected toastVisible = false;
  protected toastMessage = '';

  protected readonly form = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  protected togglePassword(): void{
    this.showPassword = !this.showPassword;
  }

  constructor(
    private readonly loginServices: LoginServices,
    private readonly sessionTimeoutService: SessionTimeoutService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ){}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe(params => {
      const reason = params.get('reason');
      if (reason === 'session-expired') {
        this.showToast('Vuelve a iniciar sesión.');
        this.router.navigate([], {
          queryParams: { reason: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }else if (reason === 'logout') {
         this.showToast('Sesión cerrada correctamente.');
        this.router.navigate([], {
          queryParams: { reason: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  protected login(): void {
    if (this.isSubmitting) return;

    const username = this.form.controls.username.value?.trim();
    const password = this.form.controls.password.value?.trim();

    if (!username || !password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const loginModel: LoginModel = { 
      username: username, 
      password: password 
    };
    
     this.loginServices
      .login(loginModel)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (res: any) => {
          const tokenRaw =
            res?.token ?? res?.access_token ?? res?.data?.token ?? res?.data?.access_token;

          const token = tokenRaw == null ? '' : String(tokenRaw).trim();
          if (!token) {
            this.errorMessage = 'El login respondió sin token.';
            return;
          }

          localStorage.setItem('token', token);
          localStorage.setItem('bearerToken', `Bearer ${token}`);

          localStorage.setItem('auth', JSON.stringify(res ?? {}));
          this.sessionTimeoutService.start();
          this.router.navigateByUrl('/dashboard').catch(() => {});
        },
        error: (err: any) => {
          const message =
            err?.error?.message ??
            err?.error?.error ??
            err?.message ??
            'No se pudo iniciar sesión. Verifica tus credenciales.';
          this.errorMessage = String(message);
        },
      });
  }

  private showToast(text: string): void {
    this.toastMessage = text;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 4500);
  }

}