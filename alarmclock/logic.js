(function () {
    "use strict";
    window.g = {
        displayMode: null,
        displayLatch: null,
        secondReachAroundLatch: false,
        minuteReachAroundLatch: false,
        hourReachAroundLatch: false
    };

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
                h: time.getHours()
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
        if (window.g.displayMode === "digital") {
            if (window.g.displayMode !== window.g.displayLatch) {
                document.getElementById("analogClock").style.display = "none";
                document.getElementById("digitalClock").style.display = "block";
                window.g.displayLatch = window.g.displayMode;
            }
            var clock = document.getElementById("digitalClock");
            clock.innerHTML = (clockTime.h < 10 ? "0" : "") + clockTime.h + ":" +
                (clockTime.m < 10 ? "0" : "") + clockTime.m + ":" +
                (clockTime.s < 10 ? "0" : "") + clockTime.s;
        } else {
            if (window.g.displayMode !== window.g.displayLatch) {
                document.getElementById("digitalClock").style.display = "none";
                document.getElementById("analogClock").style.display = "block";
                window.g.displayLatch = window.g.displayMode;
            }
            window.g.rotateHand(document.getElementById("analogClock_hourHand").style, window.g.timeToDeg(clockTime.h), "hourReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_minuteHand").style, window.g.timeToDeg(clockTime.m), "minuteReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_secondHand").style, window.g.timeToDeg(clockTime.s), "secondReachAroundLatch");
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
})();
