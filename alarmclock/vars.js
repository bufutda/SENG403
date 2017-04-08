(function () {
    "use strict";

    // if this is the first file to declare window.g, do so
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    // analog or digital
    window.g.displayMode = null;

    // display state change latch
    window.g.displayLatch = null;

    // latches for detecting and handling the wraparound graphical defect
    window.g.secondReachAroundLatch = false;
    window.g.minuteReachAroundLatch = false;
    window.g.hourReachAroundLatch = false;

    // whether or not the settings menu is visible
    window.g.settingsVisible = false;

    // animation locks
    window.g.settingsLock = false;
    window.g.createAlarmLock = false;
    window.g.dialogLock = false;
    window.g.dialogProgressLock = false;
    window.g.visualizationLock = false;
    window.g.visualizationTransitionLock = false;

    // all alarm objects
    window.g.alarms = [];

    // alarms are currently ringing
    window.g.goingOff = false;

    // how many alarms are currently ringing
    window.g.alarmRingCount = 0;

    // snooze time (ms)
    window.g.snoozeAmount = 30000;

    // clock tiem fudge factor
    window.g.increaseTime = 0;

    // timezone offset in mins from UTC
    window.g.timezone = -1 * (new Date().getTimezoneOffset());

    // alarm is currently being edited
    window.g.editing = false;

    // index of the alarm being edited
    window.g.editIndex = null;
})();
