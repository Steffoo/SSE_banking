import { Component } from '@angular/core';
import { RestService } from '../../services/rest-service.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent {

  private invalidInputs: boolean = false;
  private errorMsg: String = "";
  private error: boolean = false;
  private success: boolean = false;

  private userSession = {
    username_owner: this._loginService.getLoggedInUser().username,
    username_recipient: "",
    amount: 0.00,
    purpose: "",
    sessionId: localStorage.getItem('banking_session')
  }

  constructor(private _restService: RestService, private _loginService: LoginService) { }

  onTransfer(): void {
    this.success = false;
    this.invalidInputs = false;

    if(this.userSession.username_recipient && this.userSession.amount && this.userSession.purpose){
      this._restService.accountTransfer(this.userSession).subscribe(
        data => {
            if(data.status){
              this.error = false;
              this.success = true;
            }else{
              this.error = true;
              this.errorMsg = data.message;
            }
        },
        err => {
  
        }
      );
    } else {
      this.invalidInputs = true;
    }
  }

}
