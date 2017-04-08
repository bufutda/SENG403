(function () {
    "use strict";

    // if this is the first file to define window.g, do so
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    /**
     * Update the clock to represent the passed time
     * @param {clockTimeObject} clockTime - an object containing time data
     * @returns {undefined}
     */
    window.g.updateBigClock = function (clockTime) {
        // if the displaymode is digital
        if (window.g.displayMode) {
            // if the displayMode has changed since the last update, change the display
            if (window.g.displayMode !== window.g.displayLatch) {
                document.getElementById("analogClock").style.display = "none";
                document.getElementById("digitalClockWrapper").style.display = "block";
                window.g.displayLatch = window.g.displayMode;
            }
            var clock = document.getElementById("digitalClock");

            // update the clock text
            clock.innerText = (clockTime.h < 10 ? "0" : "") + clockTime.h + ":" +
                (clockTime.m < 10 ? "0" : "") + clockTime.m + ":" +
                (clockTime.s < 10 ? "0" : "") + clockTime.s;
            document.getElementById("digitalClockModifier").innerText = (clockTime.n ? "P" : "A") + "M";
        } else {
            // if the displayMode has changed since last update, change the display
            if (window.g.displayMode !== window.g.displayLatch) {
                document.getElementById("digitalClockWrapper").style.display = "none";
                document.getElementById("analogClock").style.display = "block";
                window.g.displayLatch = window.g.displayMode;
            }
            // rotate the hands to the appropriate positions
            window.g.rotateHand(document.getElementById("analogClock_hourHand").style, window.g.timeToDeg12(clockTime.h), "hourReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_minuteHand").style, window.g.timeToDeg60(clockTime.m), "minuteReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_secondHand").style, window.g.timeToDeg60(clockTime.s), "secondReachAroundLatch");
            document.getElementById("analogClockModifier").innerText = (clockTime.n ? "P" : "A") + "M";
        }
    };

    /**
     * Convert a mod60 time to degrees
     * @param {int} numTime - the time to convert
     * @returns {Number} the degrees clockwise from 12 that, if the passed time were to be represented on a clock
     *                   hand, the hand would be at.
     */
    window.g.timeToDeg60 = function (numTime) {
        if (numTime > 60) {
            console.warn("[60] Invalid time", numTime);
            return;
        }
        return numTime * (360.0 / 60.0);
    };

    /**
     * Convert a mod12 time to degrees
     * @param {int} numTime - the time to convert
     * @returns {Number} the degrees clockwise from 12 that, if the passed time were to be represented on a clock
     *                   hand, the hand would be at.
     */
    window.g.timeToDeg12 = function (numTime) {
        if (numTime > 12) {
            console.warn("[12] Invalid time", numTime);
            return;
        }
        return numTime * (360.0 / 12.0);
    };

    /**
     * Rotate a hand element on the analog clock
     * @param {DOMElement} hand - the hand element to rotate
     * @param {Number} deg - the degrees clockwise from 12 to rotate the hand to
     * @param {bool} latch - true if this rotate would cause a wraparound graphical defect
     * @returns {undefined}
     */
    window.g.rotateHand = function (hand, deg, latch) {
        // if we are rotating to 12, check whether the wraparound graphical defect has been handled
        if (deg === 0) {
            if (!window.g[latch]) {
                // it has not been handled, so handle it
                window.g[latch] = true;

                // disable animations
                hand.transition = "0s";

                // in 50ms, rotate the hand to the inverse of it's current position (counter-clockwise)
                setTimeout(function () {
                    hand.transform = "rotate(-6deg)";

                    // in 50 more ms, re-enable the animation, and rotate it (clockwise this time) to it's
                    // requested position
                    setTimeout(function () {
                        hand.transition = "0.5s";
                        hand.transform = "rotate(0)";
                    }, 50);
                }, 50);
            }
        } else {
            // clear the latch if it's true and rotate the hand
            if (window.g[latch]) {
                window.g[latch] = false;
            }
            hand.transform = "rotate(" + deg + "deg)";
        }
    };
})();
