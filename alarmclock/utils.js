(function () {
    "use strict";

    if (!window.hasOwnProperty("g")) {
        window.g = {};
    }

    window.g.changeTimezone = function (tzo) {
        window.g.timezone = tzo;
        if (window.g.sock.isOpen()) {
            window.g.sock.send("TZ " + tzo);
        }
    };

    window.g.c12224 = function (h, n) {
        if (n) {
            return (h === 12) ? 12 : h + 12;
        }
        return (h === 12) ? 0 : h;
    };

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

    window.g.visualize = function () {
        if (!window.g.visualizationTransitionLock) {
            window.g.visualizationTransitionLock = true;
            window.g.visualizationLock = !window.g.visualizationLock;
            var elem = document.getElementById("visualizationCanvas");
            if (window.g.visualizationLock) {
                console.log("Emptying chart...");
                document.getElementById("visualizationChart1").innerHTML = "";
                document.getElementById("visualizationChart2").innerHTML = "";
                window.g.sock.send("VDATA");
                elem.style.display = "block";
                document.getElementById("visualizeButton").style.filter = "invert(25%)";
                setTimeout(function () {
                    elem.style.opacity = 1;
                    setTimeout(function () {
                        window.g.visualizationTransitionLock = false;
                    }, 1000);
                }, 100);
            } else {
                elem.style.opacity = 0;
                document.getElementById("visualizeButton").style.filter = "invert(75%)";
                setTimeout(function () {
                    elem.style.display = "none";
                    window.g.visualizationTransitionLock = false;
                }, 1000);
            }
        }
    };
})();
