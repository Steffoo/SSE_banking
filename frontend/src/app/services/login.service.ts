import { Injectable } from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {HttpClient} from '@angular/common/http';
import {User} from '../classes/user';
import {Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';

const BACKEND_URL = 'http://localhost:3000';

@Injectable()
export class LoginService {

  logged: Subject<boolean> = new Subject();
  isloggedIn: boolean;
  user: User;

  //  todo delete, only Mock-response
  MockResponse = {
    user: new User('666', name, '0815'),
    sessionId: '123456',
    stauts: true
  };

  constructor(private http: HttpClient, private router: Router) {
    // this.logged.next(false);
  }

  login(name: string, pw: string) {

    const body = {
      name: name,
      password: pw,
    };


    // this.http.post('http://localhost:3000/login', post).subscribe(_response => {
    //   if (_response && _response.status) {
    //     this.logged.next(true);
    //     this.user = _response.user;
    //     let response = _response;
    //   }
    // });
    // }

    this.confirmLogin();
  }

  register(postUserData): Observable<any> {
    console.log('userdata', postUserData);
      return this.http.post(BACKEND_URL + '/register', postUserData);
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

  confirmLogin() {
    this.isloggedIn = true;
    this.logged.next(this.isloggedIn);
    localStorage.setItem('session_banking', this.MockResponse.sessionId);
    return this.MockResponse;
  }

  onLogOut() {
    this.isloggedIn = false;
    this.logged.next(this.isloggedIn);
    this.router.navigate(['/home']);
  }
}
