import { Injectable } from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {HttpClient} from '@angular/common/http';
import {User} from '../classes/user';
import {Router} from '@angular/router';

@Injectable()
export class LoginService {

  isRegistration = true;
  logged: Subject<boolean> = new Subject();
  isloggedIn: boolean;
  user: User;

  constructor(private http: HttpClient, private router: Router) {
    // this.logged.next(false);
  }

  setRegistration(isRegistration: boolean) {
    this.isRegistration = isRegistration;
  }

  login(name: string, pw: string) {

    const body = {
      name: name,
      password: pw,
    };


    // only Mock-response
    let response = {
      user: new User('666', name, '0815'),
      sessionId: '123456',
      stauts: true
    };

    // if (this.register) {
    //   this.http.post('http://localhost:3000/register', post).subscribe(_response => {
    //     if (_response && _response.status) {
    //         this.logged.next(true);
    //         this.user = _response.user;
    //         let response = _response;
    //       }
    //     });
    // } else {
    // this.http.post('http://localhost:3000/login', post).subscribe(_response => {
    //   if (_response && _response.status) {
    //     this.logged.next(true);
    //     this.user = _response.user;
    //     let response = _response;
    //   }
    // });
    // }

    this.logged.next(true);
    this.isloggedIn = true;
    localStorage.setItem('session_banking', response.sessionId);
    return response;
  }

  getLogStatus() {
    return this.isloggedIn;
  }

  disableAccount() {
    // this.http.get('http://localhost:3000/lock...' ).subscribe(_res => {
    // });
    // todo get zum sperren von konto
    console.log('disable Account');
  }

  onLogOut() {
    this.isloggedIn = false;
    this.logged.next(false);
    this.router.navigate(['/home']);
  }
}
