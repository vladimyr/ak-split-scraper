'use strict';

var cheerio      = require('cheerio'),
    request      = require('request'),
    through      = require('through'),
    fecha        = require('fecha'),
    Promise      = require('bluebird'),
    promiseWhile = require('./lib/promise-while.js'),
    actions      = require('./lib/actions.js');

var request = request.defaults({
    jar:                request.jar(),
    followRedirect:     true,
    followAllRedirects: true
});

request = Promise.promisifyAll(request);


var baseUrl = 'http://www.ak-split.hr/EN/vozni.red/';

function _getTargetUrl(options){
    var type = options.type;

    if (type === 'arrival') 
        return baseUrl + 'VozniRedDolazaka.aspx';
    else
        return baseUrl + 'VozniRedOdlazaka.aspx';
}

function _getSortOrder(options){
    var type = options.type;

    if (!options.sortBy)
        return (type === 'arrival') ? 'polazak' : 'dolazak';
    
    if (options.sortBy === 'arrival')
        return 'dolazak';
    
    if (options.sortBy === 'departure')
        return 'odlazak';
}


function getRecordsStream(options){
    options      = options || {},
    options.type = options.type || 'departure';
    options.date = options.date || new Date();

    var stationName = options.station || options.stationName,
        stationCode = options.stationCode;

    // ensure that station is defined
    if (!stationCode && (!stationName || !stationName.toUpperCase))
        throw new Error('Station must be defined!');

    var targetStation = {
        code: stationCode,
        name: stationName
    };

    var sortOrder  = _getSortOrder(options),
        targetUrl  = _getTargetUrl(options),
        lineType   = (options.type === 'arrival') ? 1 : 2,
        travelDate = fecha.format(options.date, 'YYYY-MM-DD');

    var formData = {
        __EVENTARGUMENT: '',
        sortOrder: sortOrder,
        lineType: lineType,
        dlTravelDate: travelDate
    };

    var stations      = {},
        recordsStream = through();

    var pageIndex = 0;

    function processForm(_, body){
        return actions.processInitialForm(cheerio.load(body), targetStation, 
            stations, formData);
    }

    function processPage(_, body){
        return actions.processTimetablePage(cheerio.load(body), pageIndex++, 
            recordsStream, formData);
    }

    request.getAsync(targetUrl)
        .spread(processForm)
        .then(function complete(){
            // loop through pages
            return Promise.while(function step(){
                return request.postAsync(targetUrl, { form: formData })
                    .spread(processPage);
            });
        });

    return recordsStream;
}

function getRecords(options, callback){
    var records = [];

    try {
        getRecordsStream(options)
            .pipe(through(function write(record){
                records.push(record)
            }, function end(){
                this.queue(null);
                callback(null, records);
            }));
    } catch(err){
        callback(err);
    }
}

function getTravelData(options){
    options = options || {};

    var targetUrl = _getTargetUrl(options);

    return request.getAsync(targetUrl)
        .spread(function complete(_, body){
            return actions.processInitialForm(cheerio.load(body));
        });
}

module.exports = {
    getRecordsStream: getRecordsStream,
    getRecords: getRecords,
    getTravelData: getTravelData
};