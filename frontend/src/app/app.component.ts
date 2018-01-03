import {Component, OnInit} from '@angular/core';
import {LoginService} from './services/login.service';
import {HttpClient} from '@angular/common/http';
import {RouteGuardService} from './services/route-guard.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: []
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
