import { Component, OnInit } from '@angular/core';
import { RestService } from '../../services/rest-service.service';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {

  private invalidInputs: boolean = false;
  private errorMsg: String = "";
  private error: boolean = false;
  private success: boolean = false;

  private request = {
    username_owner: "ChristopherHansen",
    username_recipient: "",
    amount: 0.00,
    purpose: "",
    sessionId: 123456
  }

  constructor(private _restService: RestService) { }

  ngOnInit() {

  }

  onTransfer(): void {
    this.success = false;
    this.invalidInputs = false;

    if(this.request.username_recipient && this.request.amount && this.request.purpose){
      this._restService.accountTransfer(this.request).subscribe(
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
