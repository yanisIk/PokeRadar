import {Injectable} from '@angular/core';
import {Network, Connection} from 'ionic-native';
import {Platform} from 'ionic-angular';
import { Observable, Observer, BehaviorSubject } from 'rxjs';
import 'rxjs/add/operator/share';

@Injectable()
export class ConnectivityService {

  private onDevice: boolean;
  private watchIntervalId: any;
  private _connectionStatus$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public connectionStatus$: Observable<boolean> = this._connectionStatus$.asObservable();

  constructor(public platform: Platform){
    this.onDevice = this.platform.is('cordova');
    this.watchConnectivity();
  }

  private watchConnectivity(): void {
    if (this.watchIntervalId) {
      clearInterval(this.watchIntervalId);
    }
    this.watchIntervalId = setInterval(() => {
      this._connectionStatus$.next(this.getStatus());
    }, 1000);
  }

  private getStatus(): boolean {
    if (this.onDevice && Network.connection) {
      return Network.connection !== Connection.NONE;
    } else {
      return navigator.onLine; 
    }
  }

  public isOnline(): boolean {
    return this._connectionStatus$.getValue();
  }

}