import { Injectable } from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {HttpClient} from '@angular/common/http';
import {User} from '../classes/user';
import {Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';

const BACKEND_URL = 'http://localhost:3000';
// const URL_BACKEND = 'http://141.19.152.95:3000';

@Injectable()
export class LoginService {

  logged: Subject<boolean> = new Subject();
  isloggedIn: boolean;
  user: User;

  constructor(private http: HttpClient, private router: Router) {
    // this.logged.next(false);
  }

  login(body): Observable<any> {
    return this.http.post(BACKEND_URL + '/login', body);
  }

  register(postUserData): Observable<any> {
    // console.log('userdata', postUserData);
    return this.http.post(BACKEND_URL + '/register', postUserData);
  }

  getLogStatus() {
    return this.isloggedIn;
  }


  confirmLogin(user) {
    this.user = new User(user);
    this.isloggedIn = true;
    this.logged.next(this.isloggedIn);
    console.log('successful login');
  }

  onLogOut() {
    this.isloggedIn = false;
    this.logged.next(this.isloggedIn);
    localStorage.removeItem('banking_session');
    localStorage.removeItem('banking_username');
    this.router.navigate(['/home']);
  }

  getLoggedInUser(): User {
    return this.user;
  }

  loginWithSession(body): Observable<any> {
    // console.log('try with session', body);
    return this.http.post(BACKEND_URL + '/profile', body);
  }


}
