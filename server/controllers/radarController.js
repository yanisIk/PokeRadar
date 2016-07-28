'use strict';

const pokemonGoService = require('../services/pokemonGoService');

/**
 * POST /radar
 */
exports.findPokemons = function(req, res, next) {
  let coords = {latitude: req.body.lat, longitude: req.body.long};
  let loginInformations = {username: req.body.username, password: req.body.password, token: req.body.token};
  pokemonGoService.findPokemons(coords, loginInformations)
  .then((pokemons) => {
    res.status(200).send(pokemons);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send();
  });
};