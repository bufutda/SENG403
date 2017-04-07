(function () {
    "use strict";

    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

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
        }, document.querySelector("#musicSelect select").value, alarmElem, window.g.alarms.length, Math.floor(Math.random() * 100000000).toString(16) + "-" + Math.floor(Math.random() * 100000000).toString(16), document.getElementById("textInput_label").value));
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

})();
