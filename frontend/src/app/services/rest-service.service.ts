import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';


@Injectable()
export class RestService {

    constructor(private http: Http) { }

    public forward(path) {
        return this.get(path + "?fwd=http://141.19.152.95:4200" + path);
    }

    public getAccount(data) {
        return this.post("/profile", data);
    }

    public accountTransfer(data){
        return this.post("/accountTransfer", data);
    }

    public getAccountMovement(data): Observable<any> {
        return this.post("/accountMovement", data);
    }

    public unlockAccount(data): Observable<any> {
        return this.post("/unlockAccount", data);
    }

    public deleteAccount(data): Observable<any> {
        return this.post("/deleteAccount", data);
    }

    private get(path: string): Observable<any> {
        path = "http://141.19.152.95:3000" + path;
        return this.http.get(path)
            .map(response => response.json())
            .catch(this.handleError);
    }

    private post(path: string, data: any): Observable<any> {
        path = "http://141.19.152.95:3000" + path;
        return this.http.post(path, data).map(response => response.json())
            .catch(this.handleError);
    }

    private handleError(error: any) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}