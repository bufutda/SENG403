"use strict";
/* * * * * * * * *
 * Dependencies  *
 * * * * * * * * */
var https = require("https");
var fs = require("fs");
var WebSocketServer = require("ws").Server;
var nodemailer = require("nodemailer");

/* * * * * * * * *
 * Static files  *
 * * * * * * * * */
// required for https-based deployment
global.key = fs.readFileSync("/etc/letsencrypt/live/watz.ky/privkey.pem");
global.cert = fs.readFileSync("/etc/letsencrypt/live/watz.ky/cert.pem");

/* * * * * * * * * * * * *
 * Variable declaration  *
 * * * * * * * * * * * * */
// port for the server
global.port = 6969;

// array of alarm data to return to the client
var alarms = [];

// object of alarm timers counting down
var activeAlarms = {};

// colour index for new connection logging
var ccount = 1;

// timezone of the server
var timezoneOffset = -420;

// time fudge factor
var increaseTime = 0;

// settings
var snoozeTime = 30000;
var displayMode = true;
var emailAddress = null;

// connections
var clients = {
    length: 0
};

// plot data
var visualization = {
    snooze: [0, 0, 0, 0, 0, 0, 0],
    event: [0, 0, 0, 0, 0, 0, 0]
};

/* * * * * * * * * * * * * * * *
 * HTTP Server Initialization  *
 * * * * * * * * * * * * * * * */
console.log("Creating https server");

// create the server
var server = https.createServer({key: global.key, cert: global.cert}, function (request, response) {
    // generate a unique ID for each request
    var REQ_ID = Math.floor(Math.random() * 100000000000);
    REQ_ID = "\x1b[38;5;" + (ccount++ % 200) + "mHTTPS-" + REQ_ID.toString(16) + "\x1b[0m";

    console.log(`${REQ_ID} New request`);

    // set default headers
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Access-Control-Allow-Origin", "https://sa.watz.ky");
    response.setHeader("Server", "node");
    response.setHeader("Status", "200 OK");

    // HTTP request methods
    // the application no communicates via websockets
    // these are only now here for debugging purposes
    switch (request.method) {
        // GET results in a return of every alarm
        case "GET":
            console.log(`${REQ_ID} is a GET`);
            console.log(`${REQ_ID} terminating...`);
            response.end(JSON.stringify(alarms));
            return;
        // POST sets the data
        case "POST":
            console.log(`${REQ_ID} is a POST`);
            var queryData = "";
            request.on("data", function (data) {
                queryData += data;
                // check for POST overflow attack
                if (queryData.length > 1e6) {
                    queryData = "";
                    console.log(`${REQ_ID} Malicious POST, terminating...`);
                    response.writeHead(413, {"Content-Type": "text/plain"});
                    request.connection.destroy();
                }
            });
            request.on("end", function () {
                request.qData = queryData;
                var postedData;
                // check for valid JSON
                try {
                    postedData = JSON.parse(request.qData);
                    console.log(`${REQ_ID} post data: ${JSON.stringify(postedData, null, 4)}`);
                } catch (e) {
                    console.log(`${REQ_ID} post data: ${request.qData}`);
                    console.log(`${REQ_ID} post data is not JSON`);
                    console.error(e);
                    response.writeHead(400, {"Content-Type": "text/plain"});
                    request.connection.destroy();
                    return;
                }

                // check for data consistency
                parsePostData(postedData, REQ_ID, function (valid) {
                    if (valid) {
                        // update the alarm storage
                        console.log(`${REQ_ID} data is valid`);
                        console.log(`${REQ_ID} saving alarms`);
                        alarms = postedData.alarms;
                        console.log(`${REQ_ID} terminating...`);
                        updateAlarms(REQ_ID);
                        response.end(JSON.stringify({error: false, message: null}));
                    } else {
                        // reject the request
                        console.log(`${REQ_ID} bad data, terminating...`);
                        response.writeHead(400, {"Content-Type": "text/plain"});
                        request.connection.destroy();
                        return;
                    }
                });
            });
            break;
        // client has to implement OPTIONS to allow XHR polling
        case "OPTIONS":
            response.setHeader("Access-Control-Allow-Origin", "https://sa.watz.ky");
            response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "accept, content-type");
            response.setHeader("Access-Control-Max-Age", "1728000");
            console.log(`${REQ_ID} ending`);
            response.end();
            return;
        // method not implemented
        default:
            console.log(`${REQ_ID} bad method ${request.method}, terminating...`);
            response.statusCode = 405;
            response.end();
            return;
    }
});

