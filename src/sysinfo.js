//const debug = require('debug')('slimonitor:sysinfo');
const si = require('systeminformation');

module.exports = {
    getAllInfo: () => {
        return new Promise((resolve, reject) => {
            Promise.all([si.cpu(), si.mem(), si.currentLoad()]).then(values => {
                resolve({
                    cpuInfo: values[0],
                    mem: values[1],
                    load: values[2]
                });
            }).catch(reject);
        });
    }
};
