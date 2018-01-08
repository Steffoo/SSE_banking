import { Component, OnInit } from '@angular/core';
import { RestService } from '../../services/rest-service.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  private user = {};

  constructor(private _restService: RestService, private loginService: LoginService) { }

  ngOnInit() {
    const userSession = {
      username: this.loginService.getLoggedInUser().username,
      sessionId: localStorage.getItem('banking_session')
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
