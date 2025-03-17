import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto } from '../models/user.model';

// Environment URL - would typically be in an environment file
const API_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${API_URL}/users/${id}`);
  }

  createUser(user: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${API_URL}/users`, user);
  }

  updateUser(id: string, user: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${API_URL}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/users/${id}`);
  }

  updateProfile(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${API_URL}/users/${id}/profile`, data);
  }
}