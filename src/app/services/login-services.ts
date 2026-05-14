import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import  {environment} from '../../environments/environment';
import { LoginModel } from '../interfaces/login-model';

@Injectable({
  providedIn: 'root',
})
export class LoginServices {

  apiUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) {}

  login(loginModel: LoginModel) {
    return this.httpClient.post(`${this.apiUrl}/api/auth/login`, loginModel);
  }
}
