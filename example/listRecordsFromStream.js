'use strict';

var getRecords = require('../index.js').getRecordsStream;

var options = {
    station: 'Šibenik',
    type: 'departure'
};

console.log('List of %ss to: %s', options.type, options.station);
console.log('------------------------------------------------------------');

getRecords(options)
    .on('data', function(record){
        console.log(record.departure, record.arrival, 
            record.gateNo, record.carrier);
    });