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

    window.g.cronTimer = {
        tmr: NaN,
        secondLatch: false,
        minuteLatch: -1,
        listeners: {},
        start: function () {
            if (isNaN(window.g.cronTimer.tmr)) {
                window.g.cronTimer.tmr = setInterval(window.g.cronTimer.secondHandler, 100);
            } else {
                console.warn("CRON already started.");
            }
        },
        stop: function () {
            if (isNaN(window.g.cronTimer.tmr)) {
                console.warn("CRON already stopped.");
            } else {
                clearInterval(window.g.cronTimer.tmr);
                window.g.cronTimer.tmr = NaN;
            }
        },
        secondHandler: function () {
            var time = window.g.cronTimer.getTime();
            var clockTime = {
                s: time.getUTCSeconds(),
                m: time.getUTCMinutes(),
                h: window.g.c24212(time.getUTCHours()).h,
                t: time.getUTCHours(),
                n: window.g.c24212(time.getUTCHours()).n,
                d: time.getUTCDay()
            };
            window.g.cronTimer.emit("tick", clockTime);
            window.g.updateBigClock(clockTime);
            if (time.getUTCSeconds() < 30 && !window.g.cronTimer.secondLatch) {
                window.g.cronTimer.emit("half");
                window.g.cronTimer.emit("minute", clockTime);
                window.g.cronTimer.secondLatch = true;
            }
            if (time.getUTCSeconds() >= 30 && window.g.cronTimer.secondLatch) {
                window.g.cronTimer.emit("half");
                window.g.cronTimer.secondLatch = false;
            }
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
        on: function (event, handler) {
            console.info("New listener on " + event, window.g.cronTimer.listeners.hasOwnProperty(event) ? window.g.cronTimer.listeners[event].length : 0);
            if (!window.g.cronTimer.listeners.hasOwnProperty(event)) {
                window.g.cronTimer.listeners[event] = [];
            }
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
        off: function (event, handler) {
            console.info("Removed listener on " + event);
            if (window.g.cronTimer.listeners.hasOwnProperty(event)) {
                var i = window.g.cronTimer.listeners[event].indexOf(handler);
                if (i > -1) {
                    window.g.cronTimer.listeners[event].splice(i, 1);
                } else {
                    console.warn("Cannot remove listener. Handler is not registered.", handler);
                }
            } else {
                console.warn("Cannot remove listener for non-existant event:", event);
            }
        },
        emit: function (event, arg) {
            if (event !== "tick") {
                console.info("[E] " + event);
            }
            if (!(arg instanceof Array)) {
                arg = [arg];
            }
            if (window.g.cronTimer.listeners.hasOwnProperty(event)) {
                for (var i = 0; i < window.g.cronTimer.listeners[event].length; i++) {
                    window.g.cronTimer.listeners[event][i].apply(window, arg);
                }
            } else {
                // console.warn("No listeners on emitted event:", event);
            }
        },
        getTime: function () {
            return new Date((Date.now() + (window.g.timezone * 60 * 1000)) + window.g.increaseTime);
        }
    };

    window.g.updateBigClock = function (clockTime) {
        if (window.g.displayMode) {
            if (window.g.displayMode !== window.g.displayLatch) {
                document.getElementById("analogClock").style.display = "none";
                document.getElementById("digitalClockWrapper").style.display = "block";
                window.g.displayLatch = window.g.displayMode;
            }
            var clock = document.getElementById("digitalClock");
            clock.innerText = (clockTime.h < 10 ? "0" : "") + clockTime.h + ":" +
                (clockTime.m < 10 ? "0" : "") + clockTime.m + ":" +
                (clockTime.s < 10 ? "0" : "") + clockTime.s;
            document.getElementById("digitalClockModifier").innerText = (clockTime.n ? "P" : "A") + "M";
        } else {
            if (window.g.displayMode !== window.g.displayLatch) {
                document.getElementById("digitalClockWrapper").style.display = "none";
                document.getElementById("analogClock").style.display = "block";
                window.g.displayLatch = window.g.displayMode;
            }
            window.g.rotateHand(document.getElementById("analogClock_hourHand").style, window.g.timeToDeg12(clockTime.h), "hourReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_minuteHand").style, window.g.timeToDeg60(clockTime.m), "minuteReachAroundLatch");
            window.g.rotateHand(document.getElementById("analogClock_secondHand").style, window.g.timeToDeg60(clockTime.s), "secondReachAroundLatch");
            document.getElementById("analogClockModifier").innerText = (clockTime.n ? "P" : "A") + "M";
        }
    };

    window.g.timeToDeg60 = function (numTime) {
        if (numTime > 60) {
            console.warn("[60] Invalid time", numTime);
            return;
        }
        return numTime * (360.0 / 60.0);
    };

    window.g.timeToDeg12 = function (numTime) {
        if (numTime > 12) {
            console.warn("[12] Invalid time", numTime);
            return;
        }
        return numTime * (360.0 / 12.0);
    };

    window.g.rotateHand = function (hand, deg, latch) {
        if (deg === 0) {
            if (!window.g[latch]) {
                window.g[latch] = true;
                hand.transition = "0s";
                setTimeout(function () {
                    hand.transform = "rotate(-6deg)";
                    setTimeout(function () {
                        hand.transition = "0.5s";
                        hand.transform = "rotate(0)";
                    }, 50);
                }, 50);
            }
        } else {
            if (window.g[latch]) {
                window.g[latch] = false;
            }
            hand.transform = "rotate(" + deg + "deg)";
        }
    };

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

    window.g.createAlarm = function () {
        if (!window.g.dialogProgressLock) {
            if (!window.g.createAlarmLock) {
                window.g.createAlarmLock = true;
                document.getElementById("newAlarm").innerHTML = "Cancel &otimes;";
                document.getElementById("newAlarm").style.filter = "sepia(100%)";
                window.g.showDialog("createAlarmDialog", function () {
                });
                document.getElementById("createButton").style.display = "block";
                setTimeout(function () {
                    document.getElementById("createButton").style.opacity = 1;
                }, 100);
            } else {
                if (window.g.editing) {
                    window.g.editing = false;
                }
                document.getElementById("newAlarm").innerHTML = "Create Alarm &oplus;";
                document.getElementById("newAlarm").style.filter = "";
                document.getElementById("createButton").style.opacity = 0;
                window.g.clearCreateDialog();
                window.g.hideDialog("createAlarmDialog", function () {
                    document.getElementById("createButton").style.display = "none";
                    window.g.createAlarmLock = false;
                });
            }
        }
    };

    window.g.showDialog = function (dialog, clbk) {
        if (window.g.dialogLock) {
            console.warn("Dialog already shown");
        } else {
            window.g.dialogLock = true;
            window.g.dialogProgressLock = true;
            document.getElementById("dialogWrapper").style.display = "block";
            document.getElementById(dialog).style.display = "block";
            setTimeout(function () {
                document.getElementById(dialog).style.opacity = 1;
                setTimeout(function () {
                    window.g.dialogProgressLock = false;
                    clbk();
                }, 1000);
            }, 100);
        }
    };

    window.g.hideDialog = function (dialog, clbk) {
        if (!window.g.dialogLock) {
            console.warn("Dialog already hidden");
        } else {
            window.g.dialogProgressLock = true;
            document.getElementById(dialog).style.opacity = 0;
            setTimeout(function () {
                document.getElementById("dialogWrapper").style.display = "none";
                document.getElementById(dialog).style.display = "none";
                window.g.dialogLock = false;
                window.g.dialogProgressLock = false;
                clbk();
            }, 1000);
        }
    };

    window.g.repeatCheck = function () {
        if (document.getElementById("checkInput_repeat").checked) {
            document.getElementById("repeatShadow").style.display = "none";
        } else {
            document.getElementById("repeatShadow").style.display = "block";
            document.getElementById("checkInput_sunday").checked = false;
            document.getElementById("checkInput_monday").checked = false;
            document.getElementById("checkInput_tuesday").checked = false;
            document.getElementById("checkInput_wednesday").checked = false;
            document.getElementById("checkInput_thursday").checked = false;
            document.getElementById("checkInput_friday").checked = false;
            document.getElementById("checkInput_saturday").checked = false;
        }
    };

    window.g.parseChronoParse = function (parsed) {
        if (parsed.hasOwnProperty("start") && parsed.start.knownValues.hasOwnProperty("hour")) {
            return {
                h: parsed.start.knownValues.hour,
                m: parsed.start.knownValues.minute ? parsed.start.knownValues.minute : 0,
                s: parsed.start.knownValues.second ? parsed.start.knownValues.second : 0,
                d: parsed.start.knownValues.weekday
            };
        }
        return {
            d: parsed.start.knownValues.weekday
        };
    };

    window.g.activateRepeat = function (repeatDay) {
        document.getElementById("checkInput_repeat").checked = true;
        window.g.repeatCheck();
        var day;
        switch (repeatDay) {
            case 0: day = "sunday"; break;
            case 1: day = "monday"; break;
            case 2: day = "tuesday"; break;
            case 3: day = "wednesday"; break;
            case 4: day = "thursday"; break;
            case 5: day = "friday"; break;
            case 6: day = "saturday"; break;
            default:
                console.warn("Bad day", repeatDay);
                break;
        }
        document.getElementById("checkInput_" + day).checked = true;
    };

    window.g.processTimeText = function () {
        var parseStuff = window.chrono.parse(document.getElementById("textInput_time").value);
        switch (parseStuff.length) {
            case 0:
                var elem = document.querySelector("#createAlarmDialog > div:first-child");
                elem.style["background-color"] = "#945353";
                setTimeout(function () {
                    elem.style.transition = "1s";
                    elem.style["background-color"] = "#606060";
                    setTimeout(function () {
                        elem.style.transition = "0s";
                    }, 1000);
                }, 100);
                break;
            case 1:
                var parsed = window.g.parseChronoParse(parseStuff[0]);
                if (!parsed.hasOwnProperty("h")) {
                    var elem = document.querySelector("#createAlarmDialog > div:first-child");
                    elem.style["background-color"] = "#945353";
                    setTimeout(function () {
                        elem.style.transition = "1s";
                        elem.style["background-color"] = "#606060";
                        setTimeout(function () {
                            elem.style.transition = "0s";
                        }, 1000);
                    }, 100);
                    return;
                }
                document.getElementById("checkInput_repeat").checked = false;
                window.g.repeatCheck();
                if (parsed.d) {
                    window.g.activateRepeat(parsed.d);
                }
                document.querySelector("#timeSelect_hour select").value = window.g.c24212(parsed.h).h.toString();
                document.querySelector("#timeSelect_minute select").value = parsed.m.toString();
                document.querySelector("#timeSelect_second select").value = parsed.s.toString();
                document.querySelector("#timeSelect_modifier select").value = window.g.c24212(parsed.h).n ? "pm" : "am";
                break;
            default:
                var timeFlag = false;
                var time;
                var repeatDates = [];
                for (var i = 0; i < parseStuff.length; i++) {
                    var parsed = window.g.parseChronoParse(parseStuff[i]);
                    console.log(parsed);
                    if (!parsed.hasOwnProperty("h")) {
                        if (parsed.d) {
                            repeatDates.push(parsed.d);
                        }
                    } else {
                        if (parsed.d) {
                            repeatDates.push(parsed.d);
                        }
                        if (!timeFlag) {
                            timeFlag = true;
                            time = parsed;
                        } else {
                            var elem = document.querySelector("#createAlarmDialog > div:first-child");
                            elem.style["background-color"] = "#945353";
                            setTimeout(function () {
                                elem.style.transition = "1s";
                                elem.style["background-color"] = "#606060";
                                setTimeout(function () {
                                    elem.style.transition = "0s";
                                }, 1000);
                            }, 100);
                            return;
                        }
                    }
                }
                if (timeFlag) {
                    document.querySelector("#timeSelect_hour select").value = window.g.c24212(time.h).h.toString();
                    document.querySelector("#timeSelect_minute select").value = time.m.toString();
                    document.querySelector("#timeSelect_second select").value = time.s.toString();
                    document.querySelector("#timeSelect_modifier select").value = window.g.c24212(time.h).n ? "pm" : "am";
                    document.getElementById("checkInput_repeat").checked = false;
                    window.g.repeatCheck();
                    if (repeatDates.length) {
                        for (var i = 0; i < repeatDates.length; i++) {
                            window.g.activateRepeat(repeatDates[i]);
                        }
                    }
                } else {
                    var elem = document.querySelector("#createAlarmDialog > div:first-child");
                    elem.style["background-color"] = "#945353";
                    setTimeout(function () {
                        elem.style.transition = "1s";
                        elem.style["background-color"] = "#606060";
                        setTimeout(function () {
                            elem.style.transition = "0s";
                        }, 1000);
                    }, 100);
                    return;
                }
                break;
        }
    };

    window.g.clearCreateDialog = function () {
        document.getElementById("checkInput_repeat").checked = false;
        window.g.repeatCheck();
        document.querySelector("#timeSelect_hour select").value = "0";
        document.querySelector("#timeSelect_minute select").value = "0";
        document.querySelector("#timeSelect_second select").value = "0";
        document.querySelector("#timeSelect_modifier select").value = "am";
        document.querySelector("#musicSelect select").value = "/alarmclock/tones/boobalee.ogg";
        document.getElementById("textInput_time").value = "";
    };

    window.g.confirmCreateAlarm = function () {
        if (window.g.editing) {
            window.g.editing = false;
            window.g.alarms[window.g.editIndex].deleteHandler();
        }
        var alarmElem = document.createElement("div");
        alarmElem.classList.add("alarmListElement");
        document.getElementById("alarmList").appendChild(alarmElem);
        window.g.alarms.push(new window.g.Alarm({
            h: parseInt(document.querySelector("#timeSelect_hour select").value, 10),
            m: parseInt(document.querySelector("#timeSelect_minute select").value, 10),
            s: parseInt(document.querySelector("#timeSelect_second select").value, 10),
            n: document.querySelector("#timeSelect_modifier select").value === "pm"
        }, {
            enable: document.getElementById("checkInput_repeat").checked,
            days: {
                sun: document.getElementById("checkInput_sunday").checked,
                mon: document.getElementById("checkInput_monday").checked,
                tue: document.getElementById("checkInput_tuesday").checked,
                wed: document.getElementById("checkInput_wednesday").checked,
                thu: document.getElementById("checkInput_thursday").checked,
                fri: document.getElementById("checkInput_friday").checked,
                sat: document.getElementById("checkInput_saturday").checked
            }
        }, document.querySelector("#musicSelect select").value, alarmElem, window.g.alarms.length, Math.floor(Math.random() * 100000000).toString(16) + "-" + Math.floor(Math.random() * 100000000).toString(16), document.getElementById("textInput_label").value));
        window.g.uploadAlarms();
        window.g.createAlarm();
    };

    window.g.displayAlarm = function (msg, dismiss, snooze) {
        window.g.alarmRingCount++;
        if (!window.g.goingOff) {
            window.g.goingOff = true;
            document.getElementById("alarmShadow").style.display = "block";
            document.getElementById("alarmBox").style.display = "block";
        }

        var alarmBoxElement = document.createElement("div");
        alarmBoxElement.classList.add("alarmBoxElement");

        var alarmBoxDismiss = document.createElement("div");
        alarmBoxDismiss.classList.add("alarmBoxButton");
        alarmBoxDismiss.classList.add("alarmBoxDismiss");
        alarmBoxDismiss.innerText = "DISMISS";
        alarmBoxDismiss.addEventListener("click", dismissListener);
        alarmBoxElement.appendChild(alarmBoxDismiss);

        var alarmBoxSnooze = document.createElement("div");
        alarmBoxSnooze.classList.add("alarmBoxButton");
        alarmBoxSnooze.classList.add("alarmBoxSnooze");
        alarmBoxSnooze.innerText = "SNOOZE";
        alarmBoxSnooze.addEventListener("click", snoozeListener);
        alarmBoxElement.appendChild(alarmBoxSnooze);

        var alarmBoxMsg = document.createElement("div");
        alarmBoxMsg.classList.add("alarmBoxMsg");
        alarmBoxMsg.classList.add("centerY");
        alarmBoxMsg.innerText = msg;
        alarmBoxElement.appendChild(alarmBoxMsg);

        document.getElementById("alarmBox").appendChild(alarmBoxElement);

        function dismissListener () {
            alarmBoxDismiss.removeEventListener("click", dismissListener);
            alarmBoxSnooze.removeEventListener("click", snoozeListener);
            alarmBoxElement.remove();
            window.g.alarmRingCount--;
            if (window.g.alarmRingCount === 0) {
                document.getElementById("alarmShadow").style.display = "none";
                document.getElementById("alarmBox").style.display = "none";
                window.g.goingOff = false;
            }
            dismiss();
        }
        function snoozeListener () {
            alarmBoxDismiss.removeEventListener("click", dismissListener);
            alarmBoxSnooze.removeEventListener("click", snoozeListener);
            alarmBoxElement.remove();
            window.g.alarmRingCount--;
            if (window.g.alarmRingCount === 0) {
                document.getElementById("alarmShadow").style.display = "none";
                document.getElementById("alarmBox").style.display = "none";
                window.g.goingOff = false;
            }
            snooze();
        }
    };

    window.g.uploadAlarms = function () {
        var _toExport = [];
        for (var i = 0; i < window.g.alarms.length; i++) {
            _toExport.push(window.g.alarms[i].exportAlarm());
        }
        var toExport = {alarms: _toExport, tz: window.g.timezone};
        if (window.g.sock.isOpen()) {
            window.g.sock.send("POST " + JSON.stringify(toExport));
        } else {
            var request = new XMLHttpRequest();
            request.onload = function () {
                console.log("Request came back " + request.status);
                var data;
                try {
                    data = JSON.parse(request.responseText);
                } catch (e) {
                    console.error(e);
                    return;
                }
                switch (request.status) {
                    case 200:
                        console.log("Data was", data);
                        break;
                    default:
                        console.error("Bad code: " + request.status);
                        return;
                }
            };
            request.open("POST", "https://sa.watz.ky:6969", true);
            request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            request.send(JSON.stringify(toExport));
        }
    };

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

    window.g.pi = "141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173637178721468440901224953430146549585371050792279689258923542019956112129021960864034418159813629774771309960518707211349999998372978049951059731732816096318595024459455346908302642522308253344685035261931188171010003137838752886587533208381420617177669147303598253490428755468731159562863882353787593751957781857780532171226806613001927876611195909216420198938095257201065485863278865936153381827968230301952035301852968995773622599413891249721775283479131515574857242454150695950829533116861727855889075098381754637464939319255060400927701671139009848824012858361603563707660104710181942955596198946767837449448255379774726847104047534646208046684259069491293313677028989152104752162056966024058038150193511253382430035587640247496473263914199272604269922796782354781636009341721641219924586315030286182974555706749838505494588586926995690927210797509302955321165344987202755960236480665499119881834797753566369807426542527862551818417574672890977772793800081647060016145249192173217214772350141441973568548161361157352552133475741849468438523323907394143334547762416862518983569485562099219222184272550254256887671790494601653466804988627232791786085784383827967976681454100953883786360950680064225125205117392984896084128488626945604241965285022210661186306744278622039194945047123713786960956364371917287467764657573962413890865832645995813390478027590099465764078951269468398352595709825822620522489407726719478268482601476990902640136394437455305068203496252451749399651431429809190659250937221696461515709858387410597885959772975498930161753928468138268683868942774155991855925245953959431049972524680845987273644695848653836736222626099124608051243884390451244136549762780797715691435997700129616089441694868555848406353422072225828488648158456028506016842739452267467678895252138522549954666727823986456596116354886230577456498035593634568174324112515076069479451096596094025228879710893145669136867228748940560101503308617928680920874760917824938589009714909675985261365549781893129784821682998948722658804857564014270477555132379641451523746234364542858444795265867821051141354735739523113427166102135969536231442952484937187110145765403590279934403742007310578539062198387447808478489683321445713868751943506430218453191048481005370614680674919278191197939952061419663428754440643745123718192179998391015919561814675142691239748940907186494231961567945208095146550225231603881930142093762137855956638937787083039069792077346722182562599661501421503068038447734549202605414665925201497442850732518666002132434088190710486331734649651453905796268561005508106658796998163574736384052571459102897064140110971206280439039759515677157700420337869936007230558763176359421873125147120532928191826186125867321579198414848829164470609575270695722091756711672291098169091528017350671274858322287183520935396572512108357915136988209144421006751033467110314126711136990865851639831501970165151168517143765761835155650884909989859982387345528331635507647918535893226185489632132933089857064204675259070915481416549859461637180270981994309924488957571282890592323326097299712084433573265489382391193259746366730583604142813883032038249037589852437441702913276561809377344403070746921120191302033038019762110110044929321516084244485963766983895228684783123552658213144957685726243344189303968642624341077322697802807318915441101044682325271620105265227211166039666557309254711055785376346682065310989652691862056476931257058635662018558100729360659876486117910453348850346113657686753249441668039626579787718556084552965412665408530614344431858676975145661406800700237877659134401712749470420562230538994561314071127000407854733269939081454664645880797270826683063432858785698305235808933065757406795457163775254202114955761581400250126228594130216471550979259230990796547376125517656751357517829666454779174501129961489030463994713296210734043751895735961458901938971311179042978285647503203198691514028708085990480109412147221317947647772622414254854540332157185306142288137585043063321751829798662237172159160771669254748738986654949450114654062843366393790039769265672146385306736096571209180763832716641627488880078692560290228472104031721186082041900042296617119637792133757511495950156604963186294726547364252308177036751590673502350728354056704038674351362222477158915049530984448933309634087807693259939780541934144737744184263129860809988868741326047215695162396586457302163159819319516735381297416772947867242292465436680098067692823828068996400482435403701416314965897940924323789690706977942236250822168895738379862300159377647165122893578601588161755782973523344604281512627203734314653197777416031990665541876397929334419521541341899485444734567383162499341913181480927777103863877343177207545654532207770921201905166096280490926360197598828161332316663652861932668633606273567630354477628035045077723554710585954870279081435624014517180624643626794561275318134078330336254232783944975382437205835311477119926063813346776879695970309833913077109870408591337464144282277263465947047458784778720192771528073176790770715721344473060570073349243693113835049316312840425121925651798069411352801314701304781643788518529092854520116583934196562134914341595625865865570552690496520985803385072242648293972858478316305777756068887644624824685792603953527734803048029005876075825104747091643961362676044925627420420832085661190625454337213153595845068772460290161876679524061634252257719542916299193064553779914037340432875262888963995879475729174642635745525407909145135711136941091193932519107602082520261879853188770584297259167781314969900901921169717372784768472686084900337702424291651300500516832336435038951702989392233451722013812806965011784408745196012122859937162313017114448464090389064495444006198690754851602632750529834918740786680881833851022833450850486082503930213321971551843063545500766828294930413776552793975175461395398468339363830474611996653858153842056853386218672523340283087112328278921250771262946322956398989893582116745627010218356462201349671518819097303811980049734072396103685406643193950979019069963955245300545058068550195673022921913933918568034490398205955100226353536192041994745538593810234395544959778377902374216172711172364343543947822181852862408514006660443325888569867054315470696574745855033232334210730154594051655379068662733379958511562578432298827372319898757141595781119635833005940873068121602876496286744604774649159950549737425626901049037781986835938146574126804925648798556145372347867330390468838343634655379498641927056387293174872332083760112302991136793862708943879936201629515413371424892830722012690147546684765357616477379467520049075715552781965362132392640616013635815590742202020318727760527721900556148425551879253034351398442532234157623361064250639049750086562710953591946589751413103482276930624743536325691607815478181152843667957061108615331504452127473924544945423682886061340841486377670096120715124914043027253860764823634143346235189757664521641376796903149501910857598442391986291642193994907236234646844117394032659184044378051333894525742399508296591228508555821572503107125701266830240292952522011872676756220415420516184163484756516999811614101002996078386909291603028840026910414079288621507842451670908700069928212066041837180653556725253256753286129104248776182582976515795984703562226293486003415872298053498965022629174878820273420922224533985626476691490556284250391275771028402799806636582548892648802545661017296702664076559042909945681506526530537182941270336931378517860904070866711496558343434769338578171138645587367812301458768712660348913909562009939361031029161615288138437909904231747336394804575931493140529763475748119356709110137751721008031559024853090669203767192203322909433467685142214477379393751703443661991040337511173547191855046449026365512816228824462575916333039107225383742182140883508657391771509682887478265699599574490661758344137522397096834080053559849175417381883999446974867626551658276584835884531427756879002909517028352971634456212964043523117600665101241200659755851276178583829204197484423608007193045761893234922927965019875187212726750798125547095890455635792122103334669749923563025494780249011419521238281530911407907386025152274299581807247162591668545133312394804947079119153267343028244186041426363954800044800267049624820179289647669758318327131425170296923488962766844032326092752496035799646925650493681836090032380929345958897069536534940603402166544375589004563288225054525564056448246515187547119621844396582533754388569094113031509526179378002974120766514793942590298969594699556576121865619673378623625612521632086286922210327488921865436480229678070576561514463204692790682120738837781423356282360896320806822246801224826117718589638140918390367367222088832151375560037279839400415297002878307667094447456013455641725437090697939612257142989467154357846878861444581231459357198492252847160504922124247014121478057345510500801908699603302763478708108175450119307141223390866393833952942578690507643100638351983438934159613185434754649556978103829309716465143840700707360411237359984345225161050702705623526601276484830840761183013052793205427462865403603674532865105706587488225698157936789766974220575059683440869735020141020672358502007245225632651341055924019027421624843914035998953539459094407046912091409387001264560016237428802109276457931065792295524988727584610126483699989225695968815920560010165525637567856672279661988578279484885583439751874454551296563443480396642055798293680435220277098429423253302257634180703947699415979159453006975214829336655566156787364005366656416547321704390352132954352916941459904160875320186837937023488868947915107163785290234529244077365949563051007421087142613497459561513849871375704710178795731042296906667021449863746459528082436944578977233004876476524133907592043401963403911473202338071509522201068256342747164602433544005152126693249341967397704159568375355516673027390074972973635496453328886984406119649616277344951827369558822075735517665158985519098666539354948106887320685990754079234240230092590070173196036225475647894064754834664776041146323390565134330684495397907090302346046147096169688688501408347040546074295869913829668246818571031887906528703665083243197440477185567893482308943106828702722809736248093996270607472645539925399442808113736943388729406307926159599546262462970706259484556903471197299640908941805953439325123623550813494900436427852713831591256898929519642728757394691427253436694153236100453730488198551706594121735246258954873016760029886592578662856124966552353382942878542534048308330701653722856355915253478445981831341129001999205981352205117336585640782648494276441137639386692480311836445369858917544264739988228462184490087776977631279572267265556259628254276531830013407092233436577916012809317940171859859993384923549564005709955856113498025249906698423301735035804408116855265311709957089942732870925848789443646005041089226691783525870785951298344172953519537885534573742608590290817651557803905946408735061232261120093731080485485263572282576820341605048466277504500312620080079980492548534694146977516493270950493463938243222718851597405470214828971117779237612257887347718819682546298126868581705074027255026332904497627789442362167411918626943965067151577958675648239939176042601763387045499017614364120469218237076488783419689686118155815873606293860381017121585527266830082383404656475880405138080163363887421637140643549556186896411228214075330265510042410489678352858829024367090488711819090949453314421828766181031007354770549815968077200947469613436092861484941785017180779306810854690009445899527942439813921350558642219648349151263901280383200109773868066287792397180146134324457264009737425700735921003154150893679300816998053652027600727749674584002836240534603726341655425902760183484030681138185510597970566400750942608788573579603732451414678670368809880609716425849759513806930944940151542222194329130217391253835591503100333032511174915696917450271494331515588540392216409722910112903552181576282328318234254832611191280092825256190205263016391147724733148573910777587442538761174657867116941477642144111126358355387136101102326798775641024682403226483464176636980663785768134920453022408197278564719839630878154322116691224641591177673225326433568614618654522268126887268445968442416107854016768142080885028005414361314623082102594173756238994207571362751674573189189456283525704413354375857534269869947254703165661399199968262824727064133622217892390317608542894373393561889165125042440400895271983787386480584726895462438823437517885201439560057104811949884239060613695734231559079670346149143447886360410318235073650277859089757827273130504889398900992391350337325085598265586708924261242947367019390772713070686917092646254842324074855036608013604668951184009366860954632500214585293095000090715105823626729326453738210493872499669933942468551648326113414611068026744663733437534076429402668297386522093570162638464852851490362932019919968828517183953669134522244470804592396602817156551565666111359823112250628905854914509715755390024393153519090210711945730024388017661503527086260253788179751947806101371500448991721002220133501310601639154158957803711779277522597874289191791552241718958536168059474123419339842021874564925644346239253195313510331147639491199507285843065836193536932969928983791494193940608572486396883690326556436421664425760791471086998431573374964883529276932822076294728238153740996154559879825989109371712621828302584811238901196822142945766758071865380650648702613389282299497257453033283896381843944770779402284359883410035838542389735424395647555684095224844554139239410001620769363684677641301781965937997155746854194633489374843912974239143365936041003523437770658886778113949861647874714079326385873862473288964564359877466763847946650407411182565837887845485814896296127399841344272608606187245545236064315371011274680977870446409475828034876975894832824123929296058294861919667091895808983320121031843034012849511620353428014412761728583024355983003204202451207287253558119584014918096925339507577840006746552603144616705082768277222353419110263416315714740612385042584598841990761128725805911393568960143166828317632356732541707342081733223046298799280490851409479036887868789493054695570307261900950207643349335910602454508645362893545686295853131533718386826561786227363716975774183023986006591481616404944965011732131389574706208847480236537103115089842799275442685327797431139514357417221975979935968525228574526379628961269157235798662057340837576687388426640599099350500081337543245463596750484423528487470144354541957625847356421619813407346854111766883118654489377697956651727966232671481033864391375186594673002443450054499539974237232871249483470604406347160632583064982979551010954183623503030945309733583446283947630477564501500850757894954893139394489921612552559770143685894358587752637962559708167764380012543650237141278346792610199558522471722017772370041780841942394872540680155603599839054898572354674564239058585021671903139526294455439131663134530893906204678438778505423939052473136201294769187497519101147231528932677253391814660730008902776896311481090220972452075916729700785058071718638105496797310016787085069420709223290807038326345345203802786099055690013413718236837099194951648960075504934126787643674638490206396401976668559233565463913836318574569814719621084108096188460545603903845534372914144651347494078488442377217515433426030669883176833100113310869042193903108014378433415137092435301367763108491351615642269847507430329716746964066653152703532546711266752246055119958183196376370761799191920357958200759560530234626775794393630746305690108011494271410093913691381072581378135789400559950018354251184172136055727522103526803735726527922417373605751127887218190844900617801388971077082293100279766593583875890939568814856026322439372656247277603789081445883785501970284377936240782505270487581647032458129087839523245323789602984166922548964971560698119218658492677040395648127810217991321741630581055459880130048456299765112124153637451500563507012781592671424134210330156616535602473380784302865525722275304999883701534879300806260180962381516136690334111138653851091936739383522934588832255088706450753947395204396807906708680644509698654880168287434378612645381583428075306184548590379821799459968115441974253634439960290251001588827216474500682070419376158454712318346007262933955054823955713725684023226821301247679452264482091023564775272308208106351889915269288910845557112660396503439789627825001611015323516051965590421184494990778999200732947690586857787872098290135295661397888486050978608595701773129815531495168146717695976099421003618355913877781769845875810446628399880600616229848616935337386578773598336161338413385368421197893890018529569196780455448285848370117096721253533875862158231013310387766827211572694951817958975469399264219791552338576623167627547570354699414892904130186386119439196283887054367774322427680913236544948536676800000106526248547305586159899914017076983854831887501429389089950685453076511680333732226517566220752695179144225280816517166776672793035485154204023817460892328391703275425750867655117859395002793389592057668278967764453184040418554010435134838953120132637836928358082719378312654961745997056745071833206503455664403449045362756001125018433560736122276594927839370647842645676338818807565612168960504161139039063960162022153684941092605387688714837989559999112099164646441191856827700457424343402167227644558933012778158686952506949936461017568506016714535431581480105458860564550133203758645485840324029871709348091055621167154684847780394475697980426318099175642280987399876697323769573701580806822904599212366168902596273043067931653114940176473769387351409336183321614280214976339918983548487562529875242387307755955595546519639440182184099841248982623673771467226061633643296406335728107078875816404381485018841143188598827694490119321296827158884133869434682859006664080631407775772570563072940049294030242049841656547973670548558044586572022763784046682337985282710578431975354179501134727362577408021347682604502285157979579764746702284099956160156910890384582450267926594205550395879229818526480070683765041836562094555434613513415257006597488191634135955671964965403218727160264859304903978748958906612725079482827693895352175362185079629778514618843271922322381015874445052866523802253284389137527384589238442253547265309817157844783421582232702069028723233005386216347988509469547200479523112015043293226628272763217790884008786148022147537657810581970222630971749507212724847947816957296142365859578209083073323356034846531873029302665964501371837542889755797144992465403868179921389346924474198509733462679332107268687076806263991936196504409954216762784091466985692571507431574079380532392523947755744159184582156251819215523370960748332923492103451462643744980559610330799414534778457469999212859999939961228161521931488876938802228108300198601654941654261696858678837260958774567618250727599295089318052187292461086763995891614585505839727420980909781729323930106766386824040111304024700735085782872462713494636853181546969046696869392547251941399291465242385776255004748529547681479546700705034799958886769501612497228204030399546327883069597624936151010243655535223069061294938859901573466102371223547891129254769617600504797492806072126803922691102777226102544149221576504508120677173571202718024296810620377657883716690910941807448781404907551782038565390991047759414132154328440625030180275716965082096427348414695726397884256008453121406593580904127113592004197598513625479616063228873618136737324450607924411763997597461938358457491598809766744709300654634242346063423747466608043170126005205592849369594143408146852981505394717890045183575515412522359059068726487863575254191128887737176637486027660634960353679470269232297186832771739323619200777452212624751869833495151019864269887847171939664976907082521742336566272592844062043021411371992278526998469884770232382384005565551788908766136013047709843861168705231055314916251728373272867600724817298763756981633541507460883866364069347043720668865127568826614973078865701568501691864748854167915459650723428773069985371390430026653078398776385032381821553559732353068604301067576083890862704984188859513809103042359578249514398859011318583584066747237029714978508414585308578133915627076035639076394731145549583226694570249413983163433237897595568085683629725386791327505554252449194358912840504522695381217913191451350099384631177401797151228378546011603595540286440590249646693070776905548102885020808580087811577381719174177601733073855475800605601433774329901272867725304318251975791679296996504146070664571258883469797964293162296552016879730003564630457930884032748077181155533090988702550520768046303460865816539487695196004408482065967379473168086415645650530049881616490578831154345485052660069823093157776500378070466126470602145750579327096204782561524714591896522360839664562410519551052235723973951288181640597859142791481654263289200428160913693777372229998332708208296995573772737566761552711392258805520189887620114168005468736558063347160373429170390798639652296131280178267971728982293607028806908776866059325274637840539769184808204102194471971386925608416245112398062011318454124478205011079876071715568315407886543904121087303240201068534194723047666672174986986854707678120512473679247919315085644477537985379973223445612278584329684664751333657369238720146472367942787004250325558992688434959287612400755875694641370562514001179713316620715371543600687647731867558714878398908107429530941060596944315847753970094398839491443235366853920994687964506653398573888786614762944341401049888993160051207678103588611660202961193639682134960750111649832785635316145168457695687109002999769841263266502347716728657378579085746646077228341540311441529418804782543876177079043000156698677679576090996693607559496515273634981189641304331166277471233881740603731743970540670310967676574869535878967003192586625941051053358438465602339179674926784476370847497833365557900738419147319886271352595462518160434225372996286326749682405806029642114638643686422472488728343417044157348248183330164056695966886676956349141632842641497453334999948000266998758881593507357815195889900539512085351035726137364034367534714104836017546488300407846416745216737190483109676711344349481926268111073994825060739495073503169019731852119552635632584339099822498624067031076831844660729124874754031617969941139738776589986855417031884778867592902607004321266617919223520938227878880988633599116081923535557046463491132085918979613279131975649097600013996234445535014346426860464495862476909434704829329414041114654092398834443515913320107739441118407410768498106634724104823935827401944935665161088463125678529776973468430306146241803585293315973458303845541033701091676776374276210213701354854450926307190114731848574923318167207213727935567952844392548156091372812840633303937356242001604566455741458816605216660873874804724339121295587776390696903707882852775389405246075849623157436917113176134783882719416860662572103685132156647800147675231039357860689611125996028183930954870905907386135191459181951029732787557104972901148717189718004696169777001791391961379141716270701895846921434369676292745910994006008498356842520191559370370101104974733949387788598941743303178534870760322198297057975119144051099423588303454635349234982688362404332726741554030161950568065418093940998202060999414021689090070821330723089662119775530665918814119157783627292746156185710372172471009521423696483086410259288745799932237495519122195190342445230753513380685680735446499512720317448719540397610730806026990625807602029273145525207807991418429063884437349968145827337207266391767020118300464819000241308350884658415214899127610651374153943565721139032857491876909441370209051703148777346165287984823533829726013611098451484182380812054099612527458088109948697221612852489742555551607637167505489617301680961380381191436114399210638005083214098760459930932485102516829446726066613815174571255975495358023998314698220361338082849935670557552471290274539776214049318201465800802156653606776550878380430413431059180460680083459113664083488740800574127258670479225831912741573908091438313845642415094084913391809684025116399193685322555733896695374902662092326131885589158083245557194845387562878612885900410600607374650140262782402734696252821717494158233174923968353013617865367376064216677813773995100658952887742766263684183068019080460984980946976366733566228291513235278880615776827815958866918023894033307644191240341202231636857786035727694154177882643523813190502808701857504704631293335375728538660588890458311145077394293520199432197117164223500564404297989208159430716701985746927384865383343614579463417592257389858800169801475742054299580124295810545651083104629728293758416116253256251657249807849209989799062003593650993472158296517413579849104711166079158743698654122234834188772292944633517865385673196255985202607294767407261676714557364981210567771689348491766077170527718760119990814411305864557791052568430481144026193840232247093924980293355073184589035539713308844617410795916251171486487446861124760542867343670904667846867027409188101424971114965781772427934707021668829561087779440504843752844337510882826477197854000650970403302186255614733211777117441335028160884035178145254196432030957601869464908868154528562134698835544456024955666843660292219512483091060537720198021831010327041783866544718126039719068846237085751808003532704718565949947612424811099928867915896904956394762460842406593094862150769031498702067353384834955083636601784877106080980426924713241000946401437360326564518456679245666955100150229833079849607994988249706172367449361226222961790814311414660941234159359309585407913908720832273354957208075716517187659944985693795623875551617575438091780528029464200447215396280746360211329425591600257073562812638733106005891065245708024474937543184149401482119996276453106800663118382376163966318093144467129861552759820145141027560068929750246304017351489194576360789352855505317331416457050499644389093630843874484783961684051845273288403234520247056851646571647713932377551729479512613239822960239454857975458651745878771331813875295980941217422730035229650808917770506825924882232215493804837145478164721397682096332050830564792048208592047549985732038887639160199524091893894557676874973085695595801065952650303626615975066222508406742889826590751063756356996821151094966974458054728869363102036782325018232370845979011154847208761821247781326633041207621658731297081123075815982124863980721240786887811450165582513617890307086087019897588980745664395515741536319319198107057533663373803827215279884935039748001589051942087971130805123393322190346624991716915094854140187106035460379464337900589095772118080446574396280618671786101715674096766208029576657705129120990794430463289294730615951043090222143937184956063405618934251305726829146578329334052463502892917547087256484260034962961165413823007731332729830500160256724014185152041890701154288579920812198449315699905918201181973350012618772803681248199587707020753240636125931343859554254778196114293516356122349666152261473539967405158499860355295332924575238881013620234762466905581643896786309762736550472434864307121849437348530060638764456627218666170123812771562137974614986132874411771455244470899714452288566294244023018479120";

    window.g.generateProblem = function (cb) {
        while (true) {
            var index = Math.floor(Math.random() * window.g.pi.length - 10);
            window.g.expectedAnswer = window.g.pi.substr(index, 10);
            console.log("Expected answer: " + window.g.expectedAnswer);
            var answer = prompt("Enter 10 digits of pi, starting at " + index, "");
            if (answer === window.g.expectedAnswer) {
                break;
            }
        }
        cb();
    };
})();