// start the server
server.listen(global.port, function (e) {
    if (e) {
        throw e;
    }
    console.log("Listening on " + global.port);
});

/* * * * * * * * * * * * * * *
 * Websocket Initialization  *
 * * * * * * * * * * * * * * */
console.log("Creating WS server");

// start the socket server ontop of the HTTP server
var wss = new WebSocketServer({server: server});

// fired on every new connection
wss.on("connection", function (ws) {
    // generate ID for connection
    const _CON_ID = Math.floor(Math.random() * 100000000).toString(16);
    const CON_ID = "\x1b[38;5;" + (ccount++ % 200) + "mWS-" + _CON_ID + "\x1b[0m";

    console.log(`${CON_ID} New WSS connection`);
    clients[_CON_ID] = ws;
    clients.length++;

    // convinience function for logging messages
    function send (msg) {
        console.log(`${CON_ID} [OUTGOING] ${msg}`);
        ws.send(msg, function (e) {
            if (e) {
                console.error(`${CON_ID} send error`);
                console.error(e);
            }
        });
    }

    // fired on every new message
    ws.on("message", function (message) {
        console.log(`${CON_ID} [INCOMING] ${message}`);

        // split the message into tokens
        var msg = message.split(" ");
        // the first word
        var command = msg[0];
        msg.splice(0, 1);
        // an array of arguments to the word
        var arg = msg.join(" ");
        switch (command) {
            // request to update the data
            case "POST":
                var data;
                // check for valid JSON
                try {
                    data = JSON.parse(arg);
                } catch (e) {
                    console.log(`${CON_ID} bad json`);
                    send("ERROR 601 Bad JSON");
                    return;
                }
                // validate the JSON content
                parsePostData(data, CON_ID, function (valid) {
                    if (valid) {
                        // update the data
                        console.log(`${CON_ID} data is valid`);
                        console.log(`${CON_ID} saving alarms`);
                        alarms = data.alarms;
                        updateAlarms(CON_ID);
                    } else {
                        // reject the request
                        console.log(`${CON_ID} bad data, terminating...`);
                        send("ERROR 602 Bad Data");
                        return;
                    }
                });
                break;
            // request to update the timezone
            case "TZ":
                updateTimezone(parseInt(arg, 10), CON_ID);
                updateAlarms(CON_ID);
                break;
            // request to change the time fudge factor
            case "INCREASE":
                increaseTime = parseInt(arg, 10);
                updateAlarms(CON_ID);
                break;
            // request to change the snooze setting
            case "SETSNOOZE":
                snoozeTime = parseInt(arg, 10);
                break;
            // request to change the disaply mode
            case "MODE":
                displayMode = arg === "true" ? true : false;
                break;
            // request to snooze an alarm
            case "SNOOZE":
                // update visualization data
                visualization.snooze[getDay()]++;
                console.log(`[Visualization] Snooze++ (${visualization.snooze[getDay()]})`);
                // if the alarm exists
                if (activeAlarms.hasOwnProperty(arg)) {
                    // reset the countdown timer
                    clearTimeout(activeAlarms[arg]);
                    for (var i = 0; i < alarms.length; i++) {
                        if (alarms[i].id === arg) {
                            console.log(`${CON_ID} Snoozing alarm ${arg}`);
                            // update data
                            updateAlarm(CON_ID, alarms[i], snoozeTime);
                            break;
                        }
                    }
                }
                break;
            // set fake visualization data for demonstration
            case "FUDGE":
                visualization = JSON.parse(arg);
                break;
            // request to set the email address
            case "MAIL":
                // check that the supplied address is valid via regular expression
                if (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(arg)) {
                    emailAddress = arg;
                } else {
                    send("ERROR 603 Bad Address");
                }
                break;
            // request to acquire visualization data
            case "VDATA":
                send("VDATA " + JSON.stringify(visualization));
                break;
            // invalid command name
            default:
                console.warn(`${CON_ID} Invalid command: ${command}`);
                send("ERROR 600 Invalid command: " + command);
                return;
        }
    });

    // fired on every connection end
    ws.on("close", function (msg) {
        console.log(`${CON_ID} Closing connection`);
        delete clients[_CON_ID];
        clients.length--;
    });

    // initialization data sent on client connect
    send("ALARM " + JSON.stringify(alarms));
    send("CONF " + JSON.stringify({tz: timezoneOffset, incr: increaseTime, snooze: snoozeTime, mode: displayMode, addr: emailAddress}));
});

