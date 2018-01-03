import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { MainMenuComponent } from './components/main-menu/main-menu.component';
import { HistoryComponent } from './components/history/history.component';
import { RouteGuardService } from './services/route-guard.service';

export const ROUTES: Routes = [

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'mainMenu', component: MainMenuComponent, canActivate: [RouteGuardService] },
  { path: 'history', component: HistoryComponent } 
  ];

