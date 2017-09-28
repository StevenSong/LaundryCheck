'use strict';

const Alexa = require('alexa-sdk');

const APP_ID = "";

const APIKEY = "8c31a4878805ea4fe690e48fddbfffe1"

const handlers = {
    'LaunchRequest': function () {
        this.emit(":tell", "Welcome to Laundry Check");
        if (this.attributes['roomID'] === null) {
            this.emit(":ask", "Please set your laundry room ID before continuing");
        }
    },
    'setLaundryRoom': function () {
        var roomID = parseInt(this.event.request.intent.slots.roomID.value);
        if (isNaN(roomID)) {
            this.emit(":tell", "no room ID given");
        } else {
            this.attributes['roomID'] = roomID;
            this.emit(":tell", "Laundry Room ID set to " + roomID.toString());
        }
    },
    'getLaundryRoom': function () {
        //TO REMOVE
        this.attributes['roomID'] = 1394850;

        if (this.attributes['roomID'] === undefined) {
            this.emit(":ask", "Please set your laundry room ID before continuing");
        } else {
            console.log("getLaundryRoom called with valid room!")
            
            var roomID = this.attributes['roomID'];
            var url = "http://api.laundryview.com/room/?api_key=" + APIKEY + "&method=getAppliances&location=" + roomID.toString();
            var caller = this;

            getWebRequest(url, function(response) {
                var parseString = require('xml2js').parseString;
                parseString(response, function (err, result) {
                    var roomName = result.laundry_room.laundry_room_name;
                    var machines = result.laundry_room.appliances[0].appliance;
                    var numMachines = machines.length;
                    var numWashers = 0;
                    var numDryers = 0;

                    for (var i = 0; i < numMachines; i++) {
                        var currMachine = machines[i];
                        console.log(currMachine);
                        if (currMachine.status == "Available") {
                            if (machines[i].appliance_type == "WASHER") {
                                numWashers++;
                            } else if (currMachine.appliance_type == "DRYER") {
                                numDryers++;
                            } else {
                                console.log("FOUND BAD MACHINE");
                            }
                        }
                    }

                    var toPrint = "In " + roomName + ", There are " + numWashers +
                                  " washing machines available and " + numDryers +
                                  " drying machines available";
                    caller.emit(":tell", toPrint);
                });
            });
        }
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', "Would you like to check on the status of a laundry room?");
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', "Goodbye");
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', "Goodbye");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that.');
    }
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.dynamoDBTableName = 'laundryCheckUsers';
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function getWebRequest(url, callback) {
        var http = require('http');
        var response = "";
        http.get(url, function(res) {
            res.on("data", function(data) {
                response += data; 
            });
            
            res.on("end", function() {
                callback(response);
            })
        });
}