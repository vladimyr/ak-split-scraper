'use strict';

var getTravelData = require('../index.js').getTravelData;

console.log('List of available travel dates:');
console.log('------------------------------------------------------------');

getTravelData({ type: 'departure' })
    .then(function(travelData){
        return travelData.dates;
    })
    .each(function(travelDate){
        console.log(travelDate);
    });