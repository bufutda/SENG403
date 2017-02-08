(function () {
    "use strict";
    window.g = window.g ? window.g : {};
    var dateConstants = {};
    dateConstants.SECOND = 1000;
    dateConstants.MINUTE = 60 * dateConstants.SECOND;
    dateConstants.HOUR = 60 * dateConstants.MINUTE;
    dateConstants.DAY = 24 * dateConstants.HOUR;
    dateConstants.WEEK = 7 * dateConstants.DAY;
    window.g.timeVal = dateConstants;

    function increaseTime (timeToIncrease) {
        window.g.increaseTime += timeToIncrease;
    }

    function decreaseTime (timeToDecrease) {
        window.g.decreaseTime -= timeToDecrease;
    }

    window.g.addMinute = function () {
        increaseTime(dateConstants.MINUTE);
    };

    window.g.addHour = function () {
        increaseTime(dateConstants.HOUR);
    };

    window.g.addDay = function () {
        increaseTime(dateConstants.DAY);
    };

    window.g.addWeek = function () {
        increaseTime(dateConstants.WEEK);
    };

    window.g.subMinute = function () {
        decreaseTime(dateConstants.MINUTE);
    };

    window.g.subHour = function () {
        decreaseTime(dateConstants.HOUR);
    };

    window.g.subDay = function () {
        decreaseTime(dateConstants.DAY);
    };

    window.g.subWeek = function () {
        decreaseTime(dateConstants.WEEK);
    };
})();
