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
            self.elem.remove();
            window.g.alarms.splice(self.index, 1);
            delete this;
        };

        self.setTimer = function () {
            window.g.cronTimer.on("minute", function listener (clockTime) {
                if ((clockTime.h === self.alarmTime.h) && (clockTime.m === self.alarmTime.m)) {
                    window.g.cronTimer.off("minute", listener);
                    if (self.alarmTime.s === 0) {
                        self.ring();
                        if (self.doRepeat) {
                            self.setTimer();
                        }
                    } else {
                        window.g.cronTimer.on("tick", function tickListener (clockTime) {
                            if (clockTime.s >= self.alarmTime.s) {
                                window.g.cronTimer.off("tick", tickListener);
                                self.ring();
                                if (self.doRepeat) {
                                    self.setTimer();
                                }
                            }
                        });
                    }
                }
            });
        };

        self.ring = function () {
            window.g.displayAlarm("It is now " + self.timeStr(), function () {
                // dismiss
                if (!self.doRepeat) {
                    self.deleteHandler();
                }
            }, function () {
                // snooze
                if (!self.doRepeat) {
                    self.deleteHandler();
                }
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
