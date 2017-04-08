(function () {
    "use strict";

    // if this is the first file to define window.g, define it
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    /**
     * Open a dialog over the alarm list and modify the buttons
     * @returns {undefined}
     */
    window.g.createAlarm = function () {
        // ensure all relevant animations have completed
        if (!window.g.dialogProgressLock) {
            // if the dialog is not up
            if (!window.g.createAlarmLock) {
                window.g.createAlarmLock = true;
                // change the button text to Cancel
                document.getElementById("newAlarm").innerHTML = "Cancel &otimes;";
                document.getElementById("newAlarm").style.filter = "sepia(100%)";
                // show the dialog
                window.g.showDialog("createAlarmDialog", function () {});
                document.getElementById("createButton").style.display = "block";
                // enable the confirm button
                setTimeout(function () {
                    document.getElementById("createButton").style.opacity = 1;
                }, 100);
            } else {
                // the cancel button has been hit
                if (window.g.editing) {
                    window.g.editing = false;
                }
                // revert the display
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

    /**
     * Show the create alarm dialog
     * @param {string} dialog - the css selector id of the dialog
     * @param {callback} clbk - the return-callback
     * @returns {undefined}
     */
    window.g.showDialog = function (dialog, clbk) {
        // if the dialog is visible
        if (window.g.dialogLock) {
            console.warn("Dialog already shown");
        } else {
            // start the dialog animation
            window.g.dialogLock = true;
            window.g.dialogProgressLock = true;
            document.getElementById("dialogWrapper").style.display = "block";
            document.getElementById(dialog).style.display = "block";
            // when the animation is done, change it's opacity
            setTimeout(function () {
                document.getElementById(dialog).style.opacity = 1;
                // when the opacity is done changing, remove the lock
                setTimeout(function () {
                    window.g.dialogProgressLock = false;
                    clbk();
                }, 1000);
            }, 100);
        }
    };

    /**
     * Hide the create alarm dialog
     * @param {string} dialog - the css selector of the id of the dialog
     * @param {callback} clbk - the return-callback
     * @returns {undefined}
     */
    window.g.hideDialog = function (dialog, clbk) {
        // if the dialog is hidden
        if (!window.g.dialogLock) {
            console.warn("Dialog already hidden");
        } else {
            // lock the dialog buttons
            window.g.dialogProgressLock = true;
            document.getElementById(dialog).style.opacity = 0;
            // when the opacity is done changing, remove the element from the visible DOM
            setTimeout(function () {
                document.getElementById("dialogWrapper").style.display = "none";
                document.getElementById(dialog).style.display = "none";
                window.g.dialogLock = false;
                window.g.dialogProgressLock = false;
                clbk();
                return;
            }, 1000);
        }
    };

    /**
     * Decide whether or not the repeat checkboxes should be enabled, and act on it
     * @returns {undefined}
     */
    window.g.repeatCheck = function () {
        // if the enable box is checked, don't disable the checkboxes
        if (document.getElementById("checkInput_repeat").checked) {
            document.getElementById("repeatShadow").style.display = "none";
        } else {
            // clear the boxes
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

    /**
     * Parser for the parsed data from the smart input
     * @param {ChronoParsedData} parsed - the parsed data to parse
     * @returns {object} a time object representing the parsed parsed data
     */
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

    /**
     * Check the appropriate box on the dialog
     * @param {int} repeatDay - the 0-indexed day to repeat from
     * @returns {undefined}
     */
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

    /**
     * Parser for text entered into the smart input
     * @returns {undefined}
     */
    window.g.processTimeText = function () {
        var parseStuff = window.chrono.parse(document.getElementById("textInput_time").value);
        switch (parseStuff.length) {
            // error the smart input
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
                // if there's no h, error the input
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
                // take the parsed text's inputs and put them in the appropriate places
                // on the DOM
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
                // for each of Chrono's result objects, parse the data and see if enough
                // information can be aggregated to fill the dialog
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
                            // Chrono didn't give us enough data, error the input
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
                // place the inputs into the appropriate places on the DOM
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
                    // Chrono didn't give us enough data, error the input
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

    /**
     * Revert all inputtable elements in the create alarm dialog to their initial states
     * @returns {undefined}
     */
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

    /**
     * Convert data from the inputs into a consolidated object, and create an alarm based on it
     * @returns {undefined}
     */
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

        // send the alarm to the server
        window.g.uploadAlarms();

        // clear the dialog
        window.g.createAlarm();
    };

    /**
     * Display the popup for the alarm when it rings
     * @param {string} msg - the label to include with the alarm
     * @param {callback} dismiss - a function that is called if the user pushes "dismiss"
     * @param {callback} snooze - a function that is called if the user pushes "snooze"
     * @returns {undefined}
     */
    window.g.displayAlarm = function (msg, dismiss, snooze) {
        window.g.alarmRingCount++;
        // if the dialog is already visible, append the notification
        // otherwise, make the dialog visible and set the variable so further rings can append
        if (!window.g.goingOff) {
            window.g.goingOff = true;
            document.getElementById("alarmShadow").style.display = "block";
            document.getElementById("alarmBox").style.display = "block";
        }

        // list item element to hold the notification
        var alarmBoxElement = document.createElement("div");
        alarmBoxElement.classList.add("alarmBoxElement");

        // dismiss button
        var alarmBoxDismiss = document.createElement("div");
        alarmBoxDismiss.classList.add("alarmBoxButton");
        alarmBoxDismiss.classList.add("alarmBoxDismiss");
        alarmBoxDismiss.innerText = "DISMISS";
        alarmBoxDismiss.addEventListener("click", dismissListener);
        alarmBoxElement.appendChild(alarmBoxDismiss);

        // snooze button
        var alarmBoxSnooze = document.createElement("div");
        alarmBoxSnooze.classList.add("alarmBoxButton");
        alarmBoxSnooze.classList.add("alarmBoxSnooze");
        alarmBoxSnooze.innerText = "SNOOZE";
        alarmBoxSnooze.addEventListener("click", snoozeListener);
        alarmBoxElement.appendChild(alarmBoxSnooze);

        // label
        var alarmBoxMsg = document.createElement("div");
        alarmBoxMsg.classList.add("alarmBoxMsg");
        alarmBoxMsg.classList.add("centerY");
        alarmBoxMsg.innerText = msg;
        alarmBoxElement.appendChild(alarmBoxMsg);

        // append the list to the DOM, making it visible
        document.getElementById("alarmBox").appendChild(alarmBoxElement);

        /**
         * Listener that gets called if the user pushes dismiss
         * @returns {undefined}
         */
        function dismissListener () {
            // clear the listeners
            alarmBoxDismiss.removeEventListener("click", dismissListener);
            alarmBoxSnooze.removeEventListener("click", snoozeListener);

            // remove the alarm notification
            alarmBoxElement.remove();

            window.g.alarmRingCount--;

            // if this was the last item in the dialog, remove the dialog from view
            if (window.g.alarmRingCount === 0) {
                document.getElementById("alarmShadow").style.display = "none";
                document.getElementById("alarmBox").style.display = "none";
                window.g.goingOff = false;
            }

            // callback to the calling function
            dismiss();
        }

        /**
         * Listener that gets called if the user pushes snooze
         * @returns {undefined}
         */
        function snoozeListener () {
            // remove the listeners
            alarmBoxDismiss.removeEventListener("click", dismissListener);
            alarmBoxSnooze.removeEventListener("click", snoozeListener);

            // remove the notification
            alarmBoxElement.remove();

            window.g.alarmRingCount--;

            // if this was the last notification, hide the dialog
            if (window.g.alarmRingCount === 0) {
                document.getElementById("alarmShadow").style.display = "none";
                document.getElementById("alarmBox").style.display = "none";
                window.g.goingOff = false;
            }

            // callback to the calling function
            snooze();
        }
    };

    /**
     * Send all local alarm data to the server for storage
     * @returns {undefined}
     */
    window.g.uploadAlarms = function () {
        // temp array to store outgoing data as it is collected
        var _toExport = [];
        // store the concatenated object version of every alarm in the temp array
        for (var i = 0; i < window.g.alarms.length; i++) {
            _toExport.push(window.g.alarms[i].exportAlarm());
        }

        // create an object to JSONify and send to the server
        // add other settings (timezone)
        var toExport = {alarms: _toExport, tz: window.g.timezone};
        if (window.g.sock.isOpen()) {
            window.g.sock.send("POST " + JSON.stringify(toExport));
        } else {
            // the socket is not available, try to upload the data via POST
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
            // send the XMLHTTPRequest
            request.open("POST", "https://sa.watz.ky:6969", true);
            request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            request.send(JSON.stringify(toExport));
        }
    };
})();
