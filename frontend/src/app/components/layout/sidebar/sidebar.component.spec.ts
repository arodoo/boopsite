import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  const adminUser = {
    id: '1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const regularUser = {
    id: '2',
    email: 'user@example.com',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: regularUser,
    });

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        MatListModule,
        MatIconModule,
        MatExpansionModule,
      ],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should allow access to non-restricted items for regular users', () => {
    // Regular user should have access to Dashboard and My Account
    expect(component.hasPermission()).toBe(true);
    expect(component.hasPermission(undefined)).toBe(true);
    expect(component.hasPermission([])).toBe(true);
  });

  it('should restrict admin routes for non-admin users', () => {
    // Regular user should not have access to admin routes
    expect(component.hasPermission([UserRole.ADMIN])).toBe(false);
  });

  it('should allow admin routes for admin users', () => {
    // Set the current user to admin
    Object.defineProperty(authService, 'currentUserValue', {
      get: () => adminUser,
    });

    // Admin should have access to admin routes
    expect(component.hasPermission([UserRole.ADMIN])).toBe(true);
  });

  it('should filter nav items based on user role', () => {
    // Test with regular user
    Object.defineProperty(authService, 'currentUserValue', {
      get: () => regularUser,
    });

    const testItems = [
      { label: 'Public', route: '/public', icon: 'public' },
      {
        label: 'Admin Only',
        route: '/admin',
        icon: 'admin',
        roles: [UserRole.ADMIN],
      },
    ];

    const filteredItems = component.filterNavItems(testItems);
    expect(filteredItems.length).toBe(1);
    expect(filteredItems[0].label).toBe('Public');

    // Test with admin user
    Object.defineProperty(authService, 'currentUserValue', {
      get: () => adminUser,
    });

    const adminFilteredItems = component.filterNavItems(testItems);
    expect(adminFilteredItems.length).toBe(2);
  });
});
