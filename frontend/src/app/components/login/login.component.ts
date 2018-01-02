import { Component, OnInit } from '@angular/core';


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

  constructor() {
    // this.loginService.loggedIn.subscribe(_logged => {
    //   if (_logged) {
    //     this.logInTries = 0;
    //   }
    //   this.isLoggedIn = _logged;
    //   this.showWarning = !this.isLoggedIn && this.logInTries > 0
    // });
  }

  ngOnInit() {
    // this.userNameInput = 'steffen';
    // this.passwordInput = 'sss';
    // this.onLogIn();
  }

  onLogIn() {
    // if (this.userNameInput && this.passwordInput) {
    //   this.logInTries++;
      // const newUser = new User(this.userNameInput, new Date() );
      // this.loginService.sendCredentials(this.passwordInput);
    // }
  }


}
