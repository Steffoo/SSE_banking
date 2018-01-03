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

  constructor(private loginService: LoginService, private router: Router) {
    this.isLoggedIn = false;
    this.loginService.logged.subscribe(_logged => {
      if (_logged) {
        this.isLoggedIn = _logged;
        this.logInTries = 0;
      }
      this.showWarning = !_logged && this.logInTries > 0;
      if (this.logInTries > 2) {
        this.loginService.disableAccount();
      }
    });
  }

  ngOnInit() {
    this.userNameInput = 'TaiTabasco';
    this.passwordInput = 'ttt';
    // this.sendCredentials();
  }

  sendCredentials() {
    if (this.userNameInput && this.passwordInput) {
      this.logInTries++;
      this.loginService.login(this.userNameInput, this.passwordInput);
      this.router.navigate(['/mainMenu']);
    }
  }


}
