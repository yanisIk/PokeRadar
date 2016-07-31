import {Injectable} from '@angular/core';
import {Platform} from 'ionic-angular';
import {Observable, BehaviorSubject} from 'rxjs';

@Injectable()
export class ConnectivityService {

  private _connectionStatus$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public connectionStatus$: Observable<boolean> = this._connectionStatus$.asObservable();

  constructor(){
    this.watchConnectivity();
  }

  private watchConnectivity(): void {
    window.addEventListener('online',  () => this._connectionStatus$.next(true));
    window.addEventListener('offline', () => this._connectionStatus$.next(false));
  }

  public getStatus(): boolean {
    return navigator.onLine; 
  }

}