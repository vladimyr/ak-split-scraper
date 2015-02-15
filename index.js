var cheerio         = require('cheerio'),
    argv            = require('yargs').argv,
    data            = require('./config/data-constants'),
    Promise         = require('bluebird'),
    request         = require('request');

var cookieJar = request.jar(),
        request   = request.defaults({
        jar:                cookieJar,
        followRedirect:     true,
        followAllRedirects: true
});

request = Promise.promisifyAll(request);
    
var town = argv.town || 'Sibenik';
var arrival = argv.arrival || 0;
var date = new Date().toISOString().replace(/T.*/, '');

 		
if (!arrival) {
	var constants = data.departure; 
} else {
	var constants = data.arrival;
}

console.log(town, data.towns[town]);
var  post_data = {
        __EVENTARGUMENT: '',
       sortOrder: constants.sortOrder,
        lineType: constants.lineType,
        dlDestination: data.towns[town],
        dlTravelDate: date
 };

function processBody(pageNum) {
    return function(_, body) {
        var $ = cheerio.load(body);
        var totalPages = 0;
        $('.scheduleTableItem, .scheduleTableAltItem').each(function() {
            var row = [];
            $(this).find('td').each(function() {
                row.push($(this).text());
            });
            var output = row.join('\t');
            if (output.substr(0, 8) != 'Stranica') {
                console.log(output);
            } else {
                totalPages = output.split(/[\s]+/).pop();
            }
        }); 
        
        if (pageNum === totalPages - 0 + 4 )
            return; 

        var href = $("a[href^='javascript:__doPostBack']").eq(pageNum).attr("href");
        var target = href.substring(href.indexOf("'") + 1, href.indexOf(",") - 1);
        post_data.__EVENTTARGET = target;
        post_data.__VIEWSTATE = $("#__VIEWSTATE").val();
        post_data.__VIEWSTATEGENERATOR = $("#__VIEWSTATEGENERATOR").val();
        post_data.__EVENTVALIDATION = $("#__EVENTVALIDATION").val();
            
        if (pageNum != 5)
            return [];

        var array = [];
        for (var i = 0; i < totalPages; i++) {
            array.push(void(0));
        }
        return array;
    };
}
function postRequest() {
    return request.postAsync(constants.url, {
        form: post_data,
    });
}
   
request.getAsync(constants.url) 
    .spread(postRequest)
    .spread(processBody(0))
    .spread(postRequest)
    .spread(processBody(5))
    .reduce(function(total, item, index) {
        return postRequest().spread(processBody(5 + index));
    });



