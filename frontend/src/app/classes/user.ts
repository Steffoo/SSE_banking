export class User {

  username: string;
  iban: string;

  constructor(json: JSON) {
    this.username = json['username'];
    this.iban = json['iban'];
  }

}
