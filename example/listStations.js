'use strict';

var getTravelData = require('../index.js').getTravelData;

console.log('List of departure stations:');
console.log('------------------------------------------------------------');

getTravelData({ type: 'departure' })
    .then(function(travelData){
        return travelData.stations;
    })
    .each(function(station){
        console.log(station.code, station.name);
    });