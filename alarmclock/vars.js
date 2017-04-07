(function () {
    "use strict";
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }
    window.g.displayMode = null;
    window.g.displayLatch = null;
    window.g.secondReachAroundLatch = false;
    window.g.minuteReachAroundLatch = false;
    window.g.hourReachAroundLatch = false;
    window.g.settingsVisible = false;
    window.g.settingsLock = false;
    window.g.createAlarmLock = false;
    window.g.dialogLock = false;
    window.g.dialogProgressLock = false;
    window.g.alarms = [];
    window.g.goingOff = false;
    window.g.alarmRingCount = 0;
    window.g.snoozeAmount = 30000;
    window.g.increaseTime = 0;
    window.g.timezone = -1 * (new Date().getTimezoneOffset());
    window.g.editing = false;
    window.g.editIndex = null;
    window.g.visualizationLock = false;
    window.g.visualizationTransitionLock = false;
})();
