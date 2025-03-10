import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

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
    MatTabsModule
  ]
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
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.checkPasswords });
  }

  ngOnInit(): void {}

  // Custom validator to check if passwords match
  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notSame: true };
  }

  // Login with email and password
  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message || 'Login failed. Please check your credentials.', 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  // Register new user
  onRegister() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.registerForm.value;

    this.authService.register(email, password).subscribe({
      next: () => {
        this.snackBar.open('Registration successful! You can now login.', 'Close', { duration: 3000 });
        // Switch to login tab
        this.isLoading = false;
        // Reset form
        this.registerForm.reset();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message || 'Registration failed. Please try again.', 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  // Login with fingerprint
  onFingerprintLogin() {
    // In a real implementation, this would interact with the actual fingerprint hardware
    // For now, we're using a mock implementation
    
    // Generate a mock fingerprint hash (in reality, this would come from the fingerprint reader)
    const mockFingerprintHash = 'mock-fingerprint-hash-' + Math.random().toString(36).substring(2);
    
    this.isLoading = true;
    this.authService.loginWithFingerprint(mockFingerprintHash).subscribe({
      next: () => {
        this.snackBar.open('Fingerprint login successful!', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message || 'Fingerprint login failed. Please try again or use email/password.', 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  // Function to register a fingerprint for the current user
  registerFingerprint() {
    if (this.loginForm.invalid) {
      this.snackBar.open('Please enter valid email and password first.', 'Close', { duration: 3000 });
      return;
    }

    const { email, password } = this.loginForm.value;
    
    // Generate a mock fingerprint hash (in reality, this would come from the fingerprint reader)
    const mockFingerprintHash = 'mock-fingerprint-hash-' + Math.random().toString(36).substring(2);
    
    this.isLoading = true;
    this.authService.registerFingerprint(email, password, mockFingerprintHash).subscribe({
      next: () => {
        this.snackBar.open('Fingerprint registered successfully!', 'Close', { duration: 3000 });
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message || 'Fingerprint registration failed. Please try again.', 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }
}