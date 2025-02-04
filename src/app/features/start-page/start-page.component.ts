import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './start-page.component.html',
  styleUrls: ['./start-page.component.scss']
})
export class StartPageComponent {
  constructor(private router: Router) {}

  donate() {
    // Logic for donation
    alert('Donate functionality not implemented yet.');
  }

  about() {
    // Logic for showing information about the creators
    alert('Hazirlayan bilgisi gösterilecek.');
  }

  login() {
    // Logic for login functionality
    alert('Giriş yapma fonksiyonu henüz uygulanmadı.');
  }

  navigateToGame() {
    this.router.navigate(['/game']);
  }
}
