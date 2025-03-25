import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';

interface NavItem {
  label: string;
  route?: string;
  icon: string;
  children?: NavItem[];
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
  ],
})
export class SidebarComponent {
  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'My Account',
      icon: 'person',
      children: [
        { label: 'Profile', route: '/profile', icon: 'account_circle' },
      ],
    },
    {
      label: 'Administration',
      icon: 'admin_panel_settings',
      roles: [UserRole.ADMIN],
      children: [{ label: 'Users', route: '/admin/users', icon: 'group' }],
    },
  ];

  constructor(private authService: AuthService) {}

  hasPermission(roles?: UserRole[]): boolean {
    if (!roles || roles.length === 0) return true;
    const currentUser = this.authService.currentUserValue;
    return currentUser ? roles.includes(currentUser.role) : false;
  }

  filterNavItems(items: NavItem[]): NavItem[] {
    return items.filter((item) => this.hasPermission(item.roles));
  }
}
