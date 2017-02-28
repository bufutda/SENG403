"use strict";
var https = require("https");
var fs = require("fs");

global.key = fs.readFileSync("/etc/apache2/ssl/watz_d.key");
global.cert = fs.readFileSync("/etc/apache2/ssl/watz.crt");
global.port = 6969;
var alarms = [];

console.log("Creating server...");
var server = https.createServer({key: global.key, cert: global.cert}, function (request, response) {
    var REQ_ID = new Date().getTime();
    REQ_ID = "\x1b[38;5;" + (REQ_ID % 200) + "m" + REQ_ID.toString(16) + "\x1b[0m";
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
                var valid = true;
                if (typeof postedData === "object") {
                    console.log(`${REQ_ID} checking for extraneous settings`);
                    for (var prop in postedData) {
                        switch (prop) {
                            case "alarms":
                                break;
                            case "tz":
                                console.log(`${REQ_ID} timezone change detected`);
                                console.log(`${REQ_ID} TODO: change timezone`);
                                break;
                            default:
                                console.log(`${REQ_ID} unknown setting: ${prop}`);
                        }
                    }
                    console.log(`${REQ_ID} validating alarms...`);
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
                                        default:
                                            valid = false;
                                            break;
                                    }
                                }
                            } else {
                                valid = false;
                            }
                            if (valid && (!time || !repeatO || !audioPath)) {
                                valid = false;
                            }
                            console.log(`${REQ_ID} validation at ${i}:`, valid, time, repeatO, audioPath);
                        }
                    }
                    if (valid) {
                        console.log(`${REQ_ID} data is valid`);
                        console.log(`${REQ_ID} terminating...`);
                        response.end(JSON.stringify({error: false, message: null}));
                    } else {
                        console.log(`${REQ_ID} bad data, terminating...`);
                        response.writeHead(400, {"Content-Type": "text/plain"});
                        request.connection.destroy();
                        return;
                    }
                    return;
                }
                console.log(`${REQ_ID} bad data, terminating...`);
                response.writeHead(400, {"Content-Type": "text/plain"});
                request.connection.destroy();
                return;
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
