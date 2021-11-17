import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {
  userId: string;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authService.userId.subscribe((userId) => {
      this.userId = userId;
    });
  }
}
