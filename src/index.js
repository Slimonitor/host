const debug = require('debug')('slimonitor:index');
const si = require('./sysinfo.js');
const messages = require('./messages.js');
const config = require('../config.js');
const serverApi = require('./server-api.js');

/*function formatBytes(bytes, decimals) {
    if(bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals <= 0 ? 0 : decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function printSysInfo(data) {
    debug('Memory: ', formatBytes(data.mem.used), ' / ', formatBytes(data.mem.total));
    debug('CPU: ', data.cpuInfo.cores, ' cores @ ', data.cpuInfo.speed, 'Ghz');
    for(var c = 0; c < data.cpuInfo.cores; ++c) {
        var cpu = data.load.cpus[c];
        debug('#', c, cpu.load, '% (Usr: ', cpu.load_user, '%, Sys: ', cpu.lod_system, '%, Irq: ', cpu.load_irq, '%)');
    }
}*/

function collectSystemInformation() {
    si.getAllInfo().then(data => {
        messages.pushMessage(messages.buildHostMessage(data));
        setTimeout(collectSystemInformation, config.updateInterval);
    }).catch(err => {
        debug('Can\'t fetch data: ', err);
    });
}

function transmitMessagesToServer() {
    if (!messages.hasMessages()) {
        setTimeout(transmitMessagesToServer, config.sendInterval);
        return;
    }
    const messagesToSend = messages.getMessagesToSend();
    serverApi.sendMessages(messagesToSend).then((response) => {
        if(response.error) {
            handleTransmitError(response.message);
        } else {
            debug('Sent', messagesToSend.length, 'messages to server:', response);
            messages.discardSentMessages();
            setTimeout(transmitMessagesToServer, config.sendInterval);
        }
    }).catch(handleTransmitError);
}

function handleTransmitError(err) {
    debug('Can\'t send update to server:', err);
    messages.returnSentMessagesToStack();
    setTimeout(transmitMessagesToServer, config.sendInterval);
}

serverApi.registerOnServer().then(hostId => {
    debug('Starting Slimonitor for host', config.host.name, 'registered as', hostId);
    collectSystemInformation();
    transmitMessagesToServer();
}).catch(err => {
    debug(err.toString());
    process.exit();
});
