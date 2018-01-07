import { Component, OnInit } from '@angular/core';
import { RestService } from '../../services/rest-service.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  private user = {};
  private request = {
    "username" : "MattTheAdmin",
    "sessionId" : 123456
  };

  constructor(private _restService: RestService) { }

  ngOnInit() {
    this._restService.getAccount(this.request).subscribe(
      data => {
        console.log(data)
        this.user = data;
      },
      err => {

      }
    );
  }

}
