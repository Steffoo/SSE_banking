import { Component, OnInit } from '@angular/core';
import { RestService } from '../../services/rest-service.service';
import {LoginService} from '../../services/login.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  private user = {};
  // private request = {
  //   username : "MattTheAdmin",
  //   sessionId : 123456
  // };

  constructor(private _restService: RestService, private loginService: LoginService) { }

  ngOnInit() {
    const userSession = {
      username : this.loginService.user.username,
      sessionId : localStorage.getItem('banking_session')
    };

    this._restService.getAccount(userSession).subscribe(
      data => {
        console.log('user profile', data);
        this.user = data;
      },
      err => {
      }
    );
  }

}
