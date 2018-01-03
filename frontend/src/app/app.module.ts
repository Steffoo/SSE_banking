import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { FormsModule } from '@angular/forms';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { ROUTES } from './app.routes';
import { RouteGuardService } from './services/route-guard.service';
import { LoginService } from './services/login.service';
import { HistoryComponent } from './components/history/history.component';
import { MainMenuComponent } from './components/main-menu/main-menu.component';
import { TransferComponent } from './components/transfer/transfer.component';
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    MainMenuComponent,
    HistoryComponent,
    TransferComponent
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
