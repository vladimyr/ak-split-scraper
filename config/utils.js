var P   = require('bluebird'),
    fs  = P.promisifyAll(require('fs'));

// example 1
fs.readFileAsync("file.json").then(JSON.parse).then(function(val) {
    console.log(val);
    debugger;
})
.catch(SyntaxError, function(e) {
    console.error("invalid json in file");
})
.catch(function(e) {
    console.error("unable to read file");
});
