var totalSeconds = 0;
var totalTimeString = "";

function sec2time(timeInSeconds) {
    var pad = function(num, size) {
            return ("000" + num).slice(size * -1);
        },
        time = parseFloat(timeInSeconds).toFixed(3),
        hours = Math.floor(time / 60 / 60),
        minutes = Math.floor(time / 60) % 60,
        seconds = Math.floor(time - minutes * 60);

    return hours + ":" + pad(minutes, 2) + ":" + pad(seconds, 2);
}

function parseVideosDuration(tabs) {
    tabs.forEach((tab, index) => {
        chrome.tabs.executeScript(tab.id, {
            code: `
                if (document.getElementsByClassName('ytp-time-duration')) {
                    var totalTimeString = document.getElementsByClassName('ytp-time-duration')[0].innerHTML
                    var watchedTimeString = document.getElementsByClassName('ytp-time-current')[0].innerHTML
                    if (totalTimeString && watchedTimeString) chrome.runtime.sendMessage({
                        totalTimeString: totalTimeString,
                        watchedTimeString: watchedTimeString
                    });
                }
            `,
        });
    });
}

function errorHandler(error) {
    console.log(`Error: ${error}`);
}

function createIcon() {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0, 0, 100, 100);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "60px Arial";
    if (totalTimeString) {
        ctx.fillText(
            totalTimeString.split(":")[0] + "h",
            totalTimeString.split(":")[0] > 9 ? 0 : 15,
            45
        );
    }

    ctx.fillStyle = "#FFFFF";
    ctx.font = "80px Arial";
    if (totalTimeString) {
        ctx.fillText(totalTimeString.split(":")[1], 5, 98);
    }

    return ctx.getImageData(0, 0, 100, 100);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const totalTimeArray = request.totalTimeString.split(":");
    const watchedTimeString = request.watchedTimeString.split(":");
    switch (totalTimeArray.length) {
        case 3:
            var hours = totalTimeArray[0] - watchedTimeString[0];
            var minutes = totalTimeArray[1] - watchedTimeString[1];
            var seconds = totalTimeArray[2] - watchedTimeString[2];
            break;
        case 2:
            var hours = 0;
            var minutes = totalTimeArray[0] - watchedTimeString[0];
            var seconds = totalTimeArray[1] - watchedTimeString[1];
            break;
        default:
            var hours = 0;
            var minutes = 0;
            var seconds = totalTimeArray[0] - watchedTimeString[0];
            break;
    }
    totalSeconds +=
        Number(seconds) + Number(minutes) * 60 + Number(hours) * 60 * 60;
    totalTimeString = sec2time(totalSeconds);

    chrome.tabs.query({ url: "*://*.youtube.com/watch?*" }, (tabs) => {
        tabs.forEach((tab, index) => {
            if (index + 1 == tabs.length) updateVisuals();
        });
        sendResponse({ response: "OK" });
    });
});

function calculateTime() {
    totalSeconds = 0;
    totalTimeString = "";
    chrome.browserAction.setIcon({ path: "icons/icon-empty-32.png" });
    chrome.browserAction.setTitle({ title: "YouTube Open Tabs Total Time" });
    chrome.tabs.query({ url: "*://*.youtube.com/watch?*" }, (tabs) => {
        parseVideosDuration(tabs);
    });
}

function updateVisuals() {
    chrome.browserAction.setIcon({ imageData: createIcon() });
    chrome.browserAction.setTitle({
        title:
            (totalSeconds > 3600 ? totalTimeString.split(":")[0] + "h " : "") +
            totalTimeString.split(":")[1] +
            "m " +
            (totalSeconds > 3600 ? "" : totalTimeString.split(":")[2] + "s ") +
            "YouTube Open Tabs Total Time",
    });
}

chrome.browserAction.setIcon({ imageData: createIcon() });
chrome.browserAction.onClicked.addListener(() => {
    calculateTime();
});

chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {
        if (changeInfo.status !== "complete") return;
        if (tab.url.includes("youtube.com/watch?")) calculateTime();
    },
    { urls: ["*://*.youtube.com/watch?*"] }
);

chrome.tabs.onRemoved.addListener(() => {
    calculateTime();
});
