// This file contains information concerning the connection and communication
// logic between the client and server
(function () {
    "use strict";
    // if this is the first file to define window.g, do so
    // otherwise, add to other files
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    // window.g.sock will hold all methods and variables concerning the socket
    window.g.sock = {};

    // if the socket has been initialized
    window.g.sock.init = false;

    /**
     * Initialize the socket
     * @returns {undefined}
     */
    window.g.sock.init = function () {
        // create the socket
        window.g.sock.ws = new WebSocket("wss://sa.watz.ky:6969");

        // fires when the socket is opened
        window.g.sock.ws.addEventListener("open", function () {
            console.log("[WS] Opened");
            window.g.sock.init = true;
        });

        // fires whenever a message is received from the server
        window.g.sock.ws.addEventListener("message", function (message) {
            console.log("[WS] [INCOMING] " + message.data);
            // split the message into tokens
            var msg = message.data.split(" ");
            // isolate the command string
            var command = msg[0];
            msg.splice(0, 1);
            switch (command) {
                // the server is providing alarm data to include
                case "ALARM":
                    // re-formate the json string and parse it
                    var json = msg.join(" ");
                    var data;
                    try {
                        data = JSON.parse(json);
                    } catch (e) {
                        console.error(e);
                        return;
                    }
                    console.log("Data was", data);
                    // for each alarm element, parse it into an Alarm object
                    for (var i = 0; i < data.length; i++) {
                        // create the alarm in the list
                        var alarmElem = document.createElement("div");
                        alarmElem.classList.add("alarmListElement");
                        document.getElementById("alarmList").appendChild(alarmElem);
                        // create and add an Alarm object for use by the alarm logic
                        window.g.alarms.push(new window.g.Alarm({
                            h: data[i].time.h >= 12 ? data[i].time.h - 12 : data[i].time.h,
                            m: data[i].time.m,
                            s: data[i].time.s,
                            n: data[i].time.h >= 12
                        }, {
                            enable: data[i].repeat["0"] || data[i].repeat["1"] || data[i].repeat["2"] ||
                                data[i].repeat["3"] || data[i].repeat["4"] || data[i].repeat["5"] ||
                                data[i].repeat["6"],
                            days: {
                                sun: data[i].repeat["0"],
                                mon: data[i].repeat["1"],
                                tue: data[i].repeat["2"],
                                wed: data[i].repeat["3"],
                                thu: data[i].repeat["4"],
                                fri: data[i].repeat["5"],
                                sat: data[i].repeat["6"]
                            }
                        }, document.querySelector("#musicSelect select").value, alarmElem, window.g.alarms.length, data[i].id, data[i].label));
                    }
                    break;
                // the server is providing configuration data
                case "CONF":
                    // re-format and parse the json string
                    var d = JSON.parse(msg.join(" "));

                    // save settings
                    window.g.timezone = d.tz;
                    window.g.increaseTime = d.incr;
                    window.g.snoozeAmount = d.snooze;
                    window.g.displayMode = d.mode;

                    // apply settings
                    if (!window.g.displayMode) {
                        window.g.changeSetting("displayMode", true);
                    }
                    document.querySelector("#timezoneSettingW select").value = window.g.timezone.toString();
                    document.querySelector("#snoozeSettingW select").value = window.g.snoozeAmount.toString();
                    document.getElementById("textInput_email").value = d.addr;
                    break;
                case "ERROR":
                    // The server is emitting an error
                    console.error("[WS] ERROR: " + msg.join(" "));
                    if (msg[0] === "603") {
                        // show the user that the email was invalid
                        document.getElementById("textInput_email").style.background = "#5b1c1c";
                    }
                    break;
                // the server is providing data to inject into the visualizer
                case "VDATA":
                    // re-formate and parse the json string
                    var d = JSON.parse(msg.join(" "));
                    console.log("Drawing charts...");
                    /* eslint-disable quote-props */
                    // create the snooze chart
                    AmCharts.makeChart("visualizationChart1", {
                        "type": "serial",
                        "categoryField": "weekday",
                        "autoMarginOffset": 40,
                        "marginRight": 60,
                        "marginTop": 60,
                        "plotAreaBorderColor": "#1A1A1A",
                        "plotAreaFillColors": "#606060",
                        "startDuration": 1,
                        "accessibleTitle": "Alarm Visualization",
                        "backgroundColor": "#1A1A1A",
                        "borderColor": "#1A1A1A",
                        "color": "#606060",
                        "fontFamily": "",
                        "fontSize": 13,
                        "handDrawScatter": 4,
                        "theme": "dark",
                        "categoryAxis": {
                            "gridPosition": "start",
                            "title": "Weekday"
                        },
                        "trendLines": [],
                        "graphs": [
                            {
                                "balloonText": "[[category]]: [[value]] Snoozes",
                                "bullet": "round",
                                "bulletSize": 10,
                                "id": "AmGraph-1",
                                "lineAlpha": 1,
                                "lineThickness": 3,
                                "title": "visualization-snooze",
                                "type": "smoothedLine",
                                "valueField": "snoozes"
                            }
                        ],
                        "guides": [],
                        "valueAxes": [
                            {
                                "id": "ValueAxis-1",
                                "title": "Snoozes",
                                "baseValue": -1,
                                "minimum": -1,
                                "showFirstLabel": false,
                                "integersOnly": true
                            }
                        ],
                        "allLabels": [],
                        "balloon": {
                            "showBullet": true
                        },
                        "titles": [
                            {
                                "id": "Title-1",
                                "size": 15,
                                "text": "Snooze Events"
                            }
                        ],
                        "dataProvider": [
                            {
                                "weekday": "Sunday",
                                "snoozes": d.snooze[0]
                            },
                            {
                                "weekday": "Monday",
                                "snoozes": d.snooze[1]
                            },
                            {
                                "weekday": "Tuesday",
                                "snoozes": d.snooze[2]
                            },
                            {
                                "weekday": "Wednesday",
                                "snoozes": d.snooze[3]
                            },
                            {
                                "weekday": "Thursday",
                                "snoozes": d.snooze[4]
                            },
                            {
                                "weekday": "Friday",
                                "snoozes": d.snooze[5]
                            },
                            {
                                "weekday": "Saturday",
                                "snoozes": d.snooze[6]
                            }
                        ]
                    });
                    // create the alarm chart
                    AmCharts.makeChart("visualizationChart2", {
                        "type": "serial",
                        "categoryField": "weekday",
                        "autoMarginOffset": 40,
                        "marginRight": 60,
                        "marginTop": 60,
                        "plotAreaBorderColor": "#1A1A1A",
                        "plotAreaFillColors": "#606060",
                        "startDuration": 1,
                        "accessibleTitle": "Alarm Visualization",
                        "backgroundColor": "#1A1A1A",
                        "borderColor": "#1A1A1A",
                        "color": "#606060",
                        "fontFamily": "",
                        "fontSize": 13,
                        "handDrawScatter": 4,
                        "theme": "dark",
                        "categoryAxis": {
                            "gridPosition": "start",
                            "title": "Weekday"
                        },
                        "trendLines": [],
                        "graphs": [
                            {
                                "balloonText": "[[category]]: [[value]] Alarms",
                                "bullet": "round",
                                "bulletSize": 10,
                                "id": "AmGraph-1",
                                "lineAlpha": 1,
                                "lineThickness": 3,
                                "title": "visualization-alarm",
                                "type": "smoothedLine",
                                "valueField": "alarms"
                            }
                        ],
                        "guides": [],
                        "valueAxes": [
                            {
                                "id": "ValueAxis-1",
                                "title": "Alarms",
                                "baseValue": -1,
                                "minimum": -1,
                                "showFirstLabel": false,
                                "integersOnly": true
                            }
                        ],
                        "allLabels": [],
                        "balloon": {
                            "showBullet": true
                        },
                        "titles": [
                            {
                                "id": "Title-1",
                                "size": 15,
                                "text": "Alarm Events"
                            }
                        ],
                        "dataProvider": [
                            {
                                "weekday": "Sunday",
                                "alarms": d.event[0]
                            },
                            {
                                "weekday": "Monday",
                                "alarms": d.event[1]
                            },
                            {
                                "weekday": "Tuesday",
                                "alarms": d.event[2]
                            },
                            {
                                "weekday": "Wednesday",
                                "alarms": d.event[3]
                            },
                            {
                                "weekday": "Thursday",
                                "alarms": d.event[4]
                            },
                            {
                                "weekday": "Friday",
                                "alarms": d.event[5]
                            },
                            {
                                "weekday": "Saturday",
                                "alarms": d.event[6]
                            }
                        ]
                    });
                    /* eslint-enable quote-props */
                    break;
                default:
                    console.error("Unknown command: " + command);
            }
        });

        // fires when the connection to the server is lost
        window.g.sock.ws.addEventListener("close", function () {
            console.error("[WS] Connection closed");
            document.getElementById("site").style.background = "#5b1c1c";
        });

        /**
         * Function to determine if the socket is ready for messages
         * @returns {bool} true if the socket is ready
         */
        window.g.sock.isOpen = function () {
            return window.g.sock.init && window.g.sock.ws.readyState === window.g.sock.ws.OPEN;
        };

        /**
         * Function to send a message to the server via socket
         * @param {string} msg - the message to send
         * @returns {undefined}
         */
        window.g.sock.send = function (msg) {
            console.log("[WS] [OUTGOING] " + msg);
            window.g.sock.ws.send(msg, function (e) {
                if (e) {
                    console.error("[WS] Send error");
                    console.error(e);
                }
            });
        };
    };
})();
