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
    'getAllMachines': function () {
        //this.attributes['roomID'] = 1394850;
        var roomID = this.attributes['roomID'];

        if (roomID === undefined) {
            this.emit(":ask", "Please set your laundry room ID before continuing");
        } else {
            var url = "http://api.laundryview.com/room/?api_key=" + APIKEY +
                      "&method=getAppliances&location=" + roomID.toString();
            var caller = this;

            getWebRequest(url, function(response) {
                var parseString = require('xml2js').parseString;
                parseString(response, function(err, data) {
                    allMachines(data, caller);
                });
            });
        }
    },
    'getAllWashers': function () {
        //this.attributes['roomID'] = 1394850;
        var roomID = this.attributes['roomID'];

        if (roomID === undefined) {
            this.emit(":ask", "Please set your laundry room ID before continuing");
        } else {
            var url = "http://api.laundryview.com/room/?api_key=" + APIKEY +
                      "&method=getAppliances&location=" + roomID.toString();
            var caller = this;

            getWebRequest(url, function(response) {
                var parseString = require('xml2js').parseString;
                parseString(response, function(err, data) {
                    allWashers(data, caller);
                });
            });
        }
    },
    'getAllDryers': function () {
        //this.attributes['roomID'] = 1394850;
        var roomID = this.attributes['roomID'];

        if (roomID === undefined) {
            this.emit(":ask", "Please set your laundry room ID before continuing");
        } else {
            var url = "http://api.laundryview.com/room/?api_key=" + APIKEY +
                      "&method=getAppliances&location=" + roomID.toString();
            var caller = this;

            getWebRequest(url, function(response) {
                var parseString = require('xml2js').parseString;
                parseString(response, function(err, data) {
                    allDryers(data, caller);
                });
            });
        }
    },
    'getAvailableMachines': function () {
        //this.attributes['roomID'] = 1394850;
        var roomID = this.attributes['roomID'];

        if (roomID === undefined) {
            this.emit(":ask", "Please set your laundry room ID before continuing");
        } else {
            var url = "http://api.laundryview.com/room/?api_key=" + APIKEY +
                      "&method=getAppliances&location=" + roomID.toString();
            var caller = this;

            getWebRequest(url, function(response) {
                var parseString = require('xml2js').parseString;
                parseString(response, function(err, data) {
                    availableMachines(data, caller);
                });
            });
        }
    },
    'getAvailableWashers': function () {
        //this.attributes['roomID'] = 1394850;
        var roomID = this.attributes['roomID'];

        if (roomID === undefined) {
            this.emit(":ask", "Please set your laundry room ID before continuing");
        } else {
            var url = "http://api.laundryview.com/room/?api_key=" + APIKEY +
                      "&method=getAppliances&location=" + roomID.toString();
            var caller = this;

            getWebRequest(url, function(response) {
                var parseString = require('xml2js').parseString;
                parseString(response, function(err, data) {
                    availableWashers(data, caller);
                });
            });
        }
    },
    'getAvailableDryers': function () {
        //this.attributes['roomID'] = 1394850;
        var roomID = this.attributes['roomID'];

        if (roomID === undefined) {
            this.emit(":ask", "Please set your laundry room ID before continuing");
        } else {
            var url = "http://api.laundryview.com/room/?api_key=" + APIKEY +
                      "&method=getAppliances&location=" + roomID.toString();
            var caller = this;

            getWebRequest(url, function(response) {
                var parseString = require('xml2js').parseString;
                parseString(response, function(err, data) {
                    availableDryers(data, caller);
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

function allMachines(data, caller) {
    var room = data.laundry_room;
    var roomName = room.laundry_room_name;
    var machines = room.appliances[0].appliance;
    var numMachines = machines.length;
    var numWashers = 0;
    var numAvailWashers = 0;
    var numDryers = 0;
    var numAvailDryers = 0;
    var numUnknown = 0;

    for (var i = 0; i < numMachines; i++) {
        if (machines[i].lrm_status == "Offline") {
            numUnknown++;
        } else if (machines[i].appliance_type == "WASHER") {
            numWashers++;
            if (machines[i].out_of_service == "0" &&
                machines[i].status == "Available") {
                numAvailWashers++;
            }
        } else if (machines[i].appliance_type == "DRYER") {
            numDryers++;
            if (machines[i].out_of_service == "0" &&
                machines[i].status == "Available") {
                numAvailDryers++;
            }
        }
    }

    var toPrint = "In " + roomName + ", " + numAvailWashers + " out of " + numWashers +
                  " washing machines are available and " + numAvailDryers + " out of " + numDryers +
                  " drying machines are available.";
    if (numUnknown != 0) {
        toPrint += " Information on " + numUnknown + " machines was not available.";
    }
    caller.emit(":tell", toPrint);
}

function allWashers(data, caller) {
    var room = data.laundry_room;
    var roomName = room.laundry_room_name;
    var machines = room.appliances[0].appliance;
    var numMachines = machines.length;
    var numWashers = 0;
    var numAvailWashers = 0;
    var numUnknown = 0;

    for (var i = 0; i < numMachines; i++) {
        if (machines[i].appliance_type == "WASHER") {
            if (machines[i].lrm_status == "Offline") {
                numUnknown++;
            } else {
                numWashers++;
                if (machines[i].status == "Available") {
                    numAvailWashers++;
                }
            }
        }
    }

    var toPrint = "In " + roomName + ", " + numAvailWashers + " out of " + numWashers +
                  " washing machines are available.";
    if (numUnknown != 0) {
        toPrint += " Information on " + numUnknown + " washing machines was not available.";
    }
    caller.emit(":tell", toPrint);
}

function allDryers(data, caller) {
    var room = data.laundry_room;
    var roomName = room.laundry_room_name;
    var machines = room.appliances[0].appliance;
    var numMachines = machines.length;
    var numDryers = 0;
    var numAvailDryers = 0;
    var numUnknown = 0;

    for (var i = 0; i < numMachines; i++) {
        if (machines[i].appliance_type == "DRYER") {
            if (machines[i].lrm_status == "Offline") {
                numUnknown++;
            } else {
                numDryers++;
                if (machines[i].status == "Available") {
                    numAvailDryers++;
                }
            }
        }
    }

    var toPrint = "In " + roomName + ", " + numAvailDryers + " out of " + numDryers +
                  " drying machines are available.";
    if (numUnknown != 0) {
        toPrint += " Information on " + numUnknown + " drying machines was not available.";
    }
    caller.emit(":tell", toPrint);
}

function availableMachines(data, caller) {
    var room = data.laundry_room;
    var roomName = room.laundry_room_name;
    var machines = room.appliances[0].appliance;
    var numMachines = machines.length;
    var numWashers = 0;
    var numDryers = 0;

    for (var i = 0; i < numMachines; i++) {
        if (machines[i].lrm_status == "Online" &&
            machines[i].out_of_service == "0" &&
            machines[i].status == "Available") {
            if (machines[i].appliance_type == "WASHER") {
                numWashers++;
            } else if (machines[i].appliance_type == "DRYER") {
                numDryers++;
            }
        }
    }

    var toPrint = "In " + roomName + ", There are " + numWashers +
                  " washing machines available and " + numDryers +
                  " drying machines available";
    caller.emit(":tell", toPrint);
}

function availableWashers(data, caller) {
    var room = data.laundry_room;
    var roomName = room.laundry_room_name;
    var machines = room.appliances[0].appliance;
    var numMachines = machines.length;
    var numWashers = 0;

    for (var i = 0; i < numMachines; i++) {
        if (machines[i].lrm_status == "Online" &&
            machines[i].out_of_service == "0" &&
            machines[i].status == "Available") {
            if (machines[i].appliance_type == "WASHER") {
                numWashers++;
            }
        }
    }

    var toPrint = "In " + roomName + ", There are " + numWashers +
                  " washing machines available";
    caller.emit(":tell", toPrint);
}

function availableDryers(data, caller) {
    var room = data.laundry_room;
    var roomName = room.laundry_room_name;
    var machines = room.appliances[0].appliance;
    var numMachines = machines.length;
    var numDryers = 0;

    for (var i = 0; i < numMachines; i++) {
        if (machines[i].lrm_status == "Online" &&
            machines[i].out_of_service == "0" &&
            machines[i].status == "Available") {
            if (machines[i].appliance_type == "DRYER") {
                numDryers++;
            }
        }
    }

    var toPrint = "In " + roomName + ", There are " + numDryers +
                  " drying machines available";
    caller.emit(":tell", toPrint);
}

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