import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {LoginService} from './login.service';

@Injectable()
export class RouteGuardService implements CanActivate {

  isLoggedIn = false;

  constructor(private loginService: LoginService) {
    this.loginService.logged.subscribe(_logged => this.isLoggedIn = _logged);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.isLoggedIn;
  }



}
