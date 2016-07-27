import {Insomnia} from 'ionic-native';
import {Component, ViewChild} from "@angular/core";
import {Modal, NavController, Platform, Content, ViewController} from 'ionic-angular';
import {Observable, Observer, BehaviorSubject} from 'rxjs';

import {GeolocationService} from './../../services/geolocation/geolocation';
import {PokeradarService} from './../../services/pokemon/pokeradar';

@Component({
  templateUrl: 'build/pages/options/options.html'
})
export class OptionsPage {

    keepAwake$: BehaviorSubject<Boolean>;

    constructor(private _nav: NavController, private _viewCtrl: ViewController) {
        let keepAwake = false;
        //Find the saved setting
        this.keepAwake$ = new BehaviorSubject(keepAwake);
    }

    toggleKeepAwake() {
        if (this.keepAwake$.getValue()) {
            Insomnia.allowSleepAgain();
            this.keepAwake$.next(false);
        } else {
            Insomnia.keepAwake();
            this.keepAwake$.next(true);
        }
    }

    dismiss() {
        this._viewCtrl.dismiss();
    }
}
