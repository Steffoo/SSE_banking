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
    // todo delete
    this.userNameInput = 'TaiTabasco';
    this.passwordInput = 'ttt';
  }

  sendCredentials() {
    if (this.userNameInput && this.passwordInput) {
      this.logInTries++;
      let response = this.loginService.login(this.userNameInput, this.passwordInput);
      // console.log('localstorage', localStorage.getItem('session_banking'));
      this.router.navigate(['/mainMenu']);
    }
  }


}
