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
  warningText: string;

  constructor(private loginService: LoginService, private router: Router) {
    this.isLoggedIn = false;
    this.showWarning = false;
    this.loginService.logged.subscribe(_logged => {
      if (_logged) {
        this.isLoggedIn = _logged;
        this.logInTries = 0;
      }
    });
  }

  ngOnInit() {
    // this.userNameInput = 'Thaer';
    // this.passwordInput = 'tttttttt';
  }

  sendCredentials() {
    if (this.userNameInput && this.passwordInput) {
      const body = {
        username: this.userNameInput,
        password: this.passwordInput,
      };
      this.loginService.login(body).subscribe(_res => {
        if (_res.status) {
          this.showWarning = false;
          localStorage.setItem('banking_session', _res.sessionID);
          localStorage.setItem('banking_username', _res.user.username);
          this.loginService.confirmLogin(_res.user);
          this.router.navigate(['/mainMenu']);
        } else {
          this.warningText = _res.code + '<br>' + _res.message;
          this.showWarning = true;
        }
        // console.log('response', _res);
      });
    }
  }


}
