import {Component} from '@angular/core';
import {Platform, ionicBootstrap} from 'ionic-angular';
import {StatusBar, Splashscreen} from 'ionic-native';

import {RadarPage} from './pages/radar/radar';

import {HTTP_PROVIDERS, JSONP_PROVIDERS} from '@angular/http';
import {GeolocationService} from './services/geolocation/geolocation';
import {PokeradarService} from './services/pokemon/pokeradar';
import {PokemonsService} from './services/pokemon/pokemons';
import {ConnectivityService} from './services/connectivity/connectivity';



@Component({
  templateUrl: 'build/app.html'
})
export class MyApp {
  rootPage: any = RadarPage;

  constructor(platform: Platform) {
    platform.ready().then(() => {
      StatusBar.styleDefault();
      Splashscreen.hide();
    });
  }
}

ionicBootstrap(MyApp, [HTTP_PROVIDERS,
                      JSONP_PROVIDERS, 
                      GeolocationService, 
                      PokeradarService,
                      PokemonsService, 
                      ConnectivityService]);
