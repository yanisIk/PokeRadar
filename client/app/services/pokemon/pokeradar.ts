import {Injectable} from '@angular/core';
import { Observable, Observer, BehaviorSubject } from 'rxjs';
import { Http, Response } from '@angular/http';
import {GeolocationService} from './../geolocation/geolocation';
import * as request from 'superagent';

@Injectable()
export class PokeradarService {

  private _isScanning$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _currentPokemons$: BehaviorSubject<Set<any>> = new BehaviorSubject(new Set());
  private _lastPokemon$: BehaviorSubject<any> = BehaviorSubject.create();

  public isScanning$: Observable<boolean> = this._isScanning$.asObservable();
  public currentPokemon$: Observable<Set<any>> = this._currentPokemons$.asObservable();
  public lastPokemon$: Observable<any> = this._lastPokemon$.asObservable();

  private API_URL: String = "https://pokevision.com/map/data";
  private previousLocation: any = {latitude: 0, longitude: 0};

  constructor(private http: Http, private geolocationService: GeolocationService) {
    this.startRadar();
  }

  startRadar(): void {
    this.geolocationService.currentPosition$
    .debounceTime(3000)
    .distinctUntilChanged()
    .subscribe((pos) => {
        console.log('RADAR POSITION TICK: ', pos.latitude, pos.longitude);
        //Check if the distance with the previous location is noticeable
        //This is used to throttle requests
        if (this.geolocationService.calculateDistance(this.previousLocation, pos)
            < this.geolocationService.DISTANCE_THRESHOLD_IN_METERS) {
                this.previousLocation = pos;
                return;
        }
        this.previousLocation = pos;
        this.scanAreaV2(pos.latitude, pos.longitude)
        .then((pokemons) => {
            if (!pokemons) {
                return;
            }
            console.log('RADAR DETECTED POKEMONS:', pokemons);
            pokemons.forEach((pokemon) => {
                if (!this._currentPokemons$.getValue().has(pokemon)) {
                    this._lastPokemon$.next(pokemon);
                    //Add it to the observable set
                    this._currentPokemons$.next(this._currentPokemons$.getValue().add(pokemon));
                }
            });
        });

    });
  }

  private scanArea(lat: number, long: number): Promise<any> {
      this._isScanning$.next(true);
      return this.http.get(`${this.API_URL}/${lat}/${long}`)
            .map((res) => res.json())
            .toPromise()
            .then((pokemons) => {
                setTimeout(() => this._isScanning$.next(false), 3000);
                return Promise.resolve(pokemons);
            })
            .catch((err) => {
                setTimeout(() => this._isScanning$.next(false), 3000);
                console.error('ERROR IN RADAR SCAN:', err);
            });
  }

  /**
   * Uses superagent
   */
  private scanAreaV2(lat: number, long: number): Promise<any> {
      return this.beforeScan(lat, long)
      .then(() => {
          return new Promise((resolve, reject) => {
          request
            .get(`https://pokevision.com/map/data/${lat}/${long}`)
            .set('accept', 'application/json, text/javascript, */*; q=0.01')
            .set('accept-language', 'en-US,en;q=0.8')
            .set('cache-control', 'no-cache')
            .set('pragma', 'no-cache')
            .set('upgrade-insecure-requests', '1')
            .withCredentials()
            .end((err, res) => {
                if (err || !res.ok) {
                    //console.warn('Unable to contact API');
                    reject('ERROR: Unable to contact API to find pokemons');
                } else if (res.body) { 
                    let pokemons = res.body['pokemon'];
                    return resolve(pokemons);
                }
            });
      
        });
      })
      .catch((err) => console.log('ERROR WHILE SCANNING:', err)); 
  }

  /**
   * Should be called before scan area
   */
  private beforeScan(lat: number, long: number): Promise<any> {
      return new Promise((resolve, reject) => {
          request
            .get(`https://pokevision.com/map/scan/${lat}/${long}`)
            .set('accept', 'application/json, text/javascript, */*; q=0.01')
            .set('accept-language', 'en-US,en;q=0.8')
            .withCredentials()
            .end((err, res) => {
                if (err || !res.ok) {
                    reject('ERROR: Unable to contact API to find pokemons ' + err);
                    //console.warn(err);
                } else if (res.body) {
                    if (res.body['status'] !== 'success') {
                        reject(`ERROR: API Responded with status ${res.body['status']}`);
                        //console.warn(res.body);
                        return;
                    }
                    resolve();
                }
            });
      });
  }

  stopRadar(): void {

  }  

}