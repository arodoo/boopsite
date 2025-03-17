import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { UsersListComponent } from './users-list.component';
import { UsersService } from '../../../services/users.service';
import { UserRole } from '../../../models/user.model';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;
  let usersService: jasmine.SpyObj<UsersService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUsers = [
    { id: '1', email: 'admin@example.com', firstName: 'Admin', lastName: 'User', role: UserRole.ADMIN },
    { id: '2', email: 'user@example.com', firstName: 'Regular', lastName: 'User', role: UserRole.USER }
  ];

  beforeEach(async () => {
    const usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUsers', 'createUser', 'updateUser', 'deleteUser']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    usersService = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  beforeEach(() => {
    // Set up the spy return values
    usersService.getUsers.and.returnValue(of(mockUsers));
    
    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on initialization', () => {
    expect(usersService.getUsers).toHaveBeenCalled();
    expect(component.dataSource.data).toEqual(mockUsers);
  });

  it('should handle error when loading users fails', () => {
    usersService.getUsers.and.returnValue(throwError(() => new Error('Failed to load users')));
    component.loadUsers();
    expect(snackBar.open).toHaveBeenCalledWith('Error loading users', 'Close', { duration: 3000 });
  });

  it('should open user dialog with no user data for new user', () => {
    const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpyObj.afterClosed.and.returnValue(of(null));
    dialog.open.and.returnValue(dialogRefSpyObj);

    component.openUserDialog();
    
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should open user dialog with user data for editing', () => {
    const user = mockUsers[0];
    const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpyObj.afterClosed.and.returnValue(of(null));
    dialog.open.and.returnValue(dialogRefSpyObj);

    component.openUserDialog(user);
    
    expect(dialog.open).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({
        data: user
      })
    );
  });

  it('should create a new user when dialog returns data', () => {
    const newUser = { email: 'new@example.com', firstName: 'New', lastName: 'User', password: 'password', role: UserRole.USER };
    const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpyObj.afterClosed.and.returnValue(of(newUser));
    dialog.open.and.returnValue(dialogRefSpyObj);
    
    usersService.createUser.and.returnValue(of({ id: '3', ...newUser }));
    
    component.openUserDialog();
    
    expect(usersService.createUser).toHaveBeenCalledWith(newUser);
    expect(snackBar.open).toHaveBeenCalledWith('User created successfully', 'Close', { duration: 3000 });
    expect(usersService.getUsers).toHaveBeenCalled();
  });

  it('should update a user when dialog returns data for existing user', () => {
    const user = mockUsers[0];
    const updatedData = { firstName: 'Updated', lastName: 'Admin' };
    const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpyObj.afterClosed.and.returnValue(of(updatedData));
    dialog.open.and.returnValue(dialogRefSpyObj);
    
    usersService.updateUser.and.returnValue(of({ ...user, ...updatedData }));
    
    component.openUserDialog(user);
    
    expect(usersService.updateUser).toHaveBeenCalledWith(user.id, updatedData);
    expect(snackBar.open).toHaveBeenCalledWith('User updated successfully', 'Close', { duration: 3000 });
    expect(usersService.getUsers).toHaveBeenCalled();
  });

  it('should delete a user when confirmation is confirmed', () => {
    const userId = mockUsers[0].id;
    usersService.deleteUser.and.returnValue(of(undefined));
    
    // Mock the window.confirm to return true
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteUser(userId);
    
    expect(usersService.deleteUser).toHaveBeenCalledWith(userId);
    expect(snackBar.open).toHaveBeenCalledWith('User deleted successfully', 'Close', { duration: 3000 });
    expect(usersService.getUsers).toHaveBeenCalled();
  });

  it('should not delete a user when confirmation is cancelled', () => {
    const userId = mockUsers[0].id;
    
    // Mock the window.confirm to return false
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deleteUser(userId);
    
    expect(usersService.deleteUser).not.toHaveBeenCalled();
  });
});