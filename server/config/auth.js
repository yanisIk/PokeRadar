'use strict';

const API_KEY = process.env.API_KEY;


/**
 * Auth middleware.
 */
exports.hasAPIKey = function(req, res, next) {
  if (req.headers['api-key'] === API_KEY) {
    return next();
  }
  res.status(403).send('Unauthenticated');
};

