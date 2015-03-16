'use strict';

var fecha      = require('fecha'),
    getRecords = require('../index.js').getRecords;

var options = {
    station: 'Šibenik',
    type: 'departure',
    date: fecha.parse('3/20/15', 'shortDate') // M/D/YY
};

console.log('List of %ss to: %s (date: %s)', options.type, 
    options.station, fecha.format(options.date, 'YYYY-MM-DD'));
console.log('------------------------------------------------------------');

getRecords(options, function(err, records){
    records.forEach(function(record){
        console.log(record.departure, record.arrival, 
            record.gateNo, record.carrier);
    });
});
    