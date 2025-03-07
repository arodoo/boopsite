import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      // User is logged in, allow access
      return true;
    }
    
    // User is not logged in, redirect to login page
    this.router.navigate(['/login']);
    return false;
  }
}