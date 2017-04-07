(function () {
    "use strict";

    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    window.g.settingsClick = function () {
        if (!window.g.settingsLock) {
            window.g.settingsLock = true;
            if (window.g.settingsVisible) {
                window.g.settingsVisible = false;
                document.getElementById("settingsButton").style.filter = "invert(75%)";
                document.getElementById("settings").style.opacity = 0;
                setTimeout(function () {
                    document.getElementById("settings").style.display = "none";
                    window.g.settingsLock = false;
                }, 1000);
            } else {
                window.g.settingsVisible = true;
                document.getElementById("settingsButton").style.filter = "invert(25%)";
                document.getElementById("settings").style.display = "block";
                setTimeout(function () {
                    setTimeout(function () {
                        window.g.settingsLock = false;
                    }, 1000);
                    document.getElementById("settings").style.opacity = 1;
                }, 100);
            }
        }
    };

    window.g.changeSetting = function (setting, f) {
        var elem = document.getElementById("setting_" + setting);
        if (elem.classList.contains("settingSwitchToggleActive")) {
            elem.classList.remove("settingSwitchToggleActive");
            elem.innerText = elem.getAttribute("inactivetext");
        } else {
            elem.classList.add("settingSwitchToggleActive");
            elem.innerText = elem.getAttribute("activetext");
        }
        if (!f) {
            window.g[setting] = !window.g[setting];
            window.g.sock.send("MODE " + window.g[setting]);
        }
    };
})();
