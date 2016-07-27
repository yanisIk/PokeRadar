import {Injectable} from '@angular/core';
import {Platform} from 'ionic-angular';
import { Http, Response } from '@angular/http';
import { Observable, Observer, BehaviorSubject } from 'rxjs';

@Injectable()
export class PokemonsService {

  public pokemons: [any];

  constructor(private http: Http) {
      this.loadPokemons();
  }

  private loadPokemons(): void {
      if (!this.pokemons) {
        this.http.get('/data/pokemons.json')
        .map(res => res.json())
        .subscribe(data => this.pokemons = data.pokemons,
                    err => console.log(err),
                    () => console.log('Loaded Pokemons!'));
      }
  }

  public getPokemon(id: number): any {
      return this.pokemons[id - 1];
  }

  public getPokemonIconURL(id: number): any {
      return `/img/pokemon_icons/${id}.png`;
  }

}