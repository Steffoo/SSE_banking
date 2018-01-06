import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { MainMenuComponent } from './components/main-menu/main-menu.component';
import { HistoryComponent } from './components/history/history.component';
import { RouteGuardService } from './services/route-guard.service';
import { TransferComponent } from './components/transfer/transfer.component';
import { UserAdministrationComponent } from './components/user-administration/user-administration.component';
import {RegistryComponent} from './components/registry/registry.component';

export const ROUTES: Routes = [

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registry', component: RegistryComponent},
  { path: 'mainMenu', component: MainMenuComponent, canActivate: [RouteGuardService] },
  { path: 'history', component: HistoryComponent },
  { path: 'transfer', component: TransferComponent },
  { path: 'userAdministration', component: UserAdministrationComponent }
  ];

