'use strict';

const pogobuf = require('pogobuf');
const POGOProtos = require('node-pogo-protos');
const s2 = require('s2geometry-node');
//const pokeaccounts = require('/pokemon-accounts.json');


/**
 * Utility method to get all the S2 Cell IDs in a given radius.
 * Ported from https://github.com/tejado/pgoapi/blob/master/pokecli.py
 */
function getCellIDs(radius, lat, lng) {
    var cell = new s2.S2CellId(new s2.S2LatLng(lat, lng)),
        parentCell = cell.parent(15),
        prevCell = parentCell.prev(),
        nextCell = parentCell.next(),
        cellIDs = [parentCell.id()];

    for (var i = 0; i < radius; i++) {
        cellIDs.unshift(prevCell.id());
        cellIDs.push(nextCell.id());
        prevCell = prevCell.prev();
        nextCell = nextCell.next();
    }

    return cellIDs;
}

/**
 *	Transforms a tweet into a getstream activity
 */
exports.findPokemons = function(coords, loginInformations) {
    var login = new pogobuf.PTCLogin();
    var client = new pogobuf.Client();
    var loginPromise = Promise.resolve(loginInformations.token);
    //Used to send it back to the user so he can cache it and resend it
    var clientToken;
    
    if (!loginInformations.token) {
        loginPromise = login.login(loginInformations.username, loginInformations.password);
    }
    return loginPromise
    .then((token) => {
        clientToken = token;
        // Initialize the client
        client.setAuthInfo('ptc', token);
        client.setPosition(coords.lat, coords.long);

        return client.init();
    })
    .then(() => {
        // Retrieve all map objects in the surrounding area
        var cellIDs = getCellIDs(100, coords.lat, coords.long);
        return client.getMapObjects(cellIDs, Array(cellIDs.length).fill(0));
    })
    .then((mapObjects) => {
        return Promise.resolve({mapObjects: mapObjects, token: clientToken});
    })
}


