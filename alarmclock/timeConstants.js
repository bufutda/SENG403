(function () {
    "use strict";

    // if this is the first file to define window.g, do so
    window.g = window.g ? window.g : {};

    // an object to hold all constants
    var dateConstants = {};

    // define time constants based on the definition of second
    dateConstants.SECOND = 1000;
    dateConstants.MINUTE = 60 * dateConstants.SECOND;
    dateConstants.HOUR = 60 * dateConstants.MINUTE;
    dateConstants.DAY = 24 * dateConstants.HOUR;
    dateConstants.WEEK = 7 * dateConstants.DAY;

    // expose constants to the application
    window.g.timeVal = dateConstants;

    /**
     * Increate the time fudge factor
     * @param {int} timeToIncrease - the number of milliseconds to increase the clock by
     * @returns {undefined}
     */
    function increaseTime (timeToIncrease) {
        window.g.increaseTime += timeToIncrease;
        window.g.sock.send("INCREASE " + window.g.increaseTime);
    }

    /**
     * Decrease the time fudge factor
     * @param {int} timeToDecrease - the number of milliseconds to decrease the clock by
     * @returns {undefined}
     */
    function decreaseTime (timeToDecrease) {
        window.g.increaseTime -= timeToDecrease;
        window.g.sock.send("INCREASE " + window.g.increaseTime);
    }

    /**
     * Add minutes to the clock
     * @param {int} n - number of minutes to increase the clock by
     * @returns {undefined}
     */
    window.g.addMinute = function (n) {
        increaseTime(dateConstants.MINUTE * (n ? n : 1));
    };

    /**
     * Add hours to the clock
     * @param {int} n - number of hours to increase the clock by
     * @returns {undefined}
     */
    window.g.addHour = function (n) {
        increaseTime(dateConstants.HOUR * (n ? n : 1));
    };

    /**
     * Add days to the clock
     * @param {int} n - number of days to increase the clock by
     * @returns {undefined}
     */
    window.g.addDay = function (n) {
        increaseTime(dateConstants.DAY * (n ? n : 1));
    };

    /**
     * Add weeks to the clock
     * @param {int} n - number of weeks to increase the clock by
     * @returns {undefined}
     */
    window.g.addWeek = function (n) {
        increaseTime(dateConstants.WEEK * (n ? n : 1));
    };

    /**
     * Subtract minutes from the clock
     * @param {int} n - number of minutes to decrease the clock by
     * @returns {undefined}
     */
    window.g.subMinute = function (n) {
        decreaseTime(dateConstants.MINUTE * (n ? n : 1));
    };

    /**
     * Subtract hours from the clock
     * @param {int} n - number of hours to decrease the clock by
     * @returns {undefined}
     */
    window.g.subHour = function (n) {
        decreaseTime(dateConstants.HOUR * (n ? n : 1));
    };

    /**
     * Subtract days from the clock
     * @param {int} n - number of days to decrease the clock by
     * @returns {undefined}
     */
    window.g.subDay = function (n) {
        decreaseTime(dateConstants.DAY * (n ? n : 1));
    };

    /**
     * Subtract weeks from the clock
     * @param {int} n - number of weeks to decrease the clock by
     * @returns {undefined}
     */
    window.g.subWeek = function (n) {
        decreaseTime(dateConstants.WEEK * (n ? n : 1));
    };
})();
