import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { UserRole } from '../../models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: UserRole.USER
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'register',
      'loginWithFingerprint',
      'registerFingerprint',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        CommonModule,
        ReactiveFormsModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatTabsModule,
      ],
      declarations: [],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should validate login form', () => {
      const form = component.loginForm;
      expect(form.valid).toBeFalsy();

      form.controls['email'].setValue('invalid-email');
      expect(form.controls['email'].valid).toBeFalsy();

      form.controls['email'].setValue('valid@email.com');
      expect(form.controls['email'].valid).toBeTruthy();

      form.controls['password'].setValue('123');
      expect(form.controls['password'].valid).toBeFalsy();

      form.controls['password'].setValue('password123');
      expect(form.controls['password'].valid).toBeTruthy();
    });

    it('should validate register form', () => {
      const form = component.registerForm;
      expect(form.valid).toBeFalsy();

      form.controls['email'].setValue('valid@email.com');
      form.controls['password'].setValue('password123');
      form.controls['confirmPassword'].setValue('different');
      expect(form.hasError('notSame')).toBeTruthy();

      form.controls['confirmPassword'].setValue('password123');
      expect(form.hasError('notSame')).toBeFalsy();
      expect(form.valid).toBeTruthy();
    });
  });

  describe('Login', () => {
    it('should not call login if form is invalid', () => {
      component.onLogin();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should call login and navigate on success', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.and.returnValue(of({
        access_token: 'token',
        user: mockUser,
      }));

      component.loginForm.setValue(credentials);
      component.onLogin();

      expect(authService.login).toHaveBeenCalledWith(
        credentials.email,
        credentials.password,
      );
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Login successful!',
        'Close',
        { duration: 3000 },
      );
    });

    it('should show error message on login failure', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      authService.login.and.returnValue(throwError(() => ({
        error: { message: 'Invalid credentials' },
      })));

      component.loginForm.setValue(credentials);
      component.onLogin();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Invalid credentials',
        'Close',
        { duration: 5000 },
      );
    });
  });

  describe('Register', () => {
    it('should register new user successfully', () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      authService.register.and.returnValue(of({
        message: 'Registration successful',
        user: mockUser,
      }));

      component.registerForm.patchValue(registerData);
      component.onRegister();

      expect(authService.register).toHaveBeenCalledWith(
        registerData.email,
        registerData.password,
        registerData.firstName,
        registerData.lastName
      );
      expect(snackBar.open).toHaveBeenCalledWith(
        'Registration successful! You can now login.',
        'Close',
        { duration: 3000 },
      );
    });
  });

  describe('Fingerprint Authentication', () => {
    it('should handle fingerprint login', () => {
      authService.loginWithFingerprint.and.returnValue(of({
        access_token: 'token',
        user: mockUser,
      }));

      component.onFingerprintLogin();

      expect(authService.loginWithFingerprint).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Fingerprint login successful!',
        'Close',
        { duration: 3000 },
      );
    });

    it('should handle fingerprint registration', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      component.loginForm.setValue(credentials);
      authService.registerFingerprint.and.returnValue(of({
        message: 'Fingerprint registered successfully',
        user: mockUser,
      }));

      component.registerFingerprint();

      expect(authService.registerFingerprint).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Fingerprint registered successfully!',
        'Close',
        { duration: 3000 },
      );
    });
  });
});