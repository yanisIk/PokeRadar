'use strict';

const API_KEY = process.env.API_KEY;


/**
 * Auth middleware.
 */
exports.isMobileApp = function(req, res, next) {
  if (req.headers['api-key'] === API_KEY) {
    return next();
  }
  res.sendStatus(403);
};

