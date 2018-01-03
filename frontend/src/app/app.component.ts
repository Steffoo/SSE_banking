import {Component, OnInit} from '@angular/core';
import {LoginService} from './services/login.service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [LoginService, HttpClient]
})
export class AppComponent implements OnInit {

  isLoggedIn: boolean;

  constructor(private loginService: LoginService) {

  }

  ngOnInit(): void {
    this.loginService.logged.subscribe(isLogged => this.isLoggedIn = isLogged);
  }

  getUser() {
    return this.loginService.user;
  }

  onLogin() {
  }

  onLogOut() {

  }
}
