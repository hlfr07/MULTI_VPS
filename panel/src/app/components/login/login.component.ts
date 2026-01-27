import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Output() login = new EventEmitter<{ username: string; password: string }>();

  username = '';
  password = '';
  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  submit() {
    if (this.username && this.password) {
      this.login.emit({ username: this.username, password: this.password });
    }
  }
}
