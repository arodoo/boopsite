import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject } from 'rxjs';
import { UserRole } from '../../models/user.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let mockUserSubject: BehaviorSubject<any>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: UserRole.USER
  };

  beforeEach(async () => {
    mockUserSubject = new BehaviorSubject(mockUser);
    
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUserValue: mockUser,
      currentUser$: mockUserSubject.asObservable()
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
      ],
      declarations: [],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current user', () => {
    expect(component.currentUser).toEqual(mockUser);
  });

  it('should redirect to login if no user is authenticated', () => {
    // Update the mock user subject to simulate user logout
    mockUserSubject.next(null);
    Object.defineProperty(authService, 'currentUserValue', { get: () => null });
    
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should logout and redirect to login page', () => {
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should display user email in the template', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('mat-card-subtitle').textContent)
      .toContain(mockUser.email);
  });
});