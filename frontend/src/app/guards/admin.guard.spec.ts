import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AdminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const adminUser = {
    id: '1',
    email: 'admin@example.com',
    role: UserRole.ADMIN
  };

  const regularUser = {
    id: '2',
    email: 'user@example.com',
    role: UserRole.USER
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: regularUser
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AdminGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access to admin users', () => {
    // Set current user to admin
    Object.defineProperty(authService, 'currentUserValue', {
      get: () => adminUser
    });

    expect(guard.canActivate()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should block access to non-admin users and redirect to dashboard', () => {
    // Current user is already set to regular user
    expect(guard.canActivate()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should block access when no user is authenticated', () => {
    // Set current user to null (not authenticated)
    Object.defineProperty(authService, 'currentUserValue', {
      get: () => null
    });

    expect(guard.canActivate()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});