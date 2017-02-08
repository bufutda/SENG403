(function () {
    "use strict";
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }
    window.g.Alarm = function (clockTime, repeat, audio, elem, index) {
        var self = this;
        self.elem = elem;
        self.index = index;
        self.alarmTime = {
            h: clockTime.h + (clockTime.n ? 12 : 0),
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
        self.repeatHandlerID = null;
        self.minuteListening = false;
        self.tickListening = false;
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

        self.timeStr = function () {
            return (self.alarmTime.h < 10 ? "0" : "") + self.alarmTime.h + ":" +
                (self.alarmTime.m < 10 ? "0" : "") + self.alarmTime.m + ":" +
                (self.alarmTime.s < 10 ? "0" : "") + self.alarmTime.s;
        };

        self.deleteHandler = function () {
            if (self.minuteListening) {
                window.g.cronTimer.off("minute", self.minuteListener);
                self.minuteListening = false;
            }
            if (self.tickListening) {
                window.g.cronTimer.off("tick", self.tickListener);
                self.tickListening = false;
            }
            if (self.repeatHandlerID) {
                clearInterval(self.repeatHandlerID);
            }
            self.elem.remove();
            window.g.alarms.splice(self.index, 1);
            delete this;
        };

        self.tickListener = function (clockTime) {
            if (clockTime.s >= self.alarmTime.s) {
                self.tickListening = false;
                window.g.cronTimer.off("tick", self.tickListener);
                self.ring("It is now " + self.timeStr());
            }
        };

        self.minuteListener = function (clockTime) {
            if ((!self.doRepeat || self.repeat[clockTime.d]) && (clockTime.t === self.alarmTime.h) && (clockTime.m === self.alarmTime.m)) {
                self.minuteListening = false;
                window.g.cronTimer.off("minute", self.minuteListener);
                if (self.alarmTime.s === 0) {
                    self.ring("It is now " + self.timeStr());
                } else {
                    self.tickListening = true;
                    window.g.cronTimer.on("tick", self.tickListener);
                }
            }
        };
        self.setTimer = function () {
            self.minuteListening = true;
            window.g.cronTimer.on("minute", self.minuteListener);
        };

        self.ring = function (msg) {
            var alarmAudio = document.createElement("audio");
            alarmAudio.setAttribute("autoplay", true);
            alarmAudio.setAttribute("loop", true);
            alarmAudio.setAttribute("type", "audio/mpeg");
            alarmAudio.setAttribute("src", self.audioPath);
            self.elem.appendChild(alarmAudio);
            window.g.displayAlarm(msg, function () {
                // dismiss
                alarmAudio.remove();
                if (!self.doRepeat) {
                    self.deleteHandler();
                } else {
                    self.repeatHandlerID = setTimeout(function () {
                        self.repeatHandlerID = null;
                        if (self.doRepeat) {
                            console.info(self.index, "Repeating alarm");
                            self.setTimer();
                        }
                    }, 62000);
                }
            }, function () {
                // snooze
                alarmAudio.remove();
                setTimeout(function () {
                    console.log("snooze over");
                    self.ring("SNOOZE for alarm: " + self.timeStr());
                }, window.g.snoozeAmount);
            });
        };

        var timeDisplay = document.createElement("div");
        timeDisplay.classList.add("alarmListElementTime");
        timeDisplay.classList.add("centerY");
        timeDisplay.innerText = self.timeStr() + " " + self.repeatStr();
        self.elem.appendChild(timeDisplay);

        var cancelButton = document.createElement("div");
        cancelButton.classList.add("alarmListElementCancel");
        cancelButton.classList.add("centerY");
        cancelButton.innerHTML = "&otimes;";
        cancelButton.addEventListener("click", function () {
            if (confirm("Are you sure you want to delete this Alarm?")) {
                self.deleteHandler();
            }
        });
        self.elem.appendChild(cancelButton);

        self.setTimer();
    };
})();
