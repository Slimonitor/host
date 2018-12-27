//const debug = require('debug')('slimonitor:sysinfo');
const si = require('systeminformation');

module.exports = {
    getCpuInfo: si.cpu,
    getAllInfo: () => {
        return new Promise((resolve, reject) => {
            Promise.all([si.mem(), si.currentLoad()]).then(values => {
                resolve({
                    mem: values[0],
                    load: values[1]
                });
            }).catch(reject);
        });
    }
};
