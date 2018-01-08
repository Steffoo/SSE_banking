import { Component, OnInit } from '@angular/core';
import { RestService } from '../../services/rest-service.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  private movements: any [];

  constructor(private _restService: RestService, private _loginService: LoginService) { }

  ngOnInit() {
    const userSession = {
      username: this._loginService.getLoggedInUser().username,
      sessionId: localStorage.getItem('banking_session')
    };

    this._restService.getAccountMovement(userSession).subscribe(
      data => {
        console.log('user movement', data);
        this.movements = data.movements;
      },
      err => {

      }
    );
  }

}
