export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  access_token?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
}