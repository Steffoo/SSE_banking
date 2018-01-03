import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { FormsModule } from '@angular/forms';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { ROUTES } from './app.routes';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { MainMenuComponent } from './components/main-menu/main-menu.component';
import {RouteGuardService} from './services/route-guard.service';
import {LoginService} from './services/login.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    MainMenuComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AngularFontAwesomeModule,
    RouterModule.forRoot(ROUTES),
    HttpClientModule
  ],
  providers: [HttpClientModule, LoginService, HttpClient, RouteGuardService],
  bootstrap: [AppComponent]
})
export class AppModule { }
