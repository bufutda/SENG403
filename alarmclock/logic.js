(function () {
    "use strict";
    window.g = {
        displayMode: "digital"
    };

    window.g.cronTimer = {
        tmr: NaN,
        date: new Date(),
        secondLatch: false,
        minuteLatch: -1,
        listeners: {},
        start: function () {
            if (isNaN(window.g.cronTimer.tmr)) {
                window.g.tmr = setInterval(window.g.cronTimer.secondHandler, 1000);
            } else {
                console.warn("CRON already started.");
            }
        },
        stop: function () {
            if (isNaN(window.g.cronTimer.tmr)) {
                console.wrn("CRON already stopped.");
            } else {
                clearInterval(window.g.cronTimer.tmr);
                window.g.cronTimer.tmr = NaN;
            }
        },
        secondHandler: function () {
            var time = new Date();
            window.g.updateBigClock(time);
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
                console.warn("No listeners on emitted event:", event);
            }
        }
    };

    window.g.updateBigClock = function (time) {
        if (window.g.displayMode === "digital") {
            var clock = document.getElementById("digitalClock");
            var clockTime = {
                s: time.getSeconds(),
                m: time.getMinutes(),
                h: time.getHours()
            };
            clock.innerHTML = (clockTime.h < 10 ? "0" : "") + clockTime.h + ":" +
                (clockTime.m < 10 ? "0" : "") + clockTime.m + ":" +
                (clockTime.s < 10 ? "0" : "") + clockTime.s;
        } else {
            console.warn("Unimplemented displayMode:", window.g.displayMode);
        }
    };
})();
