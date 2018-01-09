import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {LoginService} from './services/login.service';
import {HttpClient} from '@angular/common/http';
import {RouteGuardService} from './services/route-guard.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: []
})
export class AppComponent implements OnInit {

  isLoggedIn: boolean;

  constructor(private loginService: LoginService, private router: Router) {

  }

  ngOnInit(): void {
    this.loginService.logged.subscribe(isLogged => this.isLoggedIn = isLogged);
    const storedUser = localStorage.getItem('banking_username');
    const storedSession = localStorage.getItem('banking_session');

    if (!this.isLoggedIn && storedUser && storedSession) {
      this.loginService.loginWithSession({username: storedUser, sessionId: storedSession}).subscribe(_res => {
        // console.log('session response', _res);
        if (_res.status) {
          this.loginService.confirmLogin( {username: _res.username, iban: _res.iban} );
          this.router.navigate(['/mainMenu']);
        }
      });
    }
  }

  onLogOut() {
    console.log('logout');
    this.loginService.onLogOut();
  }
}
