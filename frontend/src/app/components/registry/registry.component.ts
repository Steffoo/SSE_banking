import { Component, OnInit } from '@angular/core';
import {LoginService} from '../../services/login.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-registry',
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.scss']
})
export class RegistryComponent implements OnInit {

  userData = {
    userNameInput: 'Steff',
    firstNameInput: 'Steffen',
    nameInput: 'Bartsch',
    addressInput: 'dfad',
    telephonenumberInput: 'adfdag',
    emailInput: 'dafg@dklfd.com',
    passwordInput: 'kkkkkkkk',
    confirmPassword: 'kkkkkkkk',
  };
  isLoggedIn: boolean;
  showWarning: boolean;
  warningText: string;

  constructor(private loginService: LoginService, private router: Router) {
    this.isLoggedIn = false;
    this.loginService.logged.subscribe(_logged => {
      if (_logged) {
        this.isLoggedIn = _logged;
      }
    });
  }

  ngOnInit() {

  }

  validUserData() {
    const validPassword = (pw) => {
      return pw.length > 7;
    };

    if (
      this.userData.userNameInput !== '' &&
      this.userData.firstNameInput !== '' &&
      this.userData.nameInput !== '' &&
      this.userData.addressInput !== '' &&
      this.userData.telephonenumberInput !== '' &&
      this.userData.emailInput.match(/\S+@\S+\.\S+/) &&
      validPassword(this.userData.passwordInput) &&
      this.userData.confirmPassword === this.userData.passwordInput) {
      return true;
    } else {
      return false;
    }
  }

  sendUserData() {
    if (this.validUserData()) {
      // let response = this.loginService.register(this.userData);
      const postUserData = {
        firstName: this.userData.firstNameInput,
        name: this.userData.nameInput,
        username: this.userData.userNameInput,
        address: this.userData.addressInput,
        telephonenumber: this.userData.telephonenumberInput,
        email: this.userData.emailInput,
        password: this.userData.passwordInput,
        balance: 0.00
      };

      this.loginService.register(postUserData).subscribe(_res => {
          if (_res.status) {
            // console.log('response', _res);
            this.loginService.confirmLogin();
            this.router.navigate(['/mainMenu']);
            this.showWarning = false;
          } else {
            this.warningText = 'Benutzername ist bereits vergeben';
            this.showWarning = true;
          }
        });
    } else {
      this.warningText = `Anmeldedaten falsch <br> Bitte prüfen Sie ihre Anmeldedaten`;
      this.showWarning = true;
    }
  }
}
