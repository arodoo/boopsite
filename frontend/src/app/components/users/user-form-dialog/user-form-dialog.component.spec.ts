import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { UserFormDialogComponent } from './user-form-dialog.component';
import { UserRole } from '../../../models/user.model';

describe('UserFormDialogComponent', () => {
  let component: UserFormDialogComponent;
  let fixture: ComponentFixture<UserFormDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<UserFormDialogComponent>>;

  const existingUser = {
    id: '1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }, // Start with no user data for create mode
      ],
    }).compileComponents();
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(UserFormDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create in create mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBe(false);
    });

    it('should initialize form with empty values and USER role in create mode', () => {
      expect(component.userForm.get('email')?.value).toBe('');
      expect(component.userForm.get('firstName')?.value).toBe('');
      expect(component.userForm.get('lastName')?.value).toBe('');
      expect(component.userForm.get('role')?.value).toBe(UserRole.USER);
      expect(component.userForm.get('password')?.value).toBe('');
    });

    it('should require password in create mode', () => {
      const passwordControl = component.userForm.get('password');
      expect(passwordControl?.hasValidator).toBeTruthy();

      passwordControl?.setValue('');
      expect(passwordControl?.valid).toBeFalsy();

      passwordControl?.setValue('123');
      expect(passwordControl?.valid).toBeFalsy(); // Too short

      passwordControl?.setValue('password123');
      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should close dialog with form data on valid submit', () => {
      const formData = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
        password: 'password123',
      };

      component.userForm.setValue(formData);
      component.onSubmit();

      expect(mockDialogRef.close).toHaveBeenCalledWith(formData);
    });

    it('should not submit when form is invalid', () => {
      component.userForm.get('email')?.setValue('invalid-email');
      component.onSubmit();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          NoopAnimationsModule,
          ReactiveFormsModule,
          MatDialogModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatButtonModule,
        ],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: existingUser },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(UserFormDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create in edit mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBe(true);
    });

    it('should initialize form with existing user data in edit mode', () => {
      expect(component.userForm.get('email')?.value).toBe(existingUser.email);
      expect(component.userForm.get('firstName')?.value).toBe(
        existingUser.firstName,
      );
      expect(component.userForm.get('lastName')?.value).toBe(
        existingUser.lastName,
      );
      expect(component.userForm.get('role')?.value).toBe(existingUser.role);
      // Password should be empty in edit mode
      expect(component.userForm.get('password')?.value).toBe('');
    });

    it('should not require password in edit mode', () => {
      const passwordControl = component.userForm.get('password');
      expect(passwordControl?.hasValidator).toBeFalsy();
    });

    it('should close dialog with updated data but exclude empty password on submit', () => {
      const updatedData = {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        role: UserRole.ADMIN,
        password: '', // Empty password should be excluded
      };

      component.userForm.setValue(updatedData);
      component.onSubmit();

      const expectedData: Partial<typeof updatedData> = { ...updatedData };
      delete expectedData.password;

      expect(mockDialogRef.close).toHaveBeenCalledWith(expectedData);
    });

    it('should include password in data when provided in edit mode', () => {
      const updatedData = {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        role: UserRole.ADMIN,
        password: 'newpassword123',
      };

      component.userForm.setValue(updatedData);
      component.onSubmit();

      expect(mockDialogRef.close).toHaveBeenCalledWith(updatedData);
    });

    it('should close without data when cancel is clicked', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });
});
