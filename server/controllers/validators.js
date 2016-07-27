'use strict';

const util = require('util');

/**
 * Validate the coordinates
 */
exports.validateRadarRequest = function(req, res, next) {
    req.checkBody('username', 'PTC username missing').notEmpty();
    req.checkBody('password', 'PTC password missing').notEmpty();
    req.checkBody('lat', 'latitude missing').notEmpty();
    req.checkBody('longitude', 'longitude missing').notEmpty();
    
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send('Invalid request, missing parameters', util.inspect(errors));
        return errors;
    }
    next();
}


