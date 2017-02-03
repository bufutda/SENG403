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

    window.g.cronTimer = {
        tmr: NaN,
        date: new Date(),
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
            var time = new Date();
            var clockTime = {
                s: time.getSeconds(),
                m: time.getMinutes(),
                h: time.getHours() % 12,
                t: time.getHours(),
                n: time.getHours() > 12
            };
            window.g.updateBigClock(clockTime);
            if (time.getUTCSeconds() < 30 && !window.g.cronTimer.secondLatch) {
                window.g.cronTimer.emit("half");
                window.g.cronTimer.emit("minute");
                window.g.cronTimer.emit("cron", 0.5);
                window.g.cronTimer.emit("cron", 1);
                window.g.cronTimer.secondLatch = true;
            }
            if (time.getUTCSeconds() >= 30 && window.g.cronTimer.secondLatch) {
                window.g.cronTimer.emit("half");
                window.g.cronTimer.emit("cron", 0.5);
                window.g.cronTimer.secondLatch = false;
            }
            if (time.getUTCMinutes() !== window.g.cronTimer.minuteLatch) {
                window.g.cronTimer.minuteLatch = time.getUTCMinutes();
                if (window.g.cronTimer.minuteLatch % 10 === 0) {
                    window.g.cronTimer.emit("ten");
                    window.g.cronTimer.emit("cron", 10);
                }
                if (window.g.cronTimer.minuteLatch % 30 === 0) {
                    window.g.cronTimer.emit("thirty");
                    window.g.cronTimer.emit("cron", 30);
                }
                if (window.g.cronTimer.minuteLatch === 0) {
                    window.g.cronTimer.emit("hour");
                    window.g.cronTimer.emit("cron", 60);
                }
            }
        },
        on: function (event, handler) {
            if (!window.g.cronTimer.listeners.hasOwnProperty(event)) {
                window.g.cronTimer.listeners[event] = [];
            }
            window.g.cronTimer.listeners[event].push(handler);
        },
        emit: function (event, arg) {
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
            window.g.rotateHand(document.getElementById("analogClock_hourHand").style, window.g.timeToDeg(clockTime.h), "hourReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_minuteHand").style, window.g.timeToDeg(clockTime.m), "minuteReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_secondHand").style, window.g.timeToDeg(clockTime.s), "secondReachAroundLatch");
            document.getElementById("analogClockModifier").innerText = (clockTime.n ? "P" : "A") + "M";
        }
    };

    window.g.timeToDeg = function (numTime) {
        if (numTime > 60) {
            console.warn("Invalid time", numTime);
            return;
        }
        return numTime * (360.0 / 60.0);
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
                        setTimeout(function () {
                            window.g[latch] = false;
                        }, 1000);
                    }, 50);
                }, 50);
            }
        } else {
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

    window.g.changeSetting = function (setting) {
        var elem = document.getElementById("setting_" + setting);
        if (elem.classList.contains("settingSwitchToggleActive")) {
            elem.classList.remove("settingSwitchToggleActive");
            elem.innerText = elem.getAttribute("inactivetext");
        } else {
            elem.classList.add("settingSwitchToggleActive");
            elem.innerText = elem.getAttribute("activetext");
        }
        window.g[setting] = !window.g[setting];
    };

    window.g.createAlarm = function () {
        if (!window.g.dialogProgressLock) {
            if (!window.g.createAlarmLock) {
                window.g.createAlarmLock = true;
                document.getElementById("newAlarm").innerHTML = "Cancel &ominus;";
                document.getElementById("newAlarm").style.filter = "sepia(100%)";
                window.g.showDialog("createAlarmDialog", function () {
                });
                document.getElementById("createButton").style.display = "block";
                setTimeout(function () {
                    document.getElementById("createButton").style.opacity = 1;
                }, 100);
            } else {
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

    window.g.processTimeText = function () {
        var date = window.chrono.parseDate(document.getElementById("textInput_time").value);
        if (date === null) {
            var elem = document.querySelector("#createAlarmDialog > div:first-child");
            elem.style["background-color"] = "#945353";
            setTimeout(function () {
                elem.style.transition = "1s";
                elem.style["background-color"] = "#606060";
                setTimeout(function () {
                    elem.style.transition = "0s";
                }, 1000);
            }, 100);
        } else {
            document.querySelector("#timeSelect_hour select").value = (date.getHours() > 12 ? date.getHours() - 12 : date.getHours()).toString();
            document.querySelector("#timeSelect_minute select").value = date.getMinutes().toString();
            document.querySelector("#timeSelect_second select").value = date.getSeconds().toString();
            document.querySelector("#timeSelect_modifier select").value = date.getHours() >= 12 ? "pm" : "am";
        }
    };

    window.g.clearCreateDialog = function () {
        document.getElementById("checkInput_repeat").checked = false;
        window.g.repeatCheck();
        document.querySelector("#timeSelect_hour select").value = "0";
        document.querySelector("#timeSelect_minute select").value = "0";
        document.querySelector("#timeSelect_second select").value = "0";
        document.querySelector("#timeSelect_modifier select").value = "am";
        document.querySelector("#musicSelect select").value = "/alarmclock/tones/alert.ogg";
        document.getElementById("textInput_time").value = "";
    };

    window.g.confirmCreateAlarm = function () {
        var alarmElem = document.createElement("div");
        alarmElem.classList.add("alarmListElement");
        document.getElementById("alarmList").appendChild(alarmElem);
        window.g.alarms.push(new window.g.Alarm({
            h: parseInt(document.querySelector("#timeSelect_hour select").value, 10),
            m: parseInt(document.querySelector("#timeSelect_minute select").value, 10),
            s: parseInt(document.querySelector("#timeSelect_second select").value, 10),
            n: document.querySelector("#timeSelect_modifier select").value === "am"
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
        }, document.querySelector("#musicSelect select").value, alarmElem));
        window.g.createAlarm();
    };
})();
