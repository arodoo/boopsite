import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { UserRole } from '../../models/user.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let usersService: jasmine.SpyObj<UsersService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['updateCurrentUser'], {
      currentUserValue: mockUser
    });
    const usersServiceSpy = jasmine.createSpyObj('UsersService', ['updateProfile']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    usersService = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with current user data', () => {
    expect(component.profileForm.value).toEqual({
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      email: mockUser.email
    });
  });

  it('should update profile successfully', () => {
    const updatedUserData = {
      firstName: 'Updated',
      lastName: 'User',
      email: 'updated@example.com'
    };

    component.profileForm.setValue(updatedUserData);
    usersService.updateProfile.and.returnValue(of({
      ...mockUser,
      ...updatedUserData
    }));

    component.onSubmit();

    expect(usersService.updateProfile).toHaveBeenCalledWith(mockUser.id, updatedUserData);
    expect(authService.updateCurrentUser).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Profile updated successfully',
      'Close',
      { duration: 3000 }
    );
  });

  it('should show error when update fails', () => {
    const errorMessage = 'Update failed';
    component.profileForm.setValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    });

    usersService.updateProfile.and.returnValue(throwError(() => ({
      error: { message: errorMessage }
    })));

    component.onSubmit();

    expect(usersService.updateProfile).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      errorMessage,
      'Close',
      { duration: 5000 }
    );
  });

  it('should not submit form when invalid', () => {
    component.profileForm.setValue({
      firstName: '',
      lastName: 'User',
      email: 'invalid-email'
    });

    component.onSubmit();

    expect(usersService.updateProfile).not.toHaveBeenCalled();
  });
});