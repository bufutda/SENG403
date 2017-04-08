(function () {
    "use strict";

    // if this is the first file to define window.g, do so
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    /**
     * Class alarm for holding functionality and data relating to an alarm
     * @constructor
     * @param {object} clockTime - holds the time when the alarm is to go off
     * @param {object} repeat - holds what days, if any, the alarm is to repeat on
     * @param {string} audio - the relative path to the audio that should be played
     *                         when the alarm goes off
     * @param {DOMElement} elem - the element that should be used to display this alarm
     * @param {int} index - the index of window.g.alarms that this object sits in
     * @param {string} id - a formatted ID referring to this alarm
     * @param {string} label - the text associated with the alarm
     * @returns {Alarm} instance of an Alarm object corresponding to the data passed to it
     */
    window.g.Alarm = function (clockTime, repeat, audio, elem, index, id, label) {
        // store the context of the object being created to have less reference lookups
        var self = this;

        // store what was originally passed
        self.elem = elem;
        self.label = label;
        self.id = id;
        self.index = index;
        self.alarmTime = {
            h: window.g.c12224(clockTime.h, clockTime.n),
            m: clockTime.m,
            s: clockTime.s
        };
        self.doRepeat = repeat.enable;
        self.repeat = {
            0: repeat.days.sun,
            1: repeat.days.mon,
            2: repeat.days.tue,
            3: repeat.days.wed,
            4: repeat.days.thu,
            5: repeat.days.fri,
            6: repeat.days.sat
        };
        self.audioPath = audio;

        // timeout ID corresponding to the repeat handler
        self.repeatHandlerID = null;

        // if this alarm is currently listening to the minute event
        self.minuteListening = false;

        // if this alarm is currently listening to the tick event
        self.tickListening = false;

        /**
         * Generate a string representation of the repeat settings
         * @returns {string} a representation of the repeat settings
         */
        self.repeatStr = function () {
            var str = [];
            if (self.repeat[0]) { str.push("Su"); }
            if (self.repeat[1]) { str.push("M"); }
            if (self.repeat[2]) { str.push("Tu"); }
            if (self.repeat[3]) { str.push("W"); }
            if (self.repeat[4]) { str.push("Th"); }
            if (self.repeat[5]) { str.push("F"); }
            if (self.repeat[6]) { str.push("Sa"); }
            return str.join("|");
        };

        /**
         * Generate a string representation of the time when this alarm is supposed to go off
         * @returns {string} a representation of the time when this alarm is supposed to go off
         */
        self.timeStr = function () {
            var h = window.g.c24212(self.alarmTime.h).h;
            return (h < 10 ? "0" : "") + h + ":" +
                (self.alarmTime.m < 10 ? "0" : "") + self.alarmTime.m + ":" +
                (self.alarmTime.s < 10 ? "0" : "") + self.alarmTime.s + (window.g.c24212(self.alarmTime.h).n ? "P" : "A") + "M";
        };

        /**
         * Unregister the alarm from all events and remove it from the document
         * @returns {undefined}
         */
        self.deleteHandler = function () {
            // unregister listeners
            if (self.minuteListening) {
                window.g.cronTimer.off("minute", self.minuteListener);
                self.minuteListening = false;
            }
            if (self.tickListening) {
                window.g.cronTimer.off("tick", self.tickListener);
                self.tickListening = false;
            }

            // clear the timer
            if (self.repeatHandlerID) {
                clearInterval(self.repeatHandlerID);
            }

            // remove the element from the document
            self.elem.remove();
            window.g.alarms.splice(self.index, 1);
            window.g.uploadAlarms();

            // clear memory
            delete this;
        };

        /**
         * Handler for the tick event emitted by the cronTimer
         * @param {object} clockTime - the current time as seen by the timer
         * @returns {undefined}
         */
        self.tickListener = function (clockTime) {
            // if the current time is ahead of the alarm time,
            // ring the alarm
            if (clockTime.s >= self.alarmTime.s) {
                self.tickListening = false;
                window.g.cronTimer.off("tick", self.tickListener);
                self.ring(self.generateAlarmMsg());
            }
        };

        /**
         * Handler for the minute event emitted by the cronTimer
         * @param {object} clockTime - the current time as seen by the timer
         * @returns {undefined}
         */
        self.minuteListener = function (clockTime) {
            // if this is a one time alarm, or today is the day with repeat enabled,
            // and the hour and minute is correct, ring the alarm or register to tickListener
            if ((!self.doRepeat || self.repeat[clockTime.d]) && (clockTime.t === self.alarmTime.h) && (clockTime.m === self.alarmTime.m)) {
                self.minuteListening = false;
                window.g.cronTimer.off("minute", self.minuteListener);
                if (self.alarmTime.s === 0) {
                    // second is '0', so ring the alarm
                    self.ring(self.generateAlarmMsg());
                } else {
                    // second is not '0', register the tickListener
                    self.tickListening = true;
                    window.g.cronTimer.on("tick", self.tickListener);
                }
            }
        };

        /**
         * Start the timer listening for updates
         * @returns {undefined}
         */
        self.setTimer = function () {
            self.minuteListening = true;
            window.g.cronTimer.on("minute", self.minuteListener);
        };

        /**
         * Ring the alarm
         * @param {string} msg - the message to display when the alarm goes off
         * @returns {undefined}
         */
        self.ring = function (msg) {
            // create an ausio element to play the sound
            var alarmAudio = document.createElement("audio");
            alarmAudio.setAttribute("autoplay", true);
            alarmAudio.setAttribute("loop", true);
            alarmAudio.setAttribute("type", "audio/mpeg");
            alarmAudio.setAttribute("src", self.audioPath);
            self.elem.appendChild(alarmAudio);

            // display a popup for the alarm
            window.g.displayAlarm(msg, function () {
                // user dismissed the alarm
                // stop the alarm
                alarmAudio.remove();
                // if the alarm is not going to go off again, delete it
                if (!self.doRepeat) {
                    self.deleteHandler();
                } else {
                    // start the repeat handler (re-register in 62s)
                    self.repeatHandlerID = setTimeout(function () {
                        self.repeatHandlerID = null;
                        if (self.doRepeat) {
                            console.info(self.index, "Repeating alarm");
                            self.setTimer();
                        }
                    }, 62000);
                }
            }, function () {
                // user snoozed the alarm
                // stop the alarm
                alarmAudio.remove();
                // tell the server that there was a snooze event
                window.g.sock.send("SNOOZE " + self.id);

                // re-ring the alarm snoozeAmount ms later
                setTimeout(function () {
                    console.log("snooze over");
                    self.ring(self.generateAlarmMsg());
                }, window.g.snoozeAmount);
            });
        };

        // DOM element to display the time this alarm will go off
        var timeDisplay = document.createElement("div");
        timeDisplay.classList.add("alarmListElementTime");
        timeDisplay.classList.add("centerY");
        timeDisplay.innerText = self.timeStr() + " " + self.repeatStr();
        self.elem.appendChild(timeDisplay);

        // DOM element to display the label of the alarm
        var labelDisplay = document.createElement("div");
        labelDisplay.classList.add("alarmListElementLabel");
        labelDisplay.innerText = self.label;
        self.elem.appendChild(labelDisplay);

        // DOM element to cancel the alarm
        var cancelButton = document.createElement("div");
        cancelButton.classList.add("alarmListElementCancel");
        cancelButton.innerHTML = "&otimes;";
        cancelButton.addEventListener("click", function () {
            if (confirm("Are you sure you want to delete this Alarm?")) {
                self.deleteHandler();
            }
        });
        self.elem.appendChild(cancelButton);

        // DOM element to edit the alarm
        var editButton = document.createElement("img");
        editButton.classList.add("alarmListElementEdit");
        editButton.setAttribute("src", "/alarmclock/assets/edit.png");
        editButton.addEventListener("click", function () {
            window.g.editing = true;
            window.g.editIndex = self.index;
            window.g.createAlarm();
            if (self.doRepeat) {
                for (var prop in self.repeat) {
                    if (self.repeat[prop]) {
                        window.g.activateRepeat(parseInt(prop, 10));
                    }
                }
            } else {
                window.g.repeatCheck();
            }
            // input old values into the dialog
            document.querySelector("#timeSelect_hour select").value = (self.alarmTime.h > 12 ? self.alarmTime.h - 12 : self.alarmTime.h).toString();
            document.querySelector("#timeSelect_minute select").value = self.alarmTime.m.toString();
            document.querySelector("#timeSelect_second select").value = self.alarmTime.s.toString();
            document.querySelector("#timeSelect_modifier select").value = self.alarmTime.h >= 12 ? "pm" : "am";
            document.querySelector("#musicSelect select").value = self.audioPath;
            document.getElementById("textInput_label").value = self.label;
            document.getElementById("textInput_time").value = "";
        });
        self.elem.appendChild(editButton);

        /**
         * Turn all relevant data about this alarm into a small object
         * @returns {object} a representation of the alarm
         */
        self.exportAlarm = function () {
            return {
                time: self.alarmTime,
                repeat: self.repeat,
                audioPath: self.audioPath,
                id: self.id,
                label: self.label
            };
        };

        /**
         * Retrieve the message associated with the alarm
         * @returns {string} the label, or a default message if there is none
         */
        self.generateAlarmMsg = function () {
            if (self.label.length) {
                return self.label;
            }
            return "It is now " + self.timeStr();
        };

        // start the timer
        self.setTimer();
    };
})();
