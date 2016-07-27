import {Injectable} from '@angular/core';
import {Platform} from 'ionic-angular';
import {Geolocation} from 'ionic-native';
import { Observable, Observer, BehaviorSubject } from 'rxjs';
import 'rxjs/add/operator/share';

@Injectable()
export class GeolocationService {

  private positionWatch: any;
  private navGeoWatchId: any;
  private _currentPosition$: BehaviorSubject<any> = BehaviorSubject.create();
  public currentPosition$: Observable<any> = this._currentPosition$.asObservable();
  public DISTANCE_THRESHOLD_IN_METERS: number = 20;

  constructor(public platform: Platform) {
    this.startGeoWatch();
  }

  startGeoWatch(): void {
    this.stopGeoWatch();
    if (this.platform.is('cordova')) {
      this.positionWatch = Geolocation.watchPosition();
      this.positionWatch.subscribe((newPos) => {
          console.log('GPS tick');
          if (newPos.coords)
            this._currentPosition$.next(newPos.coords);
      });
    } else {
      this.navGeoWatchId = navigator.geolocation.watchPosition((newPos) => {
        console.log('Nav GPS tick', newPos.coords);
        if (newPos.coords)
          this._currentPosition$.next(newPos.coords);
      },
      (err) => console.warn('ERROR(' + err.code + '): ' + err.message),
      {enableHighAccuracy: true});
    }
  }

  stopGeoWatch(): void {
    if (this.positionWatch)
        this.positionWatch.unsubscribe();
    if (this.navGeoWatchId)
        navigator.geolocation.clearWatch(this.navGeoWatchId);
  }

  /**
   * Calculate the distance between 2 points in METERS
   */
  calculateDistance(coords1: any, coords2: any): number {
    const R = 6371; // km
    var dLat = this.toRad((coords2.latitude - coords1.latitude));
    var dLon = this.toRad((coords2.longitude - coords1.longitude)); 
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(coords1.latitude)) * Math.cos(this.toRad(coords2.latitude)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    var d = R * c;
    return d * 1000;
  }

  private toRad(num: number) {
    return num * Math.PI / 180;
  }

}