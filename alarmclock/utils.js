(function () {
    "use strict";

    // if this is the first file to declare window.g, do so
    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    /**
     * Change the timezone of the application
     * @param {int} tzo - the timezone offset in minutes from UTC
     * @returns {undefined}
     */
    window.g.changeTimezone = function (tzo) {
        window.g.timezone = tzo;
        if (window.g.sock.isOpen()) {
            window.g.sock.send("TZ " + tzo);
        }
    };

    /**
     * Convert a clockTime excerpt from 12-hour to 24-hour
     * @param {int} h - the 12-hour figure for hours
     * @param {bool} n - true for pm
     * @returns {int} the 24-hour representation of h and n
     */
    window.g.c12224 = function (h, n) {
        if (n) {
            return (h === 12) ? 12 : h + 12;
        }
        return (h === 12) ? 0 : h;
    };

    /**
     * Convert a 24-hour value to a clockTime excerpt in 12-hour format
     * @param {int} h - the 24-hour figure for hours
     * @returns {ClockTimeExcerpt} containing the 12-hour value and am or pm
     */
    window.g.c24212 = function (h) {
        if (h === 12) {
            return {h: 12, n: true};
        }
        if (h > 12) {
            return {h: h - 12, n: true};
        }
        if (h === 0) {
            return {h: 12, n: false};
        }
        return {h: h, n: false};
    };

    /**
     * Button handler for data visualization
     * @returns {undefined}
     */
    window.g.visualize = function () {
        // if the button is in the middle of a transition
        if (!window.g.visualizationTransitionLock) {
            // lock the button
            window.g.visualizationTransitionLock = true;

            // invert the visibility variable
            window.g.visualizationLock = !window.g.visualizationLock;

            var elem = document.getElementById("visualizationCanvas");
            // if the chart is hidden
            if (window.g.visualizationLock) {
                // grab new data
                console.log("Emptying chart...");
                document.getElementById("visualizationChart1").innerHTML = "";
                document.getElementById("visualizationChart2").innerHTML = "";
                window.g.sock.send("VDATA");

                // show the chart
                elem.style.display = "block";

                // set the button to be lighter, and when the animation is done release the lock
                document.getElementById("visualizeButton").style.filter = "invert(25%)";
                setTimeout(function () {
                    elem.style.opacity = 1;
                    setTimeout(function () {
                        window.g.visualizationTransitionLock = false;
                    }, 1000);
                }, 100);
            } else {
                // hide the visualization data
                elem.style.opacity = 0;
                // dim the button, and when the animation is done, release the lock
                document.getElementById("visualizeButton").style.filter = "invert(75%)";
                setTimeout(function () {
                    elem.style.display = "none";
                    window.g.visualizationTransitionLock = false;
                }, 1000);
            }
        }
    };
})();
