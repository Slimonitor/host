const debug = require('debug')('slimonitor:index');
const si = require('./sysinfo.js');
const request = require('request-promise-native');

const config = require('../config.js');

const maxMessagesInBuffer = 1000; // TODO
const messageStack = [];
const messageTypes = {
    hostHealth: 'hostHealth'
};
let hostId = null;

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

function saveMessageInStack(message) {
    messageStack.push(message);
}

function buildMessageStructure(data) {
    return {
        type: messageTypes.hostHealth,
        timestamp: Date.now(),
        data: data
    };
}

function collectSystemInformation() {
    si.getAllInfo().then(data => {
        saveMessageInStack(buildMessageStructure(data));
        setTimeout(collectSystemInformation, config.updateInterval);
    }).catch(err => {
        debug('Can\'t fetch data: ', err);
    });
}

function transmitMessagesToServer() {
    if (messageStack.length === 0) {
        setTimeout(transmitMessagesToServer, config.sendInterval);
        return;
    }
    const options = {
        method: 'POST',
        uri: config.server.address + '/host/data',
        body: {
            hostId: hostId,
            messages: messageStack
        },
        headers: {
            'Content-Type': 'application/json'
        },
        json: true // Automatically stringifies the body to JSON
    };
     
    request(options).then((response) => {
        if (response.error) {
            handleTransmitError(response.message);
        } else {
            debug('Sent', messageStack.length, 'messages to server:');
            debug(response);
            messageStack.length = 0; // TODO It probably can race-condition and loose some saved data?
            setTimeout(transmitMessagesToServer, config.sendInterval);
        }
    }).catch(handleTransmitError);
}

function handleTransmitError(err) {
    debug('Can\'t send update to server:', err);
    if (messageStack.length >= maxMessagesInBuffer) {
        debug('Too many messages stored in buffer, cleaning up',
            messageStack.length - maxMessagesInBuffer + 1, 'messages...');
        while (messageStack.length >= maxMessagesInBuffer) {
            messageStack.shift(); // remove old messages
        }
    }
    setTimeout(transmitMessagesToServer, config.sendInterval);
}

/**
 * @returns Promise
 */
function registerOnServer() {
    return si.getCpuInfo().then(cpuInfo => {
        const options = {
            method: 'POST',
            uri: config.server.address + '/host/register',
            body: {
                name: config.host.name,
                cpuInfo: cpuInfo
            },
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        };
        return request(options);
    }).then(response => {
        if (response.error) {
            throw new Error(response.message);
        }
        hostId = response.message;
        return hostId;
    }).catch(err => {
        debug(err.toString());
        process.exit();
    });

}

registerOnServer().then(hostId => {
    debug('Starting Slimonitor for host', config.host.name, 'registered as', hostId);
    collectSystemInformation();
    transmitMessagesToServer();
});
