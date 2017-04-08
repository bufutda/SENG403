/**
 * Emits a {clockTime} object every time the timer is updated
 * @event tick
 */
/**
 * Emits a {clockTime} object every minute
 * @event minute
 */
/**
 * Emits a {clockTime} object every 30 seconds
 * @event half
 */
/**
 * Emits a {clockTime} object every 10 minutes
 * @event ten
 */
/**
 * Emits a {clockTime} object every 30 minutes
 * @event thirty
 */
/**
 * Emits a {clockTime} object every hour
 * @event hour
 */

(function () {
    "use strict";

    // if this is the first file to define window.g, do so
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    // create a wrapper-object to hold data relevant to the cronTimer
    window.g.cronTimer = {
        tmr: NaN,
        secondLatch: false,
        minuteLatch: -1,
        listeners: {},

        /**
         * start the cronTimer
         * @returns {undefined}
         */
        start: function () {
            // if the timer has not been started already
            if (isNaN(window.g.cronTimer.tmr)) {
                // call the handler every tick (100ms)
                window.g.cronTimer.tmr = setInterval(window.g.cronTimer.secondHandler, 100);
            } else {
                console.warn("CRON already started.");
            }
        },

        /**
         * Stop the cronTimer
         * @returns {undefined}
         */
        stop: function () {
            // if the timer is running
            if (isNaN(window.g.cronTimer.tmr)) {
                console.warn("CRON already stopped.");
            } else {
                // stop the timer
                clearInterval(window.g.cronTimer.tmr);
                window.g.cronTimer.tmr = NaN;
            }
        },

        /**
         * Handler designed to run at every cron tick
         * @returns {undefined}
         */
        secondHandler: function () {
            // get the current time and put it in a clockTime object
            var time = window.g.cronTimer.getTime();
            var clockTime = {
                s: time.getUTCSeconds(),
                m: time.getUTCMinutes(),
                h: window.g.c24212(time.getUTCHours()).h,
                t: time.getUTCHours(),
                n: window.g.c24212(time.getUTCHours()).n,
                d: time.getUTCDay()
            };

            // emit a tick event
            window.g.cronTimer.emit("tick", clockTime);

            // update the clock with the current time
            window.g.updateBigClock(clockTime);

            // check if the minute event should be emitted
            if (time.getUTCSeconds() < 30 && !window.g.cronTimer.secondLatch) {
                window.g.cronTimer.emit("half");
                window.g.cronTimer.emit("minute", clockTime);
                window.g.cronTimer.secondLatch = true;
            }

            // check if the half event should be emitted
            if (time.getUTCSeconds() >= 30 && window.g.cronTimer.secondLatch) {
                window.g.cronTimer.emit("half");
                window.g.cronTimer.secondLatch = false;
            }

            // check for ten, thirty, and hour events
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

        /**
         * Method for registering listeners on the events exposed by cronTimer
         * @param {event} event - an event to listen on
         * @param {eventListener} handler - a function to call when the event is emitted
         * @return {undefined}
         */
        on: function (event, handler) {
            console.info("New listener on " + event, window.g.cronTimer.listeners.hasOwnProperty(event) ? window.g.cronTimer.listeners[event].length : 0);
            // if the listener exists
            if (!window.g.cronTimer.listeners.hasOwnProperty(event)) {
                window.g.cronTimer.listeners[event] = [];
            }
            // add the listener, emit the event immediately even if the time is incorrect
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

        /**
         * Method for un-registering listeners that have previously been registered on cronTimer's events
         * @param {event} event - the event that the listener was listening on
         * @param {eventListener} handler - the handler listening on the event
         * @returns {undefined}
         */
        off: function (event, handler) {
            console.info("Removed listener on " + event);
            // if the event exists
            if (window.g.cronTimer.listeners.hasOwnProperty(event)) {
                var i = window.g.cronTimer.listeners[event].indexOf(handler);
                // if the event is being listened by the listener
                if (i > -1) {
                    window.g.cronTimer.listeners[event].splice(i, 1);
                } else {
                    console.warn("Cannot remove listener. Handler is not registered.", handler);
                }
            } else {
                console.warn("Cannot remove listener for non-existant event:", event);
            }
        },

        /**
         * Method to emit events
         * @param {event} event - the event to emit
         * @param {Arguments} arg - any datatype (or none at all) to call listeners with
         * @returns {undefined}
         */
        emit: function (event, arg) {
            // log the event if it's anything but tick
            if (event !== "tick") {
                console.info("[E] " + event);
            }
            // if the arg isn't an array, make it so
            if (!(arg instanceof Array)) {
                arg = [arg];
            }
            // if the event exists
            if (window.g.cronTimer.listeners.hasOwnProperty(event)) {
                // for each listener on this event, call the listeners
                for (var i = 0; i < window.g.cronTimer.listeners[event].length; i++) {
                    window.g.cronTimer.listeners[event][i].apply(window, arg);
                }
            } else {
                // console.warn("No listeners on emitted event:", event);
            }
        },

        /**
         * Retrieve the current time as seen by cronTimer
         * @returns {Date} the current time, taking timezone and fudgefactor into account
         */
        getTime: function () {
            return new Date((Date.now() + (window.g.timezone * 60 * 1000)) + window.g.increaseTime);
        }
    };
})();
