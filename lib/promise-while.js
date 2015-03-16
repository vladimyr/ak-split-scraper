'use strict';

var Promise = require('bluebird');

function promiseWhile(action){
    return new Promise(function(resolve, reject){        
        function step(completed){
            if (completed) {
                resolve();
                return;
            }

            loop();
        }

        function loop(){
            return action().then(step, reject);
        };
        
        process.nextTick(loop);
    });
}

Promise.while = promiseWhile;

module.exports = promiseWhile;