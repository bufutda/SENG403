(function () {
    "use strict";
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }
    window.g.sock = {};
    window.g.sock.init = false;
    window.g.sock.init = function () {
        window.g.sock.ws = new WebSocket("wss://sa.watz.ky:6969");
        window.g.sock.ws.addEventListener("open", function () {
            console.log("[WS] Opened");
            window.g.sock.init = true;
        });
        window.g.sock.ws.addEventListener("message", function (message) {
            console.log("[WS] [INCOMING] " + message.data);
            var msg = message.data.split(" ");
            var command = msg[0];
            msg.splice(0, 1);
            switch (command) {
                case "ALARM":
                    var json = msg.join(" ");
                    var data;
                    try {
                        data = JSON.parse(json);
                    } catch (e) {
                        console.error(e);
                        return;
                    }
                    console.log("Data was", data);
                    for (var i = 0; i < data.length; i++) {
                        var alarmElem = document.createElement("div");
                        alarmElem.classList.add("alarmListElement");
                        document.getElementById("alarmList").appendChild(alarmElem);
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
                        }, document.querySelector("#musicSelect select").value, alarmElem, window.g.alarms.length, data[i].id));
                    }
                    break;
                case "CONF":
                    var d = JSON.parse(msg.join(" "));
                    window.g.timezone = d.tz;
                    window.g.increaseTime = d.incr;
                    window.g.snoozeAmount = d.snooze;
                    window.g.displayMode = d.mode;
                    if (!window.g.displayMode) {
                        window.g.changeSetting("displayMode", true);
                    }
                    document.querySelector("#timezoneSettingW select").value = window.g.timezone.toString();
                    document.querySelector("#snoozeSettingW select").value = window.g.snoozeAmount.toString();
                    document.getElementById("textInput_email").value = d.addr;
                    break;
                case "ERROR":
                    console.error("[WS] ERROR: " + msg.join(" "));
                    if (msg[0] === "603") {
                        document.getElementById("textInput_email").style.background = "#5b1c1c";
                    }
                    break;
                case "VDATA":
                    var d = JSON.parse(msg.join(" "));
                    console.log("Drawing charts...");
                    /* eslint-disable quote-props */
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
        window.g.sock.ws.addEventListener("close", function () {
            console.error("[WS] Connection closed");
            document.getElementById("site").style.background = "#5b1c1c";
        });
        window.g.sock.isOpen = function () {
            return window.g.sock.init && window.g.sock.ws.readyState === window.g.sock.ws.OPEN;
        };
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
