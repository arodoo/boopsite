import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { UsersService } from '../../../services/users.service';
import { User, UserRole } from '../../../models/user.model';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
})
export class UsersListComponent implements OnInit {
  displayedColumns: string[] = [
    'email',
    'firstName',
    'lastName',
    'role',
    'actions',
  ];
  users: User[] = [];
  dataSource = new MatTableDataSource<User>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.dataSource = new MatTableDataSource<User>();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  public loadUsers() {
    this.usersService
      .getUsers()
      .pipe(
        catchError((error) => {
          this.snackBar.open('Error loading users', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
      )
      .subscribe((users) => {
        this.users = users;
        this.dataSource.data = users;
      });
  }

  openUserDialog(user?: User): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '400px',
      data: { user },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (user) {
          this.usersService.updateUser(user.id, result).subscribe({
            next: (updatedUser: User) => {
              const index = this.users.findIndex((u: User) => u.id === user.id);
              if (index !== -1) {
                this.users[index] = updatedUser;
                this.dataSource.data = [...this.users];
                this.snackBar.open('User updated successfully', 'Close', {
                  duration: 3000,
                });
              }
            },
            error: () => {
              this.snackBar.open('Error updating user', 'Close', {
                duration: 3000,
              });
            },
          });
        } else {
          this.usersService.createUser(result).subscribe({
            next: (newUser: User) => {
              this.users.push(newUser);
              this.dataSource.data = [...this.users];
              this.snackBar.open('User created successfully', 'Close', {
                duration: 3000,
              });
            },
            error: () => {
              this.snackBar.open('Error creating user', 'Close', {
                duration: 3000,
              });
            },
          });
        }
      }
    });
  }

  private createUser(userData: any): void {
    this.usersService.createUser(userData).subscribe({
      next: () => {
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000,
        });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open(
          error.error.message || 'Error creating user',
          'Close',
          { duration: 3000 },
        );
      },
    });
  }

  private updateUser(id: string, userData: any): void {
    this.usersService.updateUser(id, userData).subscribe({
      next: () => {
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
        });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open(
          error.error.message || 'Error updating user',
          'Close',
          { duration: 3000 },
        );
      },
    });
  }

  deleteUser(id: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.usersService.deleteUser(id).subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', {
            duration: 3000,
          });
          this.loadUsers();
        },
        error: (error) => {
          this.snackBar.open(
            error.error.message || 'Error deleting user',
            'Close',
            { duration: 3000 },
          );
        },
      });
    }
  }
}
