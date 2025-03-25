import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  hidePassword = true;
  hideRegisterPassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.checkPasswords },
    );
  }

  ngOnInit(): void {
    // If user is already logged in, redirect to dashboard
    if (this.authService.currentUserValue) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );
  }

  private passwordMatchValidator(group: FormGroup): ValidationErrors | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    return password &&
      confirmPassword &&
      password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notSame: true };
  }

  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
        if (response.user.role === UserRole.ADMIN) {
          this.snackBar.open('Welcome Administrator!', 'Close', {
            duration: 3000,
          });
        }
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open(
          error?.error?.message ||
            'Login failed. Please check your credentials.',
          'Close',
          { duration: 5000 },
        );
        this.isLoading = false;
      },
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password, firstName, lastName } = this.registerForm.value;

    this.authService.register(email, password, firstName, lastName).subscribe({
      next: () => {
        this.snackBar.open(
          'Registration successful! You can now login.',
          'Close',
          { duration: 3000 },
        );
        this.isLoading = false;
        this.registerForm.reset();
      },
      error: (error) => {
        this.snackBar.open(
          error?.error?.message || 'Registration failed. Please try again.',
          'Close',
          { duration: 5000 },
        );
        this.isLoading = false;
      },
    });
  }

  onFingerprintLogin() {
    // Simulated fingerprint hash - in a real app this would come from a fingerprint reader
    const fingerprintHash = 'simulated-fingerprint-hash';
    this.isLoading = true;

    this.authService.loginWithFingerprint(fingerprintHash).subscribe({
      next: () => {
        this.snackBar.open('Fingerprint login successful!', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.snackBar.open(
          error.error.message || 'Fingerprint login failed',
          'Close',
          { duration: 3000 },
        );
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  registerFingerprint() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      // Simulated fingerprint hash - in a real app this would come from a fingerprint reader
      const fingerprintHash = 'simulated-fingerprint-hash';
      this.isLoading = true;

      this.authService
        .registerFingerprint(email!, password!, fingerprintHash)
        .subscribe({
          next: () => {
            this.snackBar.open(
              'Fingerprint registered successfully!',
              'Close',
              { duration: 3000 },
            );
          },
          error: (error) => {
            this.snackBar.open(
              error.error.message || 'Failed to register fingerprint',
              'Close',
              { duration: 3000 },
            );
          },
          complete: () => {
            this.isLoading = false;
          },
        });
    }
  }
}
