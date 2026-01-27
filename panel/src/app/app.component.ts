import { NgIf } from '@angular/common';
import { Component, computed } from '@angular/core';
import { environment } from '../environments/environment';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, LoginComponent, DashboardComponent],
  template: `
    <ng-container *ngIf="!isAuthenticated(); else dashboard">
      <app-login
        [isLoading]="auth.isLoading()"
        [error]="auth.error()"
        (login)="onLogin($event.username, $event.password)"
      ></app-login>
    </ng-container>
    <ng-template #dashboard>
      <app-dashboard
        [serverUrl]="serverUrl"
        [token]="auth.token()!"
        [username]="auth.username() || ''"
        (logout)="onLogout()"
      ></app-dashboard>
    </ng-template>
  `
})
export class AppComponent {
  serverUrl = environment.apiUrl || `${window.location.protocol}//${window.location.hostname}:3001`;
  isAuthenticated = computed(() => !!this.auth.token());

  constructor(public auth: AuthService) {}

  async onLogin(username: string, password: string) {
    await this.auth.login(this.serverUrl, username, password);
  }

  async onLogout() {
    await this.auth.logout(this.serverUrl);
  }
}
