var request = require('supertest');
var app = require('../app.js');
var dotenv = require('dotenv');
dotenv.load({ path: '.env' });

describe('GET /', function() {
  it('should return 200 OK', function(done) {
    request(app)
      .get('/')
      .expect(200, done);
  });
});

describe('POST unauthenticated to /radar', function() {
  it('should return 403 Unauthorized', function(done) {
    request(app)
      .post('/radar')
      .expect(403, done);
  });
});

describe('POST authenticated with no data to /radar', function() {
  it('should return 400 Bad request', function(done) {
    request(app)
      .post('/radar')
      .set('api-key', process.env.API_KEY)
      .expect(400, done);
  });
});

describe('POST authenticated with valid data to /radar', function() {
  it('should return 200 OK', function(done) {
    request(app)
      .post('/radar')
      .send({
        username: "test",
        password: "test",
        lat: 0,
        long: 0,
        token: 'abcd1234'
      })
      .set('api-key', process.env.API_KEY)
      .expect(200, done);
  });
});

describe('GET /random-url', function() {
  it('should return 404', function(done) {
    request(app)
      .get('/random')
      .expect(404, done);
  });
});