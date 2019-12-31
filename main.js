var totalSeconds = 0
var totalTimeString = ''

function sec2time(timeInSeconds) {
    var pad = function(num, size) { return ('000' + num).slice(size * -1); },
        time = parseFloat(timeInSeconds).toFixed(3),
        hours = Math.floor(time / 60 / 60),
        minutes = Math.floor(time / 60) % 60,
        seconds = Math.floor(time - minutes * 60);

    return hours + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
}

function parseVideosDuration(tabs) {
    tabs.forEach((tab, index)=>{
        browser.tabs.executeScript(tab.id, {
            code:
            `
                if (document.getElementsByClassName('ytp-time-duration')) {
                    var timeString = document.getElementsByClassName('ytp-time-duration')[0].innerHTML
                    if (timeString) browser.runtime.sendMessage({timeString: timeString});
                }
            `
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

  ctx.fillStyle = "#FFFFFF"
  ctx.font = "60px Arial";
  ctx.fillText(totalTimeString.split(':')[0] + 'h', (totalTimeString.split(':')[0] > 9 ? 0 : 15), 45)

  ctx.fillStyle = "#FFFFF"
  ctx.font = "80px Arial";
  ctx.fillText(totalTimeString.split(':')[1], 5, 98)

  return ctx.getImageData(0, 0, 100, 100);
}

browser.runtime.onMessage.addListener((request, sender, sendResponse)=>{
    const timeArray = request.timeString.split(':')
    switch(timeArray.length) {
        case 3:
            var hours = timeArray[0]
            var minutes = timeArray[1]
            var seconds = timeArray[2]
            break;
        case 2:
            var hours = 0
            var minutes = timeArray[0]
            var seconds = timeArray[1]
            break;
        default:
            var hours = 0
            var minutes = 0
            var seconds = timeArray[0]
            break;
    }
    totalSeconds += Number(seconds) + Number(minutes) * 60 + Number(hours) * 60 * 60
    totalTimeString = sec2time(totalSeconds)

    browser.tabs.query({url: "*://*.youtube.com/watch?*"}).then( tabs =>{
        tabs.forEach((tab, index)=>{
            if (index + 1 == tabs.length) updateVisuals()
        })
        sendResponse({response: "OK"});
    }, errorHandler);
})

function calculateTime() {
    totalSeconds = 0;
    totalTimeString = '';
    browser.browserAction.setIcon({path: 'icons/icon-empty-32.png'} );
    browser.browserAction.setTitle({title: 'YouTube Open Tabs Total Time'});
    browser.tabs.query({url: "*://*.youtube.com/watch?*"})
        .then(parseVideosDuration, errorHandler);
}

function updateVisuals() {
    browser.browserAction.setIcon({imageData: createIcon()});
    browser.browserAction.setTitle({
        title:
            (totalSeconds > 3600 ? totalTimeString.split(':')[0] + 'h ' : '')
            + totalTimeString.split(':')[1] + 'm '
            + (totalSeconds > 3600 ? '' : totalTimeString.split(':')[2] + 's ')
            + 'YouTube Open Tabs Total Time'
    })
}

browser.tabs.onUpdated.addListener(()=>{
    calculateTime()
}, { properties: ['title'] });

browser.tabs.onRemoved.addListener(()=>{
    calculateTime()
});
