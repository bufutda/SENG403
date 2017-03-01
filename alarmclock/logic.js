(function () {
    "use strict";
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }
    window.g.displayMode = null;
    window.g.displayLatch = null;
    window.g.secondReachAroundLatch = false;
    window.g.minuteReachAroundLatch = false;
    window.g.hourReachAroundLatch = false;
    window.g.settingsVisible = false;
    window.g.settingsLock = false;
    window.g.createAlarmLock = false;
    window.g.dialogLock = false;
    window.g.dialogProgressLock = false;
    window.g.alarms = [];
    window.g.goingOff = false;
    window.g.alarmRingCount = 0;
    window.g.snoozeAmount = 30000;
    window.g.increaseTime = 0;
    window.g.timezone = -1 * (new Date().getTimezoneOffset());
    window.g.editing = false;
    window.g.editIndex = null;
    window.g.visualizationLock = false;
    window.g.visualizationTransitionLock = false;

    window.g.cronTimer = {
        tmr: NaN,
        secondLatch: false,
        minuteLatch: -1,
        listeners: {},
        start: function () {
            if (isNaN(window.g.cronTimer.tmr)) {
                window.g.cronTimer.tmr = setInterval(window.g.cronTimer.secondHandler, 100);
            } else {
                console.warn("CRON already started.");
            }
        },
        stop: function () {
            if (isNaN(window.g.cronTimer.tmr)) {
                console.warn("CRON already stopped.");
            } else {
                clearInterval(window.g.cronTimer.tmr);
                window.g.cronTimer.tmr = NaN;
            }
        },
        secondHandler: function () {
            var time = window.g.cronTimer.getTime();
            var clockTime = {
                s: time.getUTCSeconds(),
                m: time.getUTCMinutes(),
                h: window.g.c24212(time.getUTCHours()).h,
                t: time.getUTCHours(),
                n: window.g.c24212(time.getUTCHours()).n,
                d: time.getUTCDay()
            };
            window.g.cronTimer.emit("tick", clockTime);
            window.g.updateBigClock(clockTime);
            if (time.getUTCSeconds() < 30 && !window.g.cronTimer.secondLatch) {
                window.g.cronTimer.emit("half");
                window.g.cronTimer.emit("minute", clockTime);
                window.g.cronTimer.secondLatch = true;
            }
            if (time.getUTCSeconds() >= 30 && window.g.cronTimer.secondLatch) {
                window.g.cronTimer.emit("half");
                window.g.cronTimer.secondLatch = false;
            }
            if (time.getUTCMinutes() !== window.g.cronTimer.minuteLatch) {
                window.g.cronTimer.minuteLatch = time.getUTCMinutes();
                if (window.g.cronTimer.minuteLatch % 10 === 0) {
                    window.g.cronTimer.emit("ten", clockTime);
                }
                if (window.g.cronTimer.minuteLatch % 30 === 0) {
                    window.g.cronTimer.emit("thirty", clockTime);
                }
                if (window.g.cronTimer.minuteLatch === 0) {
                    window.g.cronTimer.emit("hour", clockTime);
                }
            }
        },
        on: function (event, handler) {
            console.info("New listener on " + event, window.g.cronTimer.listeners.hasOwnProperty(event) ? window.g.cronTimer.listeners[event].length : 0);
            if (!window.g.cronTimer.listeners.hasOwnProperty(event)) {
                window.g.cronTimer.listeners[event] = [];
            }
            window.g.cronTimer.listeners[event].push(handler);
            var time = window.g.cronTimer.getTime();
            window.g.cronTimer.emit(event, {
                s: time.getUTCSeconds(),
                m: time.getUTCMinutes(),
                h: time.getUTCHours() % 12,
                t: time.getUTCHours(),
                n: time.getUTCHours() > 12,
                d: time.getUTCDay()
            });
        },
        off: function (event, handler) {
            console.info("Removed listener on " + event);
            if (window.g.cronTimer.listeners.hasOwnProperty(event)) {
                var i = window.g.cronTimer.listeners[event].indexOf(handler);
                if (i > -1) {
                    window.g.cronTimer.listeners[event].splice(i, 1);
                } else {
                    console.warn("Cannot remove listener. Handler is not registered.", handler);
                }
            } else {
                console.warn("Cannot remove listener for non-existant event:", event);
            }
        },
        emit: function (event, arg) {
            if (event !== "tick") {
                console.info("[E] " + event);
            }
            if (!(arg instanceof Array)) {
                arg = [arg];
            }
            if (window.g.cronTimer.listeners.hasOwnProperty(event)) {
                for (var i = 0; i < window.g.cronTimer.listeners[event].length; i++) {
                    window.g.cronTimer.listeners[event][i].apply(window, arg);
                }
            } else {
                // console.warn("No listeners on emitted event:", event);
            }
        },
        getTime: function () {
            return new Date((Date.now() + (window.g.timezone * 60 * 1000)) + window.g.increaseTime);
        }
    };

    window.g.updateBigClock = function (clockTime) {
        if (window.g.displayMode) {
            if (window.g.displayMode !== window.g.displayLatch) {
                document.getElementById("analogClock").style.display = "none";
                document.getElementById("digitalClockWrapper").style.display = "block";
                window.g.displayLatch = window.g.displayMode;
            }
            var clock = document.getElementById("digitalClock");
            clock.innerText = (clockTime.h < 10 ? "0" : "") + clockTime.h + ":" +
                (clockTime.m < 10 ? "0" : "") + clockTime.m + ":" +
                (clockTime.s < 10 ? "0" : "") + clockTime.s;
            document.getElementById("digitalClockModifier").innerText = (clockTime.n ? "P" : "A") + "M";
        } else {
            if (window.g.displayMode !== window.g.displayLatch) {
                document.getElementById("digitalClockWrapper").style.display = "none";
                document.getElementById("analogClock").style.display = "block";
                window.g.displayLatch = window.g.displayMode;
            }
            window.g.rotateHand(document.getElementById("analogClock_hourHand").style, window.g.timeToDeg12(clockTime.h), "hourReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_minuteHand").style, window.g.timeToDeg60(clockTime.m), "minuteReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_secondHand").style, window.g.timeToDeg60(clockTime.s), "secondReachAroundLatch");
            document.getElementById("analogClockModifier").innerText = (clockTime.n ? "P" : "A") + "M";
        }
    };

    window.g.timeToDeg60 = function (numTime) {
        if (numTime > 60) {
            console.warn("[60] Invalid time", numTime);
            return;
        }
        return numTime * (360.0 / 60.0);
    };

    window.g.timeToDeg12 = function (numTime) {
        if (numTime > 12) {
            console.warn("[12] Invalid time", numTime);
            return;
        }
        return numTime * (360.0 / 12.0);
    };

    window.g.rotateHand = function (hand, deg, latch) {
        if (deg === 0) {
            if (!window.g[latch]) {
                window.g[latch] = true;
                hand.transition = "0s";
                setTimeout(function () {
                    hand.transform = "rotate(-6deg)";
                    setTimeout(function () {
                        hand.transition = "0.5s";
                        hand.transform = "rotate(0)";
                    }, 50);
                }, 50);
            }
        } else {
            if (window.g[latch]) {
                window.g[latch] = false;
            }
            hand.transform = "rotate(" + deg + "deg)";
        }
    };

    window.g.settingsClick = function () {
        if (!window.g.settingsLock) {
            window.g.settingsLock = true;
            if (window.g.settingsVisible) {
                window.g.settingsVisible = false;
                document.getElementById("settingsButton").style.filter = "invert(75%)";
                document.getElementById("settings").style.opacity = 0;
                setTimeout(function () {
                    document.getElementById("settings").style.display = "none";
                    window.g.settingsLock = false;
                }, 1000);
            } else {
                window.g.settingsVisible = true;
                document.getElementById("settingsButton").style.filter = "invert(25%)";
                document.getElementById("settings").style.display = "block";
                setTimeout(function () {
                    setTimeout(function () {
                        window.g.settingsLock = false;
                    }, 1000);
                    document.getElementById("settings").style.opacity = 1;
                }, 100);
            }
        }
    };

    window.g.changeSetting = function (setting, f) {
        var elem = document.getElementById("setting_" + setting);
        if (elem.classList.contains("settingSwitchToggleActive")) {
            elem.classList.remove("settingSwitchToggleActive");
            elem.innerText = elem.getAttribute("inactivetext");
        } else {
            elem.classList.add("settingSwitchToggleActive");
            elem.innerText = elem.getAttribute("activetext");
        }
        if (!f) {
            window.g[setting] = !window.g[setting];
            window.g.sock.send("MODE " + window.g[setting]);
        }
    };

    window.g.createAlarm = function () {
        if (!window.g.dialogProgressLock) {
            if (!window.g.createAlarmLock) {
                window.g.createAlarmLock = true;
                document.getElementById("newAlarm").innerHTML = "Cancel &otimes;";
                document.getElementById("newAlarm").style.filter = "sepia(100%)";
                window.g.showDialog("createAlarmDialog", function () {
                });
                document.getElementById("createButton").style.display = "block";
                setTimeout(function () {
                    document.getElementById("createButton").style.opacity = 1;
                }, 100);
            } else {
                if (window.g.editing) {
                    window.g.editing = false;
                }
                document.getElementById("newAlarm").innerHTML = "Create Alarm &oplus;";
                document.getElementById("newAlarm").style.filter = "";
                document.getElementById("createButton").style.opacity = 0;
                window.g.clearCreateDialog();
                window.g.hideDialog("createAlarmDialog", function () {
                    document.getElementById("createButton").style.display = "none";
                    window.g.createAlarmLock = false;
                });
            }
        }
    };

    window.g.showDialog = function (dialog, clbk) {
        if (window.g.dialogLock) {
            console.warn("Dialog already shown");
        } else {
            window.g.dialogLock = true;
            window.g.dialogProgressLock = true;
            document.getElementById("dialogWrapper").style.display = "block";
            document.getElementById(dialog).style.display = "block";
            setTimeout(function () {
                document.getElementById(dialog).style.opacity = 1;
                setTimeout(function () {
                    window.g.dialogProgressLock = false;
                    clbk();
                }, 1000);
            }, 100);
        }
    };

    window.g.hideDialog = function (dialog, clbk) {
        if (!window.g.dialogLock) {
            console.warn("Dialog already hidden");
        } else {
            window.g.dialogProgressLock = true;
            document.getElementById(dialog).style.opacity = 0;
            setTimeout(function () {
                document.getElementById("dialogWrapper").style.display = "none";
                document.getElementById(dialog).style.display = "none";
                window.g.dialogLock = false;
                window.g.dialogProgressLock = false;
                clbk();
            }, 1000);
        }
    };

    window.g.repeatCheck = function () {
        if (document.getElementById("checkInput_repeat").checked) {
            document.getElementById("repeatShadow").style.display = "none";
        } else {
            document.getElementById("repeatShadow").style.display = "block";
            document.getElementById("checkInput_sunday").checked = false;
            document.getElementById("checkInput_monday").checked = false;
            document.getElementById("checkInput_tuesday").checked = false;
            document.getElementById("checkInput_wednesday").checked = false;
            document.getElementById("checkInput_thursday").checked = false;
            document.getElementById("checkInput_friday").checked = false;
            document.getElementById("checkInput_saturday").checked = false;
        }
    };

    window.g.parseChronoParse = function (parsed) {
        if (parsed.hasOwnProperty("start") && parsed.start.knownValues.hasOwnProperty("hour")) {
            return {
                h: parsed.start.knownValues.hour,
                m: parsed.start.knownValues.minute ? parsed.start.knownValues.minute : 0,
                s: parsed.start.knownValues.second ? parsed.start.knownValues.second : 0,
                d: parsed.start.knownValues.weekday
            };
        }
        return {
            d: parsed.start.knownValues.weekday
        };
    };

    window.g.activateRepeat = function (repeatDay) {
        document.getElementById("checkInput_repeat").checked = true;
        window.g.repeatCheck();
        var day;
        switch (repeatDay) {
            case 0: day = "sunday"; break;
            case 1: day = "monday"; break;
            case 2: day = "tuesday"; break;
            case 3: day = "wednesday"; break;
            case 4: day = "thursday"; break;
            case 5: day = "friday"; break;
            case 6: day = "saturday"; break;
            default:
                console.warn("Bad day", repeatDay);
                break;
        }
        document.getElementById("checkInput_" + day).checked = true;
    };

    window.g.processTimeText = function () {
        var parseStuff = window.chrono.parse(document.getElementById("textInput_time").value);
        switch (parseStuff.length) {
            case 0:
                var elem = document.querySelector("#createAlarmDialog > div:first-child");
                elem.style["background-color"] = "#945353";
                setTimeout(function () {
                    elem.style.transition = "1s";
                    elem.style["background-color"] = "#606060";
                    setTimeout(function () {
                        elem.style.transition = "0s";
                    }, 1000);
                }, 100);
                break;
            case 1:
                var parsed = window.g.parseChronoParse(parseStuff[0]);
                if (!parsed.hasOwnProperty("h")) {
                    var elem = document.querySelector("#createAlarmDialog > div:first-child");
                    elem.style["background-color"] = "#945353";
                    setTimeout(function () {
                        elem.style.transition = "1s";
                        elem.style["background-color"] = "#606060";
                        setTimeout(function () {
                            elem.style.transition = "0s";
                        }, 1000);
                    }, 100);
                    return;
                }
                document.getElementById("checkInput_repeat").checked = false;
                window.g.repeatCheck();
                if (parsed.d) {
                    window.g.activateRepeat(parsed.d);
                }
                document.querySelector("#timeSelect_hour select").value = window.g.c24212(parsed.h).h.toString();
                document.querySelector("#timeSelect_minute select").value = parsed.m.toString();
                document.querySelector("#timeSelect_second select").value = parsed.s.toString();
                document.querySelector("#timeSelect_modifier select").value = window.g.c24212(parsed.h).n ? "pm" : "am";
                break;
            default:
                var timeFlag = false;
                var time;
                var repeatDates = [];
                for (var i = 0; i < parseStuff.length; i++) {
                    var parsed = window.g.parseChronoParse(parseStuff[i]);
                    console.log(parsed);
                    if (!parsed.hasOwnProperty("h")) {
                        if (parsed.d) {
                            repeatDates.push(parsed.d);
                        }
                    } else {
                        if (parsed.d) {
                            repeatDates.push(parsed.d);
                        }
                        if (!timeFlag) {
                            timeFlag = true;
                            time = parsed;
                        } else {
                            var elem = document.querySelector("#createAlarmDialog > div:first-child");
                            elem.style["background-color"] = "#945353";
                            setTimeout(function () {
                                elem.style.transition = "1s";
                                elem.style["background-color"] = "#606060";
                                setTimeout(function () {
                                    elem.style.transition = "0s";
                                }, 1000);
                            }, 100);
                            return;
                        }
                    }
                }
                if (timeFlag) {
                    document.querySelector("#timeSelect_hour select").value = window.g.c24212(time.h).h.toString();
                    document.querySelector("#timeSelect_minute select").value = time.m.toString();
                    document.querySelector("#timeSelect_second select").value = time.s.toString();
                    document.querySelector("#timeSelect_modifier select").value = window.g.c24212(time.h).n ? "pm" : "am";
                    document.getElementById("checkInput_repeat").checked = false;
                    window.g.repeatCheck();
                    if (repeatDates.length) {
                        for (var i = 0; i < repeatDates.length; i++) {
                            window.g.activateRepeat(repeatDates[i]);
                        }
                    }
                } else {
                    var elem = document.querySelector("#createAlarmDialog > div:first-child");
                    elem.style["background-color"] = "#945353";
                    setTimeout(function () {
                        elem.style.transition = "1s";
                        elem.style["background-color"] = "#606060";
                        setTimeout(function () {
                            elem.style.transition = "0s";
                        }, 1000);
                    }, 100);
                    return;
                }
                break;
        }
    };

    window.g.clearCreateDialog = function () {
        document.getElementById("checkInput_repeat").checked = false;
        window.g.repeatCheck();
        document.querySelector("#timeSelect_hour select").value = "0";
        document.querySelector("#timeSelect_minute select").value = "0";
        document.querySelector("#timeSelect_second select").value = "0";
        document.querySelector("#timeSelect_modifier select").value = "am";
        document.querySelector("#musicSelect select").value = "/alarmclock/tones/boobalee.ogg";
        document.getElementById("textInput_time").value = "";
    };

    window.g.confirmCreateAlarm = function () {
        if (window.g.editing) {
            window.g.editing = false;
            window.g.alarms[window.g.editIndex].deleteHandler();
        }
        var alarmElem = document.createElement("div");
        alarmElem.classList.add("alarmListElement");
        document.getElementById("alarmList").appendChild(alarmElem);
        window.g.alarms.push(new window.g.Alarm({
            h: parseInt(document.querySelector("#timeSelect_hour select").value, 10),
            m: parseInt(document.querySelector("#timeSelect_minute select").value, 10),
            s: parseInt(document.querySelector("#timeSelect_second select").value, 10),
            n: document.querySelector("#timeSelect_modifier select").value === "pm"
        }, {
            enable: document.getElementById("checkInput_repeat").checked,
            days: {
                sun: document.getElementById("checkInput_sunday").checked,
                mon: document.getElementById("checkInput_monday").checked,
                tue: document.getElementById("checkInput_tuesday").checked,
                wed: document.getElementById("checkInput_wednesday").checked,
                thu: document.getElementById("checkInput_thursday").checked,
                fri: document.getElementById("checkInput_friday").checked,
                sat: document.getElementById("checkInput_saturday").checked
            }
        }, document.querySelector("#musicSelect select").value, alarmElem, window.g.alarms.length, Math.floor(Math.random() * 100000000).toString(16) + "-" + Math.floor(Math.random() * 100000000).toString(16)));
        window.g.uploadAlarms();
        window.g.createAlarm();
    };

    window.g.displayAlarm = function (msg, dismiss, snooze) {
        window.g.alarmRingCount++;
        if (!window.g.goingOff) {
            window.g.goingOff = true;
            document.getElementById("alarmShadow").style.display = "block";
            document.getElementById("alarmBox").style.display = "block";
        }

        var alarmBoxElement = document.createElement("div");
        alarmBoxElement.classList.add("alarmBoxElement");

        var alarmBoxDismiss = document.createElement("div");
        alarmBoxDismiss.classList.add("alarmBoxButton");
        alarmBoxDismiss.classList.add("alarmBoxDismiss");
        alarmBoxDismiss.innerText = "DISMISS";
        alarmBoxDismiss.addEventListener("click", dismissListener);
        alarmBoxElement.appendChild(alarmBoxDismiss);

        var alarmBoxSnooze = document.createElement("div");
        alarmBoxSnooze.classList.add("alarmBoxButton");
        alarmBoxSnooze.classList.add("alarmBoxSnooze");
        alarmBoxSnooze.innerText = "SNOOZE";
        alarmBoxSnooze.addEventListener("click", snoozeListener);
        alarmBoxElement.appendChild(alarmBoxSnooze);

        var alarmBoxMsg = document.createElement("div");
        alarmBoxMsg.classList.add("alarmBoxMsg");
        alarmBoxMsg.classList.add("centerY");
        alarmBoxMsg.innerText = msg;
        alarmBoxElement.appendChild(alarmBoxMsg);

        document.getElementById("alarmBox").appendChild(alarmBoxElement);

        function dismissListener () {
            alarmBoxDismiss.removeEventListener("click", dismissListener);
            alarmBoxSnooze.removeEventListener("click", snoozeListener);
            alarmBoxElement.remove();
            window.g.alarmRingCount--;
            if (window.g.alarmRingCount === 0) {
                document.getElementById("alarmShadow").style.display = "none";
                document.getElementById("alarmBox").style.display = "none";
                window.g.goingOff = false;
            }
            dismiss();
        }
        function snoozeListener () {
            alarmBoxDismiss.removeEventListener("click", dismissListener);
            alarmBoxSnooze.removeEventListener("click", snoozeListener);
            alarmBoxElement.remove();
            window.g.alarmRingCount--;
            if (window.g.alarmRingCount === 0) {
                document.getElementById("alarmShadow").style.display = "none";
                document.getElementById("alarmBox").style.display = "none";
                window.g.goingOff = false;
            }
            snooze();
        }
    };

    window.g.uploadAlarms = function () {
        var _toExport = [];
        for (var i = 0; i < window.g.alarms.length; i++) {
            _toExport.push(window.g.alarms[i].exportAlarm());
        }
        var toExport = {alarms: _toExport, tz: window.g.timezone};
        if (window.g.sock.isOpen()) {
            window.g.sock.send("POST " + JSON.stringify(toExport));
        } else {
            var request = new XMLHttpRequest();
            request.onload = function () {
                console.log("Request came back " + request.status);
                var data;
                try {
                    data = JSON.parse(request.responseText);
                } catch (e) {
                    console.error(e);
                    return;
                }
                switch (request.status) {
                    case 200:
                        console.log("Data was", data);
                        break;
                    default:
                        console.error("Bad code: " + request.status);
                        return;
                }
            };
            request.open("POST", "https://sa.watz.ky:6969", true);
            request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            request.send(JSON.stringify(toExport));
        }
    };

    window.g.changeTimezone = function (tzo) {
        window.g.timezone = tzo;
        if (window.g.sock.isOpen()) {
            window.g.sock.send("TZ " + tzo);
        }
    };

    window.g.c12224 = function (h, n) {
        if (n) {
            return (h === 12) ? 12 : h + 12;
        }
        return (h === 12) ? 0 : h;
    };

    window.g.c24212 = function (h) {
        if (h === 12) {
            return {h: 12, n: true};
        }
        if (h > 12) {
            return {h: h - 12, n: true};
        }
        if (h === 0) {
            return {h: 12, n: false};
        }
        return {h: h, n: false};
    };

    window.g.visualize = function () {
        if (!window.g.visualizationTransitionLock) {
            window.g.visualizationTransitionLock = true;
            window.g.visualizationLock = !window.g.visualizationLock;
            var elem = document.getElementById("visualizationCanvas");
            if (window.g.visualizationLock) {
                console.log("Emptying chart...");
                document.getElementById("visualizationChart1").innerHTML = "";
                document.getElementById("visualizationChart2").innerHTML = "";
                window.g.sock.send("VDATA");
                elem.style.display = "block";
                document.getElementById("visualizeButton").style.filter = "invert(25%)";
                setTimeout(function () {
                    elem.style.opacity = 1;
                    setTimeout(function () {
                        window.g.visualizationTransitionLock = false;
                    }, 1000);
                }, 100);
            } else {
                elem.style.opacity = 0;
                document.getElementById("visualizeButton").style.filter = "invert(75%)";
                setTimeout(function () {
                    elem.style.display = "none";
                    window.g.visualizationTransitionLock = false;
                }, 1000);
            }
        }
    };
})();
