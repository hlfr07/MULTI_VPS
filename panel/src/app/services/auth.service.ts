import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthResponse } from '../types/system';

@Injectable({ providedIn: 'root' })
export class AuthService {
  token = signal<string | null>(localStorage.getItem('auth_token'));
  username = signal<string | null>(localStorage.getItem('auth_username'));
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  private persist() {
    const t = this.token();
    const u = this.username();
    if (t) {
      localStorage.setItem('auth_token', t);
    } else {
      localStorage.removeItem('auth_token');
    }
    if (u) {
      localStorage.setItem('auth_username', u);
    } else {
      localStorage.removeItem('auth_username');
    }
  }

  async login(serverUrl: string, user: string, password: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${serverUrl}/api/auth/login`, { username: user, password })
      );
      this.token.set(res.token);
      this.username.set(res.username);
      this.persist();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      this.error.set(msg);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout(serverUrl: string) {
    const token = this.token();
    if (token) {
      try {
        await firstValueFrom(
          this.http.post(`${serverUrl}/api/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } })
        );
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    this.token.set(null);
    this.username.set(null);
    this.persist();
  }
}
