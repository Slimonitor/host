const debug = require('debug')('slimonitor:index');
const si = require('./sysinfo.js');

//const config = require('../config.js');

function formatBytes(bytes, decimals) {
    if(bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals <= 0 ? 0 : decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function printSysInfo(data) {
    debug('Memory: ', formatBytes(data.mem.used), ' / ', formatBytes(data.mem.total));
    debug('CPU: ', data.cpuInfo.cores, ' cores @ ', data.cpuInfo.speed);
    for(var c = 0; c < data.cpuInfo.cores; ++c) {
        var cpu = data.load.cpus[c];
        debug('#', c, cpu.load, '% (Usr: ', cpu.load_user, '%, Sys: ', cpu.lod_system, '%, Irq: ', cpu.load_irq, '%)');
    }
}

function loopSysInfo() {
    si.getAllInfo().then((data) => {
        printSysInfo(data);
        setTimeout(loopSysInfo, 1000);
    }).catch((err) => {
        debug('Can\'t fetch data: ', err);
    });
}

setTimeout(loopSysInfo, 1000);
