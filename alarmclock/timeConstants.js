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
        window.g.sock.send("INCREASE " + window.g.increaseTime);
    }

    function decreaseTime (timeToDecrease) {
        window.g.increaseTime -= timeToDecrease;
        window.g.sock.send("INCREASE " + window.g.increaseTime);
    }

    window.g.addMinute = function (n) {
        increaseTime(dateConstants.MINUTE * (n ? n : 1));
    };

    window.g.addHour = function (n) {
        increaseTime(dateConstants.HOUR * (n ? n : 1));
    };

    window.g.addDay = function (n) {
        increaseTime(dateConstants.DAY * (n ? n : 1));
    };

    window.g.addWeek = function (n) {
        increaseTime(dateConstants.WEEK * (n ? n : 1));
    };

    window.g.subMinute = function (n) {
        decreaseTime(dateConstants.MINUTE * (n ? n : 1));
    };

    window.g.subHour = function (n) {
        decreaseTime(dateConstants.HOUR * (n ? n : 1));
    };

    window.g.subDay = function (n) {
        decreaseTime(dateConstants.DAY * (n ? n : 1));
    };

    window.g.subWeek = function (n) {
        decreaseTime(dateConstants.WEEK * (n ? n : 1));
    };
})();
