import { Injectable } from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {HttpClient} from '@angular/common/http';
import {User} from '../classes/user';

@Injectable()
export class LoginService {

  register: true;
  logged: Subject<boolean> = new Subject();
  user: User;

  constructor(private http: HttpClient) {
    this.logged.next(false);
  }

  login(name: string, pw: string) {
    const body = {
      name: name,
      password: pw,
    };
    let response;
    // if (this.register) {
    //   this.http.post('http://localhost:3000/register', post).subscribe(_response => {
    //     if (_response && _response.status) {
    //         this.logged.next(true);
    //         this.user = _response.user;
    //       }
    //     });
    // } else {
    // this.http.post('http://localhost:3000/login', post).subscribe(_response => {
    //   if (_response && _response.status) {
    //     this.logged.next(true);
    //     this.user = _response.user;
    //   }
    // });
    // }

    this.logged.next(true);
    return new User('666', name, '0815');
  }

  disableAccount() {
    console.log('disable Account');
  }

}
