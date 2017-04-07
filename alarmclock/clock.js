(function () {
    "use strict";
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

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
})();
