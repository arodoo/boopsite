import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { User, UserRole } from '../../../models/user.model';

interface DialogData {
  user?: User;
}

@Component({
  selector: 'app-user-form-dialog',
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ]
})
export class UserFormDialogComponent implements OnInit {
  userForm!: FormGroup;
  roles = [UserRole.USER, UserRole.ADMIN];
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = !!this.data?.user;
    this.initForm();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      role: [this.isEditMode && this.data.user ? this.data.user.role : UserRole.USER]
    });

    if (this.isEditMode && this.data.user) {
      this.userForm.patchValue({
        email: this.data.user.email,
        firstName: this.data.user.firstName,
        lastName: this.data.user.lastName
      });
    }
  }

  ngOnInit() {
    if (this.data?.user) {
      this.userForm.patchValue({
        email: this.data.user.email,
        firstName: this.data.user.firstName,
        lastName: this.data.user.lastName,
        role: this.data.user.role
      });
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formData = { ...this.userForm.value };
      if (this.isEditMode && !formData.password) {
        delete formData.password;
      }
      this.dialogRef.close(formData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}