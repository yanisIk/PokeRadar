import {Component, ViewChild, ElementRef} from "@angular/core";
import {NavController, Platform, Modal, Loading} from 'ionic-angular';
import {Observable, BehaviorSubject} from 'rxjs';

import {GeolocationService} from './../../services/geolocation/geolocation';
import {PokeradarService} from './../../services/pokemon/pokeradar';
import {PokemonsService} from './../../services/pokemon/pokemons';
import {ConnectivityService} from './../../services/connectivity/connectivity';

import {OptionsPage}  from './../options/options';

declare var google;


@Component({
  templateUrl: 'build/pages/radar/radar.html',
  providers: [GeolocationService, PokeradarService, PokemonsService, ConnectivityService]
})
export class RadarPage {
  
  private pokemonMapStyle = [{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#a1f199"}]},{"featureType":"landscape.natural.landcover","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"poi.attraction","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"color":"#e4dfd9"}]},{"featureType":"poi.business","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#84b09e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#fafeb8"},{"weight":"1.25"}]},{"featureType":"road.highway","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#5ddad6"}]}]
  
  @ViewChild('map') mapElement: ElementRef;
  private map: any;
  private minZoom: Number = 15;
  private maxZoom: Number = 20;
  private userMarker: any;
  private pokemonMarkers: Map<any, any> = new Map(); //(pokemon.uid , marker);
  isMapInitialized$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  isScanning$: Observable<boolean>;
  isOnline$: Observable<boolean>;
  isRadarOn$: Observable<boolean>;
  nearbyPokemons$: Observable<Set<any>>;

  private subscriptions: any[] = [];

  constructor(private _navController: NavController, private platform: Platform,
              private geolocationService: GeolocationService,
              private pokeradarService: PokeradarService,
              private pokemonsService: PokemonsService,
              private connectivityService: ConnectivityService) {
      this.isScanning$ = pokeradarService.isScanning$;
      this.isOnline$ = connectivityService.connectionStatus$;
      this.isRadarOn$ = pokeradarService.isRadarOn$;
      this.nearbyPokemons$ = pokeradarService.nearbyPokemons$;
  }

  ngAfterViewInit() {
    this.platform.ready().then(() => this.initRadar());
  }

  private initRadar(): void {
    let loading = Loading.create({content: 'Initializing Radar...'});
    this._navController.present(loading)
    .then(() => this.initMap())
    .then(() => {
      loading.dismiss();
      this.isMapInitialized$.next(true);
      this.subscriptions.push(this.watchPosition());
      this.subscriptions.push(this.watchPokemons());
      this.subscriptions.push(this.watchPokemonsExpiry());
    })
    .catch((err) => console.log('[MAP] ERROR IN INIT RADAR', err));
  }

  /**
   * Init map and set it to current position
   */
  private initMap(): Promise<any> {
      return new Promise((resolve, reject) => {

        this.geolocationService.currentPosition$.first().subscribe((currentPosition) => {
          console.log('[MAP] INITIALIZING MAP');
          let mapOptions = {
            zoom: 15,
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
            draggable: false,
            disableDefaultUI: true,
            center: new google.maps.LatLng(currentPosition.latitude, currentPosition.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: this.pokemonMapStyle
          };
          
          let mapDiv = this.mapElement.nativeElement;
          this.map = new google.maps.Map(mapDiv, mapOptions);
          this.userMarker = new google.maps.Marker({position: {lat: currentPosition.latitude, lng: currentPosition.longitude}, 
                                                    map: this.map,
                                                    animation: google.maps.Animation.DROP,
                                                    icon: '/img/Pokemon_Trainer_Red.png'
                                                  });
          return resolve();
        });
      });
      
  }

  /**
   * Subscribes to current position and moves the map
   */
  private watchPosition(): any {
    return this.geolocationService.currentPosition$
    .distinctUntilChanged()
    .subscribe((pos) => {
      console.log('[MAP] MAP POSITION TICK: ', pos.latitude, pos.longitude);
      let myPosition = new google.maps.LatLng(pos.latitude, pos.longitude);
      this.map.setCenter(myPosition);
      this.userMarker.setPosition(myPosition);
    });
  }

  /**
   * Subscribes to current pokemons and display them on the map
   */
  private watchPokemons(): any {
    return this.pokeradarService.lastPokemon$
    .subscribe((pokemon) => {
      //Clean markers
      console.log('[MAP] NEW POKEMON: ' + pokemon.name);
      let marker = new google.maps.Marker({
        position: new google.maps.LatLng(pokemon.latitude, pokemon.longitude),
        title: pokemon.name,
        animation: google.maps.Animation.DROP,
        icon: {
          url: pokemon.icon
        }
      });
      if (!this.pokemonMarkers.has(pokemon.uid)) {
        marker.setMap(this.map);
        this.pokemonMarkers.set(pokemon.uid, marker);
      }
      
    });
  }

  /**
   * Subscribe to expired pokemons and delete the associated marker
   */
  private watchPokemonsExpiry(): any {
    return this.pokeradarService.expiredPokemon$.subscribe((expiredPokemon) => {
      if (!this.pokemonMarkers.has(expiredPokemon.uid)) return;
      console.log(`[MAP] ${expiredPokemon.name} disapeared`);
      let marker = this.pokemonMarkers.get(expiredPokemon.uid);
      marker.setMap(null);
      this.pokemonMarkers.delete(expiredPokemon.uid);
    });
  }

  //////// BUTTON ACTIONS ////////

  private toggleRadar() {
    this.pokeradarService.toggleRadar();
  }

  private showOptionsModal() : void {
    let optionsModal = Modal.create(OptionsPage);
    this._navController.present(optionsModal);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  
}