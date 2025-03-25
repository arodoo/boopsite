import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    NavbarComponent,
    SidebarComponent,
  ],
})
export class LayoutComponent implements OnInit {
  isSidenavOpen = true;

  constructor() {}

  ngOnInit(): void {}

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
  }
}
