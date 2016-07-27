var chai = require('chai');
var should = chai.should();
var validators = require('../controllers/validators');

describe('Radar bad request validation', function() {
  it('should return errors', function(done) {
    var req = {};
    req.body = {
      username: "test",
      password: "test",
      lat: 0,
      long: undefined
    };
    var errors = validators.validateRadarRequest(req, {}, function () {});
    errors.should.not.be.undefined
    done();
  });
  
describe('Radar good request validation', function() {
  it('should not return errors', function(done) {
    var req = {};
    req.body = {
      username: "test",
      password: "test",
      lat: 0,
      long: 0,
      token: 'abcd1234'
    };
    var errors = validators.validateRadarRequest(req, {}, function () {});
    errors.should.be.undefined
    done();
  });

