(function () {
    "use strict";
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }
    window.g.Alarm = function (clockTime, repeat, audio, elem) {
        var self = this;
        self.elem = elem;
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

        var timeDisplay = document.createElement("div");
        timeDisplay.classList.add("alarmListElementTime");
        timeDisplay.classList.add("centerY");
        timeDisplay.innerText = self.timeStr() + " " + self.repeatStr();
        self.elem.appendChild(timeDisplay);
    };
})();
