import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User, UserRole } from '../models/user.model';

interface AuthResponse {
  access_token: string;
  user: User;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    role: UserRole.USER
  };

  const mockAuthResponse: AuthResponse = {
    access_token: 'mock-jwt-token',
    user: mockUser
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should authenticate user and store token', () => {
      const email = 'test@example.com';
      const password = 'password123';

      service.login(email, password).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(localStorage.getItem('currentUser')).toBe(JSON.stringify(mockUser));
        expect(localStorage.getItem('token')).toBe(mockAuthResponse.access_token);
        expect(service.currentUserValue).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });

      req.flush(mockAuthResponse);
    });
  });

  describe('loginWithFingerprint', () => {
    it('should authenticate user with fingerprint and store token', () => {
      const fingerprintHash = 'mock-fingerprint-hash';

      service.loginWithFingerprint(fingerprintHash).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(localStorage.getItem('currentUser')).toBe(JSON.stringify(mockUser));
        expect(localStorage.getItem('token')).toBe(mockAuthResponse.access_token);
        expect(service.currentUserValue).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login/fingerprint');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ fingerprintHash });

      req.flush(mockAuthResponse);
    });
  });

  describe('register', () => {
    it('should register new user', () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const firstName = 'New';
      const lastName = 'User';

      const mockRegisterResponse = {
        message: 'User registered successfully',
        user: mockUser
      };

      service.register(email, password, firstName, lastName).subscribe(response => {
        expect(response).toEqual(mockRegisterResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password, firstName, lastName });

      req.flush(mockRegisterResponse);
    });
  });

  describe('registerFingerprint', () => {
    it('should register fingerprint for existing user', () => {
      const email = 'test@example.com';
      const password = 'password123';
      const fingerprintHash = 'mock-fingerprint-hash';

      const mockResponse = {
        message: 'Fingerprint registered successfully',
        user: mockUser
      };

      service.registerFingerprint(email, password, fingerprintHash).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/fingerprint/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        user: { email, password },
        fingerprint: { fingerprintHash }
      });

      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should clear stored user data and update current user', () => {
      // Setup initial state
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-token');
      service['currentUserSubject'].next(mockUser);

      service.logout();

      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(service.currentUserValue).toBeNull();
    });
  });

  describe('currentUserValue', () => {
    it('should return stored user from localStorage on initialization', () => {
      // First clear storage and configure TestBed
      localStorage.clear();
      TestBed.resetTestingModule();
      
      // Then set up localStorage before creating service
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      // Create new instance of service
      const newService = TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthService]
      }).inject(AuthService);
      
      expect(newService.currentUserValue).toEqual(mockUser);
    });

    it('should return null when no user is stored', () => {
      // First clear storage and configure TestBed
      localStorage.clear();
      TestBed.resetTestingModule();
      
      // Create new instance of service with empty localStorage
      const newService = TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthService]
      }).inject(AuthService);
      
      expect(newService.currentUserValue).toBeNull();
    });
  });
});