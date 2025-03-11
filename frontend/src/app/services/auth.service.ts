import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// Environment URL - would typically be in an environment file
const API_URL = 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  access_token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface FingerprintRequest {
  fingerprintHash: string;
}

export interface RegisterFingerprintRequest {
  user: LoginRequest;
  fingerprint: FingerprintRequest;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject: BehaviorSubject<User | null>;
  public readonly currentUser$: Observable<User | null>;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    let storedUser: string | null = null;
    if (this.isBrowser) {
      storedUser = localStorage.getItem('currentUser');
    }
    
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Get the current logged in user
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login with email and password
   * @param email User's email
   * @param password User's password
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            // Save user to local storage and update current user subject
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('token', response.access_token);
          }
          this.currentUserSubject.next(response.user);
        })
      );
  }

  /**
   * Login with fingerprint
   * @param fingerprintHash User's fingerprint hash
   */
  loginWithFingerprint(fingerprintHash: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login/fingerprint`, { fingerprintHash })
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            // Save user to local storage and update current user subject
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('token', response.access_token);
          }
          this.currentUserSubject.next(response.user);
        })
      );
  }

  /**
   * Register a new user
   * @param email User's email
   * @param password User's password
   */
  register(email: string, password: string): Observable<any> {
    return this.http.post(`${API_URL}/auth/register`, { email, password });
  }

  /**
   * Register a fingerprint for an existing user
   * @param email User's email
   * @param password User's password
   * @param fingerprintHash User's fingerprint hash
   */
  registerFingerprint(email: string, password: string, fingerprintHash: string): Observable<any> {
    return this.http.post(`${API_URL}/auth/fingerprint/register`, {
      user: { email, password },
      fingerprint: { fingerprintHash }
    });
  }

  /**
   * Logout the current user
   */
  logout() {
    if (this.isBrowser) {
      // Remove user from local storage and update current user subject
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
    this.currentUserSubject.next(null);
  }
}