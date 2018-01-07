import { Component, OnInit } from '@angular/core';
import {LoginService} from '../../services/login.service';
import {Router} from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  userNameInput: string;
  passwordInput: string;
  isLoggedIn: boolean;
  logInTries = 0;
  showWarning: boolean;
  user;

  constructor(private loginService: LoginService, private router: Router) {
    this.isLoggedIn = false;
    this.loginService.logged.subscribe(_logged => {
      if (_logged) {
        this.isLoggedIn = _logged;
        this.logInTries = 0;
      }
      this.showWarning = !_logged && this.logInTries > 0;
      if (this.logInTries > 2) {
        this.loginService.lockAccount();
      }
    });
  }

  ngOnInit() {
    // todo delete
    this.userNameInput = 'Steff';
    this.passwordInput = 'kkkkkkkk';
  }

  sendCredentials() {
    if (this.userNameInput && this.passwordInput) {
      // this.logInTries++;
      const body = {
        username: this.userNameInput,
        password: this.passwordInput,
      };
      this.loginService.login(body).subscribe(_res => {
        if (_res.status) {
          localStorage.setItem('banking_session', _res.sessionID);
          this.loginService.confirmLogin();
          this.router.navigate(['/mainMenu']);
        }
        console.log('response', _res);
      });
      console.log('localstorage', localStorage);
    }
  }


}
