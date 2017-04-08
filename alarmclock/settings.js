(function () {
    "use strict";

    // if this is the first file to defined window.g, do so
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    /**
     * Handler for when the settings button is clicked
     * @returns {undefined}
     */
    window.g.settingsClick = function () {
        // if the setting dialog is in the middle of an animation
        if (!window.g.settingsLock) {
            // disable the button
            window.g.settingsLock = true;

            // if we are hiding the menu, set the button styling to it's original state
            if (window.g.settingsVisible) {
                window.g.settingsVisible = false;
                document.getElementById("settingsButton").style.filter = "invert(75%)";
                document.getElementById("settings").style.opacity = 0;
                // in 1s, hide the dialog and re-enable the button
                setTimeout(function () {
                    document.getElementById("settings").style.display = "none";
                    window.g.settingsLock = false;
                }, 1000);
            } else {
                // set the button to look bright
                window.g.settingsVisible = true;
                document.getElementById("settingsButton").style.filter = "invert(25%)";

                // show the menu and when the animation is done, unlock the button
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

    /**
     * Method to change a generic setting
     * @param {string} setting - the setting to change, identifiable by the DOMElement id containing the new value
     * @param {bool} f - if true, do a faux-setting update (do not send it to the server or actually use the new value)
     * @returns {undefined}
     */
    window.g.changeSetting = function (setting, f) {
        // get the setting DOMElement
        var elem = document.getElementById("setting_" + setting);
        // if it's active, make it inactive. Otherwise, make it active
        if (elem.classList.contains("settingSwitchToggleActive")) {
            elem.classList.remove("settingSwitchToggleActive");
            elem.innerText = elem.getAttribute("inactivetext");
        } else {
            elem.classList.add("settingSwitchToggleActive");
            elem.innerText = elem.getAttribute("activetext");
        }
        // send the new setting to the server and apply it to the application
        if (!f) {
            window.g[setting] = !window.g[setting];
            window.g.sock.send("MODE " + window.g[setting]);
        }
    };
})();