/* * * * * * * * * * *
 * Helper Functions  *
 * * * * * * * * * * */

/**
 * Update the timer associated with every stored alarm
 * @param {string} REQ_ID - the formatted request ID associated with this call
 * @returns {undefined}
 */
function updateAlarms (REQ_ID) {
    console.log(`${REQ_ID} updating activeAlarms...`);
    for (var prop in activeAlarms) {
        clearTimeout(activeAlarms[prop]);
        delete activeAlarms[prop];
    }
    console.log(`${REQ_ID} ${alarms.length} to go through`);
    for (var i = 0; i < alarms.length; i++) {
        updateAlarm(REQ_ID, alarms[i]);
    }
}

/**
 * Update the timer associated with one stored timer
 * @param {string} REQ_ID - the formatted request ID associated with this call
 * @param {object} alarm - the alarm to update
 * @param {int} sn - the snooze time
 * @returns {undefined}
 */
function updateAlarm (REQ_ID, alarm, sn) {
    console.log(`${REQ_ID} [ActiveAlarm ${alarm.id}] parsing...`);
    var msleft;

    // compute how long before the alarm will go off in ms
    if (sn) {
        msleft = sn;
    } else {
        // alarm trigger timestamp, represented as milliseconds into the day
        var ams = ((alarm.time.h * 3600) + (alarm.time.m * 60) + alarm.time.s) * 1000;
        // current time (including the tz and fudgeFactor)
        var now = new Date((Date.now() + (timezoneOffset * 60 * 1000)) + increaseTime);
        // current time, represented as milliseconds into the day
        // TZ must be treated as UTC because it has already been accounted for
        // in the computation of now
        var tms = ((now.getUTCHours() * 3600) + (now.getUTCMinutes() * 60) + now.getUTCSeconds()) * 1000;

        if (ams < tms) {
            // tomorrow
            msleft = (86400000 - tms) + ams;
        } else if (ams > tms) {
            // soon
            msleft = ams - tms;
        } else {
            // now
            msleft = 86400000;
            return;
        }
        console.log(`${REQ_ID} [ActiveAlarm ${alarm.id}] ams:${ams} tms:${tms}`);
    }

    // set the timer object of the alarm
    console.log(`${REQ_ID} [ActiveAlarm ${alarm.id}] Creating alarm ${msleft}ms (${ms2hms(msleft)}) from now`);
    // will fire when the alarm is supposed to go off
    activeAlarms[alarm.id] = setTimeout(function (alarm) {
        // check if alarm is a one-time event
        var allFalse = true;
        // loop through every possible repeat day
        for (var prop in alarm.repeat) {
            if (alarm.repeat[prop]) {
                allFalse = false;
            }
        }
        // if the alarm is supposed to repeat today, is never supposed to repeat, or is currently being snoozed
        if (alarm.repeat[getDay()] || allFalse || sn) {
            // update the visualization data if this is not a snooze
            if (!sn) {
                visualization.event[getDay()]++;
                console.log(`[Visualization] Event++ (${visualization.event[getDay()]})`);
            }
            // if no clients are connected via websocket, try to send an email reminder
            if (clients.length !== 0) {
                console.log(`AL-${alarm.id} [RingHandler] ${clients.length} client(s) still connected`);
            } else {
                // no clients are connected, send an email if possible
                console.log(`AL-${alarm.id} [RingHandler] Nobody here. Attempting to send email`);
                // if the user has an email address set
                if (emailAddress) {
                    console.log(`AL-${alarm.id} [RingHandler] Email sending to ${emailAddress}`);
                    // prepare the mail headers
                    var mailoptions = {
                        from: "'Alarm' <alarm@watz.ky>",
                        to: emailAddress,
                        subject: "Alarm " + alarm.id + " went off",
                        text: "Your alarm set for " + alarm.time.h + ":" + alarm.time.m + ":" + alarm.time.s + " went off." + (alarm.label.length ? "\"" + alarm.label + "\"" : "") + "\nhttps://sa.watz.ky/alarmclock",
                        html: "<br><strong>Your alarm set for " + alarm.time.h + ":" + alarm.time.m + ":" + alarm.time.s + " went off." + (alarm.label.length ? "\"" + alarm.label + "\"" : "") + "</strong>\n<a href='https://sa.watz.ky/alarmclock'>https://sa.watz.ky/alarmclock</a><br>"
                    };
                    // send the email
                    transporter.sendMail(mailoptions, function (error, info) {
                        // check if the email could not send
                        if (error) {
                            console.error(`AL-${alarm.id} [RingHandler] Error sending mail`);
                            console.error(error);
                            return;
                        }
                        // check whether or not to remove the alarm
                        console.log(`AL-${alarm.id} [RingHandler] Message ${info.messageId} sent: ${info.response}`);
                        if (allFalse) {
                            // the alarm will never fire again, remove it from storage
                            for (var i = 0; i < alarms.length; i++) {
                                if (alarms[i].id === alarm.id) {
                                    console.log(`${alarms[i].id} Deleting Alarm`);
                                    alarms.splice(i, 1);
                                }
                                break;
                            }
                        }
                    });
                } else {
                    console.log(`AL-${alarm.id} [RingHandler] Cannot send email - none available`);
                }
            }
        }
    }, msleft, alarm);
}

