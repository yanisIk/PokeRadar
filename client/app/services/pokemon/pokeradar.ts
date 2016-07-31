import {Injectable} from '@angular/core';
import {Observable, Observer, BehaviorSubject} from 'rxjs';
import {Http, Response, Jsonp, Headers, RequestOptions} from '@angular/http';
import {GeolocationService} from './../geolocation/geolocation';
import {PokemonsService} from './../pokemon/pokemons';

@Injectable()
export class PokeradarService {

  private _isScanning$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _nearbyPokemons$: BehaviorSubject<Set<any>> = new BehaviorSubject(new Set());
  private _lastPokemon$: BehaviorSubject<any> = BehaviorSubject.create();
  private _expiredPokemon$: BehaviorSubject<any> = BehaviorSubject.create();
  private _isRadarOn$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private geoSubscription: any;

  public isScanning$: Observable<boolean> = this._isScanning$.asObservable();
  public nearbyPokemons$: Observable<Set<any>> = this._nearbyPokemons$.asObservable();
  public lastPokemon$: Observable<any> = this._lastPokemon$.asObservable();
  public expiredPokemon$: Observable<any> = this._expiredPokemon$.asObservable();
  public isRadarOn$: Observable<any> = this._isRadarOn$.asObservable();

  private API_URL: String = "https://pokevision.com/map/data";
  private previousLocation: any;
  private lastThrottleTime: number = Date.now();
  private MAX_THROTTLE_TIME: number = 1 * 60 * 1000; //1 minutes 

  constructor(private http: Http,
                private jsonp: Jsonp, 
                private geolocationService: GeolocationService, 
                private pokemonsService: PokemonsService) {
    
    
  }

  private startRadar(): void {
    this.stopRadar();
    this._isRadarOn$.next(true);
    console.log('[RADAR] RADAR ACTIVATED');
    this.geoSubscription = this.geolocationService.currentPosition$
    .debounceTime(1000)
    .distinctUntilChanged()
    .subscribe((pos) => {

        console.log('[RADAR] RADAR POSITION TICK: ', pos.latitude, pos.longitude);   
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
            console.log('[RADAR] RADAR DETECTED POKEMONS:', pokemons);
            //Fill it
            for (let pokemon of pokemons) {
                //Delete uid to check duplicate
                let pokemoncheck = pokemon;
                delete pokemoncheck.uid;
                if (this._nearbyPokemons$.getValue().has(pokemoncheck)) continue;
                this._lastPokemon$.next(pokemon);
                //Add it to the observable set
                let updatedNearbyPokemons = this._nearbyPokemons$.getValue();
                updatedNearbyPokemons.add(pokemon);
                this._nearbyPokemons$.next(updatedNearbyPokemons);
                this.watchPokemonExpiry(pokemon);
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
    console.log('[RADAR] RADAR DEACTIVATED');
  }

  private watchPokemonExpiry(pokemon: any): void {
    let expiration_time = pokemon.expiration_time - new Date().getTime() / 1000;
    console.log(`[RADAR] ${pokemon.name} will disapear in ${expiration_time} seconds`);
    setTimeout(() => {
        console.log(`[RADAR] ${pokemon.name} disapeared`);
        this._expiredPokemon$.next(pokemon);
        let updatedNearbyPokemons = this._nearbyPokemons$.getValue();
        if (!updatedNearbyPokemons.delete(pokemon)) return;
        this._nearbyPokemons$.next(updatedNearbyPokemons);
    }, expiration_time*1000);
  }

  toggleRadar(): void {
    this._isRadarOn$.getValue() ? this.stopRadar() : this.startRadar();
  }

  /**
   * Check if the distance with the previous location is noticeable
   * This is used to throttle requests
   */
  private shouldThrottle(pos: any) {
    if (this.lastThrottleTime && ((Date.now() - this.lastThrottleTime) > this.MAX_THROTTLE_TIME)) {
        console.log('[RADAR] THROTTLING > 1 MINUTE');
        this.lastThrottleTime = Date.now();
        return false;
    }
    if (this.previousLocation && (this.geolocationService.calculateDistance(this.previousLocation, pos)
        < this.geolocationService.DISTANCE_THRESHOLD_IN_METERS)) {
            console.log('[RADAR] DISTANCE TOO LOW');
            return true;
    }
    return false;
  }

  private scanArea(lat: number, long: number): Promise<any> {
      this._isScanning$.next(true);
      let headers = new Headers({ 'Accept': 'application/json' });
      let options = new RequestOptions({headers: headers});
      let url = encodeURI(`${this.API_URL}/${lat}/${long}`);
      return this.jsonp.get(`https://jsonp.afeld.me/?url=${url}&callback=JSONP_CALLBACK`, options)
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
                console.error('[RADAR] ERROR IN RADAR SCAN:', err);
            });
  }

}