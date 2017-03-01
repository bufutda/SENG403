"use strict";
var https = require("https");
var fs = require("fs");
var WebSocketServer = require("ws").Server;
var nodemailer = require("nodemailer");

global.key = fs.readFileSync("/etc/apache2/ssl/watz_d.key");
global.cert = fs.readFileSync("/etc/apache2/ssl/watz.crt");
global.port = 6969;
var alarms = [];
var activeAlarms = {};
var ccount = 1;
var timezoneOffset = -420;
var increaseTime = 0;
var snoozeTime = 30000;
var displayMode = true;
var emailAddress = null;
var clients = {
    length: 0
};
console.log("Creating https server");
var server = https.createServer({key: global.key, cert: global.cert}, function (request, response) {
    var REQ_ID = Math.floor(Math.random() * 100000000000);
    REQ_ID = "\x1b[38;5;" + (ccount++ % 200) + "mHTTPS-" + REQ_ID.toString(16) + "\x1b[0m";
    console.log(`${REQ_ID} New request`);

    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Access-Control-Allow-Origin", "https://sa.watz.ky");
    response.setHeader("Server", "node");
    response.setHeader("Status", "200 OK");

    switch (request.method) {
        case "GET":
            console.log(`${REQ_ID} is a GET`);
            console.log(`${REQ_ID} terminating...`);
            response.end(JSON.stringify(alarms));
            return;
        case "POST":
            console.log(`${REQ_ID} is a POST`);
            var queryData = "";
            request.on("data", function (data) {
                queryData += data;
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
                parsePostData(postedData, REQ_ID, function (valid) {
                    if (valid) {
                        console.log(`${REQ_ID} data is valid`);
                        console.log(`${REQ_ID} saving alarms`);
                        alarms = postedData.alarms;
                        console.log(`${REQ_ID} terminating...`);
                        updateAlarms(REQ_ID);
                        response.end(JSON.stringify({error: false, message: null}));
                    } else {
                        console.log(`${REQ_ID} bad data, terminating...`);
                        response.writeHead(400, {"Content-Type": "text/plain"});
                        request.connection.destroy();
                        return;
                    }
                });
            });
            break;
        case "OPTIONS":
            response.setHeader("Access-Control-Allow-Origin", "https://sa.watz.ky");
            response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "accept, content-type");
            response.setHeader("Access-Control-Max-Age", "1728000");
            console.log(`${REQ_ID} ending`);
            response.end();
            return;
        default:
            console.log(`${REQ_ID} bad method ${request.method}, terminating...`);
            response.statusCode = 405;
            response.end();
            return;
    }
});
server.listen(global.port, function (e) {
    if (e) {
        throw e;
    }
    console.log("Listening on " + global.port);
});

console.log("Creating WS server");
var wss = new WebSocketServer({server: server});
wss.on("connection", function (ws) {
    const _CON_ID = Math.floor(Math.random() * 100000000).toString(16);
    const CON_ID = "\x1b[38;5;" + (ccount++ % 200) + "mWS-" + _CON_ID + "\x1b[0m";
    console.log(`${CON_ID} New WSS connection`);
    clients[_CON_ID] = ws;
    clients.length++;
    function send (msg) {
        console.log(`${CON_ID} [OUTGOING] ${msg}`);
        ws.send(msg, function (e) {
            if (e) {
                console.error(`${CON_ID} send error`);
                console.error(e);
            }
        });
    }
    ws.on("message", function (message) {
        console.log(`${CON_ID} [INCOMING] ${message}`);
        var msg = message.split(" ");
        var command = msg[0];
        msg.splice(0, 1);
        var arg = msg.join(" ");
        switch (command) {
            case "POST":
                var data;
                try {
                    data = JSON.parse(arg);
                } catch (e) {
                    console.log(`${CON_ID} bad json`);
                    send("ERROR 601 Bad JSON");
                    return;
                }
                parsePostData(data, CON_ID, function (valid) {
                    if (valid) {
                        console.log(`${CON_ID} data is valid`);
                        console.log(`${CON_ID} saving alarms`);
                        alarms = data.alarms;
                        updateAlarms(CON_ID);
                    } else {
                        console.log(`${CON_ID} bad data, terminating...`);
                        send("ERROR 602 Bad Data");
                        return;
                    }
                });
                break;
            case "TZ":
                updateTimezone(parseInt(arg, 10), CON_ID);
                updateAlarms(CON_ID);
                break;
            case "INCREASE":
                increaseTime = parseInt(arg, 10);
                updateAlarms(CON_ID);
                break;
            case "SETSNOOZE":
                snoozeTime = parseInt(arg, 10);
                break;
            case "MODE":
                displayMode = arg === "true" ? true : false;
                break;
            case "SNOOZE":
                if (activeAlarms.hasOwnProperty(arg)) {
                    clearTimeout(activeAlarms[arg]);
                    for (var i = 0; i < alarms.length; i++) {
                        if (alarms[i].id === arg) {
                            console.log(`${CON_ID} Snoozing alarm ${arg}`);
                            updateAlarm(CON_ID, alarms[i], snoozeTime);
                            break;
                        }
                    }
                }
                break;
            case "MAIL":
                if (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(arg)) {
                    emailAddress = arg;
                } else {
                    send("ERROR 603 Bad Address");
                }
                break;
            default:
                console.warn(`${CON_ID} Invalid command: ${command}`);
                send("ERROR 600 Invalid command: " + command);
                return;
        }
    });
    ws.on("close", function (msg) {
        console.log(`${CON_ID} Closing connection`);
        delete clients[_CON_ID];
        clients.length--;
    });
    send("ALARM " + JSON.stringify(alarms));
    send("CONF " + JSON.stringify({tz: timezoneOffset, incr: increaseTime, snooze: snoozeTime, mode: displayMode, addr: emailAddress}));
});

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