/**
 * Function to convert milliseconds to a string of hours, minutes, and seconds
 * @param {int} ms - the milliseconds to convert
 * @returns {string} the representation of ms in hours, minutes, and seconds
 */
function ms2hms (ms) {
    // use successive division and modulous to get hours, minutes, and seconds
    ms = Math.floor(ms / 1000);
    var h = Math.floor(ms / 3600);
    ms %= 3600;
    var m = Math.floor(ms / 60);
    ms %= 60;
    var s = ms;
    return h + ";" + m + ";" + s;
}

/**
 * Check whether or not the supplied object has all the required properties and
 * types to contain alarm data
 * @param {JSONObject} postedData - the object to parse
 * @param {string} ID - the request ID associated with this request
 * @param {callback} clbk - the callback-return
 * @returns {undefined}
 */
function parsePostData (postedData, ID, clbk) {
    // assume the object is correct
    var valid = true;
    // check that the supplied JSON is an object
    if (typeof postedData === "object") {
        console.log(`${ID} checking for extraneous settings`);
        // check for any other properties in the object that indicate new settings
        for (var prop in postedData) {
            switch (prop) {
                case "alarms":
                    break;
                case "tz":
                    console.log(`${ID} timezone change detected`);
                    updateTimezone(postedData.tz, ID);
                    break;
                default:
                    console.log(`${ID} unknown setting: ${prop}`);
            }
        }
        console.log(`${ID} validating alarms...`);
        // check for a root property called alarms with an array value
        if (!postedData.hasOwnProperty("alarms") || !(postedData.alarms instanceof Array)) {
            valid = false;
        } else {
            // loop through each alarm element and check for valid alarm data
            for (var i = 0; i < postedData.alarms.length && valid; i++) {
                // assume that no correct data has been supplied
                var time = false;
                var repeatO = false;
                var repeat = {
                    0: false,
                    1: false,
                    2: false,
                    3: false,
                    4: false,
                    5: false,
                    6: false
                };
                var audioPath = false;
                var id = false;
                var label = false;

                // check that the alarm element is an object
                if (typeof postedData.alarms[i] === "object") {
                    // loop through and check each porperty of the oject
                    for (var p in postedData.alarms[i]) {
                        if (!valid) {
                            break;
                        }
                        // check property values by name
                        switch (p) {
                            case "time":
                                // check that this is the first instance of time, and that it is an object
                                if (time) {
                                    valid = false;
                                } else if (typeof postedData.alarms[i].time === "object") {
                                    // check that time has an hour, minute, and second field and that it contains a number
                                    if (postedData.alarms[i].time.hasOwnProperty("h") && typeof postedData.alarms[i].time.h === "number" &&
                                        postedData.alarms[i].time.hasOwnProperty("m") && typeof postedData.alarms[i].time.m === "number" &&
                                        postedData.alarms[i].time.hasOwnProperty("s") && typeof postedData.alarms[i].time.h === "number") {
                                        time = true;
                                    } else {
                                        valid = false;
                                    }
                                } else {
                                    valid = false;
                                }
                                break;
                            case "audioPath":
                                // check that this is the first instance of audioPath and that it is a string
                                if (audioPath) {
                                    valid = false;
                                } else if (typeof postedData.alarms[i].audioPath === "string") {
                                    audioPath = true;
                                } else {
                                    valid = false;
                                }
                                break;
                            case "repeat":
                                // check that this is the first instance of repeat and that it is an object
                                if (repeatO) {
                                    valid = false;
                                } else if (typeof postedData.alarms[i].repeat === "object") {
                                    var repeatV = true;
                                    // check that repeat is a 7-element array with each member being a boolean
                                    for (var j = 0; j < 7; j++) {
                                        if (postedData.alarms[i].repeat.hasOwnProperty(j) && typeof postedData.alarms[i].repeat[j] === "boolean") {
                                            repeat[j] = true;
                                        } else {
                                            repeatV = false;
                                            break;
                                        }
                                    }
                                    if (!repeatV) {
                                        valid = false;
                                    } else {
                                        repeatO = true;
                                    }
                                } else {
                                    valid = false;
                                }
                                break;
                            case "id":
                                // check that this is the first instance of id and that it is a string
                                if (id) {
                                    valid = false;
                                } else if (typeof postedData.alarms[i].id === "string") {
                                    id = true;
                                } else {
                                    valid = false;
                                }
                                break;
                            case "label":
                                // check that this is the first instance of label and that it is a string
                                if (typeof postedData.alarms[i].id === "string") {
                                    label = true;
                                }
                                break;
                                // check for extraneous properties
                            default:
                                valid = false;
                                break;
                        }
                    }
                } else {
                    valid = false;
                }
                // if any data was missing, reject the request
                if (valid && (!time || !repeatO || !audioPath || !id || !label)) {
                    valid = false;
                }
                console.log(`${ID} validation at ${i}:`, valid, time, repeatO, audioPath, id, label);
            }
        }
        clbk(valid);
        return;
    }
    clbk(false);
    return;
}

/**
 * Update the timezone associated with the alarms
 * @param {int} tzo - the new timezone offset to set
 * @param {string} ID - the formatted ID string associated with this request
 * @returns {undefined}
 */
function updateTimezone (tzo, ID) {
    timezoneOffset = tzo;
}

/**
 * Acquire the current day
 * @returns {int} the current day, taking fudgefactor and timezone offset into account
 */
function getDay () {
    return new Date((Date.now() + (timezoneOffset * 60 * 1000)) + increaseTime).getUTCDay();
}

/* * * * * * * * * * * * *
 * Email initialization  *
 * * * * * * * * * * * * */
console.log("Setting up Email");

// set up the email account for outgoing messages
var transporter = nodemailer.createTransport({
    service: "Zoho",
    auth: {
        user: "alarm@watz.ky",
        pass: fs.readFileSync("/etc/apache2/ssl/clock.pwd").toString()
    }
});
