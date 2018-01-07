import { Component, OnInit } from '@angular/core';
import { RestService } from '../../services/rest-service.service';


@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  private username = "MattTheAdmin"
  private movements: any [];

  request = {
    "username_owner": "MattTheAdmin",
    "sessionId": 123456
  };

  constructor(private _restService: RestService) { }

  ngOnInit() {
    this._restService.getAccountMovement(this.request).subscribe(
      data => {
        this.movements = data.movements;
      },
      err => {

      }
    );
  }

}
