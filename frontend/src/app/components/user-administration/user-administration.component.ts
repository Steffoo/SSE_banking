import { Component } from '@angular/core';
import { RestService } from '../../services/rest-service.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-user-administration',
  templateUrl: './user-administration.component.html',
  styleUrls: ['./user-administration.component.scss']
})
export class UserAdministrationComponent {

  accountToEdit = "";
  accountToUnlock = "";
  accountToDelete = "";

  deleteResponseMsg = "";
  unlockResponseMsg = "";

  userSession = {
    username: this._loginService.getLoggedInUser().username,
    sessionId: localStorage.getItem('banking_session')
  };

  constructor(private _restService: RestService, private _loginService: LoginService) { }

  onForward() {
    this._restService.forward("/mainMenu").subscribe(
      data => {
        console.log("Forwarding...");
      },
      err => {
        console.log("Error while Forwarding...");
      }
    )
  }

  onUnlock(): void {
    this.userSession["usernameToUnlock"] = this.accountToUnlock;

    this._restService.deleteAccount(this.userSession).subscribe(
      data => {
        this.unlockResponseMsg = data.message;
      },
      err => {

      }
    );
  }

  onDelete(): void {
    this.userSession["usernameToDelete"] = this.accountToDelete;

    this._restService.deleteAccount(this.userSession).subscribe(
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
