import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class NavbarComponent {
  @Output() menuClick = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMenu() {
    this.menuClick.emit();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}