function updateAlarm (REQ_ID, alarm, sn) {
    console.log(`${REQ_ID} [ActiveAlarm ${alarm.id}] parsing...`);
    var msleft;
    if (sn) {
        msleft = sn;
    } else {
        var ams = ((alarm.time.h * 3600) + (alarm.time.m * 60) + alarm.time.s) * 1000;
        var now = new Date((Date.now() + (timezoneOffset * 60 * 1000)) + increaseTime);
        var tms = ((now.getUTCHours() * 3600) + (now.getUTCMinutes() * 60) + now.getUTCSeconds()) * 1000;

        if (ams < tms) {
            // tomorrow
            msleft = (86400000 - tms) + ams;
        } else if (ams > tms) {
            // soon
            var msleft = ams - tms;
        } else {
            // now...?
            console.log(`${REQ_ID} [ActiveAlarm ${alarm.id}] already happened, aborting`);
            return;
        }
        console.log(`${REQ_ID} [ActiveAlarm ${alarm.id}] ams:${ams} tms:${tms}`);
    }
    console.log(`${REQ_ID} [ActiveAlarm ${alarm.id}] Creating alarm ${msleft}ms (${ms2hms(msleft)}) from now`);
    activeAlarms[alarm.id] = setTimeout(function (alarm) {
        if (clients.length !== 0) {
            console.log(`AL-${alarm.id} [RingHandler] ${clients.length} client(s) still connected`);
        } else {
            console.log(`AL-${alarm.id} [RingHandler] Nobody here. Attempting to send email`);
            if (emailAddress) {
                console.log(`AL-${alarm.id} [RingHandler] Email sending to ${emailAddress}`);
                var mailoptions = {
                    from: "'Alarm' <alarm@watz.ky>",
                    to: emailAddress,
                    subject: "Alarm " + alarm.id + " went off",
                    text: "Your alarm set for " + alarm.time.h + ":" + alarm.time.m + ":" + alarm.time.s + " went off.\nhttps://sa.watz.ky/alarmclock",
                    html: "<br><strong>Your alarm set for " + alarm.time.h + ":" + alarm.time.m + ":" + alarm.time.s + " went off.</strong>\n<a href='https://sa.watz.ky/alarmclock'>https://sa.watz.ky/alarmclock</a><br>"
                };
                transporter.sendMail(mailoptions, function (error, info) {
                    if (error) {
                        console.error(`AL-${alarm.id} [RingHandler] Error sending mail`);
                        console.error(error);
                        return;
                    }
                    console.log(`AL-${alarm.id} [RingHandler] Message ${info.messageId} sent: ${info.response}`);
                });
            } else {
                console.log(`AL-${alarm.id} [RingHandler] Cannot send email - none available`);
            }
        }
    }, msleft + 2000, alarm);
}

function ms2hms (ms) {
    ms = Math.floor(ms / 1000);
    var h = Math.floor(ms / 3600);
    ms %= 3600;
    var m = Math.floor(ms / 60);
    ms %= 60;
    var s = ms;
    return h + ";" + m + ";" + s;
}

function parsePostData (postedData, ID, clbk) {
    var valid = true;
    if (typeof postedData === "object") {
        console.log(`${ID} checking for extraneous settings`);
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
        if (!postedData.hasOwnProperty("alarms") || !(postedData.alarms instanceof Array)) {
            valid = false;
        } else {
            for (var i = 0; i < postedData.alarms.length && valid; i++) {
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
                if (typeof postedData.alarms[i] === "object") {
                    for (var p in postedData.alarms[i]) {
                        if (!valid) {
                            break;
                        }
                        switch (p) {
                            case "time":
                                if (time) {
                                    valid = false;
                                } else if (typeof postedData.alarms[i].time === "object") {
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
                                if (audioPath) {
                                    valid = false;
                                } else if (typeof postedData.alarms[i].audioPath === "string") {
                                    audioPath = true;
                                } else {
                                    valid = false;
                                }
                                break;
                            case "repeat":
                                if (repeatO) {
                                    valid = false;
                                } else if (typeof postedData.alarms[i].repeat === "object") {
                                    var repeatV = true;
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
                                if (id) {
                                    valid = false;
                                } else if (typeof postedData.alarms[i].id === "string") {
                                    id = true;
                                } else {
                                    valid = false;
                                }
                                break;
                            default:
                                valid = false;
                                break;
                        }
                    }
                } else {
                    valid = false;
                }
                if (valid && (!time || !repeatO || !audioPath || !id)) {
                    valid = false;
                }
                console.log(`${ID} validation at ${i}:`, valid, time, repeatO, audioPath, id);
            }
        }
        clbk(valid);
        return;
    }
    clbk(false);
    return;
}

function updateTimezone (tzo, ID) {
    timezoneOffset = tzo;
}

console.log("Setting up Email");
var transporter = nodemailer.createTransport({
    service: "Zoho",
    auth: {
        user: "alarm@watz.ky",
        pass: fs.readFileSync("/etc/apache2/ssl/clock.pwd").toString()
    }
});
