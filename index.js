'use strict';

var cheerio      = require('cheerio'),
    request      = require('request'),
    through      = require('through'),
    fecha        = require('fecha'),
    Promise      = require('bluebird'),
    promiseWhile = require('promise-while')(Promise),
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
    options      = options || {};
    options.type = options.type || 'departure';
    options.date = options.date || new Date();

    var stationName = options.station || options.stationName,
        stationCode = options.stationCode;

    var stations      = {},
        recordsStream = through();

    // ensure that station is defined
    if (!stationCode && (!stationName || !stationName.toUpperCase)) {
        recordsStream.emit('error', new Error('Station must be defined!'));
        return recordsStream;
    }

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

    var pageIndex = 0;

    function processForm(_, body){
        return actions.processInitialForm(cheerio.load(body), targetStation, 
            stations, formData);
    }

    function processPage(_, body){
        return actions.processTimetablePage(cheerio.load(body), pageIndex++, 
            recordsStream, formData);
    }

    var loop = true;

    request.getAsync(targetUrl)
        .spread(processForm)
        .then(function complete(){
            // loop through pages
            return promiseWhile(function predicate() {
                return loop;
            }, function step(){
                return request.postAsync(targetUrl, { form: formData })
                    .spread(processPage)
                    .then(function(result) { loop = !result; });
            });
        })
        .catch(function error(err){
            recordsStream.emit('error', err);
        });

    return recordsStream;
}

function getRecords(options, callback){
    var records = [];

    getRecordsStream(options)
        .on('error', callback)
        .pipe(through(function write(record){
            records.push(record);
        }, function end(){
            this.queue(null);
            callback(null, records);
        }));
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