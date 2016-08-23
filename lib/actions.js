'use strict';

function collectStations($, stations){
    $('#dlDestination option').each(function(){
        var $option = $(this),
            name    = $option.text(),
            code    = $option.val();

        stations[name] = {
            name: name,
            code: code
        };
    });
}

function collectDates($, dates){
    $('#dlTravelDate option').each(function(){
        var $option = $(this),
            date    = $option.val();

        dates.push(date);
    });
}

function collectRecords($, recordsStream){
    var $pagination;

    $('tr.scheduleTableItem, tr.scheduleTableAltItem').each(function(){
        var $cols = $(this).find('td');

        // pagination row
        if ($cols.length === 1) {
            $pagination = $cols.find('b');
            return;
        }

        // record row
        var departure = $cols.eq(0).text(),
            arrival   = $cols.eq(1).text(),
            gateNo    = $cols.eq(2).text(),
            carrier   = $cols.eq(3).text();

        recordsStream.write({
            departure: departure,
            arrival: arrival,
            gateNo: gateNo,
            carrier: carrier
        });
    });

    return $pagination;
}

function updateFormData($, $targetBtn, formData){
    var targetHref = $targetBtn.attr('href');

    var target = targetHref.substring(
        targetHref.indexOf("'") + 1, 
        targetHref.indexOf(",") - 1
    );

    formData.__EVENTTARGET        = target;
    formData.__VIEWSTATE          = $('#__VIEWSTATE').val();
    formData.__VIEWSTATEGENERATOR = $('#__VIEWSTATEGENERATOR').val();
    formData.__EVENTVALIDATION    = $('#__EVENTVALIDATION').val();
}

function getStationDesc(stations, name) {
    return stations[name] || stations[name.toUpperCase()];
}

function processInitialForm($, targetStation, stations, formData){
    var $targetBtn = $('td[colspan="2"] a[href^="javascript:__doPostBack"]'),
        $body      = $; 

    stations = stations || {};

    function getStationByName(name){
        return stations[name];
    }

    if (arguments.length <= 1) {
        var dates = [];
        collectDates($body, dates);
        collectStations($body, stations);

        return {
            stations: Object.keys(stations).map(getStationByName),
            dates: dates
        };
    }

    var destination;

    if (!targetStation.code) {
        collectStations($body, stations);
        destination = getStationDesc(stations, targetStation.name).code ;
    } else {
        destination = targetStation.code;
    }

    formData.dlDestination = destination;
    updateFormData($body, $targetBtn, formData);
}

function processTimetablePage($, pageIndex, recordsStream, formData){
    var $timetableRows = $('tr.scheduleTableItem'),
        $message       = $('#lblMessage');

    if ($timetableRows.length === 0) {
        if ($message.text() === 'Nije pronađen niti jedan zapis!') {
            recordsStream.end();
            return true;
        }

        throw new Error('Invalid options provided!');
    }

    var $pagination = collectRecords($, recordsStream),
        $pageBtns   = $pagination.children().slice(1);

    if (pageIndex === $pageBtns.length - 1) {
        recordsStream.end();
        return true;
    }

    var targetBtn = $pageBtns.get(pageIndex + 1);
    updateFormData($, $(targetBtn), formData);

    return false;
}

module.exports = {
    processInitialForm: processInitialForm,
    processTimetablePage: processTimetablePage
};