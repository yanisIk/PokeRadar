import {Injectable} from '@angular/core';
import { Observable, Observer, BehaviorSubject } from 'rxjs';
import { Http, Response } from '@angular/http';
import {GeolocationService} from './../geolocation/geolocation';
import {PokemonsService} from './../pokemon/pokemons';

@Injectable()
export class PokeradarService {

  private _isScanning$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _nearbyPokemons$: BehaviorSubject<Set<any>> = new BehaviorSubject(new Set());
  private _lastPokemon$: BehaviorSubject<any> = BehaviorSubject.create();
  private _isRadarOn$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private geoSubscription: any;

  public isScanning$: Observable<boolean> = this._isScanning$.asObservable();
  public nearbyPokemons$: Observable<Set<any>> = this._nearbyPokemons$.asObservable();
  public lastPokemon$: Observable<any> = this._lastPokemon$.asObservable();
  public isRadarOn$: Observable<any> = this._isRadarOn$.asObservable();

  private API_URL: String = "https://1kse7tu24a.execute-api.us-east-1.amazonaws.com/dev/nearby";
  private API_URL_2: String = "https://pokevision.com/map/data";
  private previousLocation: any = {latitude: 0, longitude: 0};
  private lastThrottleTime: number = Date.now();
  private MAX_THROTTLE_TIME: number = 3 * 60 * 1000; //3 minutes 

  constructor(private http: Http, 
                private geolocationService: GeolocationService, 
                private pokemonsService: PokemonsService) {
    //Let the user start it
    //this.startRadar();
  }

  private startRadar(): void {
    this.stopRadar();
    this._isRadarOn$.next(true);
    console.log('RADAR ACTIVATED');
    this.geoSubscription = this.geolocationService.currentPosition$
    .debounceTime(1000)
    .distinctUntilChanged()
    .subscribe((pos) => {

        console.log('RADAR POSITION TICK: ', pos.latitude, pos.longitude);   
        if (this.shouldThrottle(pos)) {
            return;
        }
        this.previousLocation = pos;

        this.scanArea(pos.latitude, pos.longitude)
        .then((pokemons) => {
            if (!pokemons) {
                return;
            }
            pokemons = this.pokemonsService.transformPokemonsById(pokemons);
            console.log('RADAR DETECTED POKEMONS:', pokemons);
            //Empty current list
            this._nearbyPokemons$.next(new Set());
            //Fill it
            for (let pokemon of pokemons) {
                this._lastPokemon$.next(pokemon);
                //Add it to the observable set
                this._nearbyPokemons$.next(this._nearbyPokemons$.getValue().add(pokemon));
            }

        });

    });
  }

  private stopRadar(): void {
      if (!this.geoSubscription) {
          return;
      }
      this.geoSubscription.unsubscribe();
      this._isRadarOn$.next(false);
      console.log('RADAR DEACTIVATED');
  }

  toggleRadar(): void {
      this._isRadarOn$.getValue() ? this.stopRadar() : this.startRadar();
  }

  /**
   * Check if the distance with the previous location is noticeable
   * This is used to throttle requests
   */
  private shouldThrottle(pos: any) {
      if (this.geolocationService.calculateDistance(this.previousLocation, pos)
            < this.geolocationService.DISTANCE_THRESHOLD_IN_METERS) {
                if ((Date.now() - this.lastThrottleTime) > this.MAX_THROTTLE_TIME) {
                    return false;
                }
                console.log('DISTANCE TOO LOW');
                this.lastThrottleTime = Date.now();
                return true;
        }
        return false;
  }

  private scanArea(lat: number, long: number): Promise<any> {
      this._isScanning$.next(true);
      return this.http.get(`${this.API_URL_2}/${lat}/${long}`)
            .map((res) => res.json())
            .toPromise()
            .then((pokemons) => {
                setTimeout(() => this._isScanning$.next(false), 3000);
                if (pokemons && pokemons.status === 'success') {
                    return Promise.resolve(pokemons.pokemon);
                }
                return Promise.reject(pokemons.status);
            })
            .catch((err) => {
                setTimeout(() => this._isScanning$.next(false), 3000);
                console.error('ERROR IN RADAR SCAN:', err);
            });
  }

}