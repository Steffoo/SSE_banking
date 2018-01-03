export class User {

  id: string;
  name: string;
  IBAN: string;

  constructor(_id: string, _name: string, _IBAN: string) {
    this.name = _name;
    this.id = _id;
    this.IBAN = _IBAN;
  }

  // constructor(json: JSON) {
  //   this.name = json['name'];
  //   this.id = json['id'];
  //   this.IBAN = json['id'];
  // }

}
