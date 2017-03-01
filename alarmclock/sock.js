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
