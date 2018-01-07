import { Component, OnInit } from '@angular/core';
import { RestService } from '../../services/rest-service.service';

@Component({
  selector: 'app-user-administration',
  templateUrl: './user-administration.component.html',
  styleUrls: ['./user-administration.component.scss']
})
export class UserAdministrationComponent implements OnInit {

  accountToEdit = "";
  accountToUnlock = "";
  accountToDelete = "";

  deleteResponseMsg = "";
  unlockResponseMsg = "";

  request = {
    "username": "MattTheAdmin",
    "sessionId": "blabla"
  };

  constructor(private _restService: RestService) { }

  ngOnInit() {
  }

  onEdit(): void {

  }

  onUnlock(): void {
    this.request["usernameToUnlock"] = this.accountToUnlock;

    this._restService.deleteAccount(this.request).subscribe(
      data => {
       this.unlockResponseMsg = data.message;
      },
      err => {

      }
    );
  }

  onDelete(): void {
    this.request["usernameToDelete"] = this.accountToDelete;

    this._restService.deleteAccount(this.request).subscribe(
      data => {
        if (data.user) {
          this.deleteResponseMsg = "Benutzer " + this.accountToDelete + " wurde erfolgreich gelöscht."
        } else {
          this.deleteResponseMsg = data.message;
        }
      },
      err => {

      }
    );
  }

}
