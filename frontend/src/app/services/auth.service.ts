import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole } from '../models/user.model';

// Environment URL - would typically be in an environment file
const API_URL = 'http://localhost:3000';

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

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  loginWithFingerprint(fingerprintHash: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login/fingerprint`, { fingerprintHash })
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  register(email: string, password: string, firstName: string, lastName: string): Observable<any> {
    return this.http.post(`${API_URL}/auth/register`, { email, password, firstName, lastName });
  }

  registerFingerprint(email: string, password: string, fingerprintHash: string): Observable<any> {
    return this.http.post(`${API_URL}/auth/fingerprint/register`, {
      user: { email, password },
      fingerprint: { fingerprintHash }
    });
  }

  updateCurrentUser(user: User): void {
    const currentUser = this.currentUserValue;
    if (currentUser && this.isBrowser) {
      const updatedUser = { ...currentUser, ...user };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
    this.currentUserSubject.next(null);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      localStorage.setItem('token', response.access_token);
    }
    this.currentUserSubject.next(response.user);
  }
}