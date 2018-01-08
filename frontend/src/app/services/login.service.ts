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

  constructor(private http: HttpClient, private router: Router) {
    // this.logged.next(false);
  }

  login(body): Observable<any> {
    return this.http.post(BACKEND_URL + '/login', body);
  }

  register(postUserData): Observable<any> {
    console.log('userdata', postUserData);
      return this.http.post(BACKEND_URL + '/register', postUserData);
  }

  getLogStatus() {
    return this.isloggedIn;
  }

  lockAccount() {
    // this.http.get('http://localhost:3000/lock...' ).subscribe(_res => {
    // });
    // todo get zum sperren von konto
    console.log('disable Account');
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
    // do not forget to delete sessionID from localstorage
    this.router.navigate(['/home']);
  }

  getLoggedInUser(): User {
    return this.user;
  }
}
