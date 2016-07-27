'use strict';

/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const expressValidator = require('express-validator');


/**
 * Load environment variables = require( .env file, where API keys and passwords are configured.
 *
 * Default path: .env
 */
dotenv.load({ path: '.env' });

/**
 * Controllers (route handlers).
 */
const radarController = require('./controllers/radarController');

/**
 * Validators
 */
const validators = require('./controllers/validators');

/**
 * API keys and Passport configuration.
 */
const auth = require('./config/auth');

/**
 * Create Express server.
 */
const app = express();


/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());


app.get('/', function (req, res) {res.send("PokeRadar API");});
app.post('/radar', auth.isMobileApp, validators.validateRadarRequest, radarController.findPokemons)


/**
 * Start Express server
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

exports.app = app;
