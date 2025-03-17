import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { User, UserRole, CreateUserDto, UpdateUserDto } from '../models/user.model';

describe('UsersService', () => {
  let service: UsersService;
  let controller: HttpTestingController;
  const API_URL = 'http://localhost:3000'; // The API URL used in the service

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User'
    },
    {
      id: '2',
      email: 'user@example.com',
      role: UserRole.USER,
      firstName: 'Regular',
      lastName: 'User'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService]
    });

    service = TestBed.inject(UsersService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify(); // Ensure that there are no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should return all users', () => {
      service.getUsers().subscribe({
        next: (users) => {
          expect(users.length).toBe(2);
          expect(users).toEqual(mockUsers);
        }
      });

      const req = controller.expectOne(`${API_URL}/users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should handle error when getting users fails', (done) => {
      const errorMessage = 'Server error';
      
      service.getUsers().subscribe({
        next: () => {
          done.fail('Should have failed with 500 error');
        },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(error.error).toBe(errorMessage);
          done();
        }
      });

      const req = controller.expectOne(`${API_URL}/users`);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getUser', () => {
    it('should return a single user by id', () => {
      const userId = '1';
      const user = mockUsers.find(u => u.id === userId)!;

      service.getUser(userId).subscribe({
        next: (result) => {
          expect(result).toEqual(user);
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(user);
    });

    it('should handle 404 when user is not found', (done) => {
      const userId = 'nonexistent';
      
      service.getUser(userId).subscribe({
        next: () => {
          done.fail('Should have failed with 404 error');
        },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe('User not found');
          done();
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}`);
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle invalid user id', () => {
      const userId = '';

      service.getUser(userId).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(400);
          expect(error.error).toBe('Invalid user ID');
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}`);
      req.flush('Invalid user ID', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('createUser', () => {
    const newUser: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.USER
    };

    it('should create a user successfully', () => {
      const createdUser: User = {
        id: '3',
        email: newUser.email,
        role: newUser.role!,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      };

      service.createUser(newUser).subscribe({
        next: (result) => {
          expect(result).toEqual(createdUser);
        }
      });

      const req = controller.expectOne(`${API_URL}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      req.flush(createdUser);
    });

    it('should handle conflict when email exists', (done) => {
      const newUser: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER
      };

      service.createUser(newUser).subscribe({
        next: () => {
          done.fail('Should have failed with 409 error');
        },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(409);
          expect(error.error).toBe('Email already exists');
          done();
        }
      });

      const req = controller.expectOne(`${API_URL}/users`);
      req.flush('Email already exists', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateUser', () => {
    const updateData: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    it('should update user successfully', () => {
      const userId = '1';
      const updatedUser: User = {
        ...mockUsers[0],
        ...updateData
      };

      service.updateUser(userId, updateData).subscribe({
        next: (result) => {
          expect(result).toEqual(updatedUser);
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedUser);
    });

    it('should handle 404 when updating non-existent user', () => {
      const userId = 'nonexistent';
      
      service.updateUser(userId, updateData).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe('User not found');
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}`);
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', () => {
      const userId = '1';

      service.deleteUser(userId).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle 404 when deleting non-existent user', () => {
      const userId = 'nonexistent';
      
      service.deleteUser(userId).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe('User not found');
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}`);
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateProfile', () => {
    const profileData: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Profile'
    };

    it('should update profile successfully', () => {
      const userId = '1';
      const updatedUser: User = {
        ...mockUsers[0],
        ...profileData
      };

      service.updateProfile(userId, profileData).subscribe({
        next: (result) => {
          expect(result).toEqual(updatedUser);
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}/profile`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(profileData);
      req.flush(updatedUser);
    });

    it('should handle 404 when updating non-existent profile', () => {
      const userId = 'nonexistent';
      
      service.updateProfile(userId, profileData).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe('User not found');
        }
      });

      const req = controller.expectOne(`${API_URL}/users/${userId}/profile`);
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
    });
  });
});