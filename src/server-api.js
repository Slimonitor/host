const si = require('./sysinfo.js');
const request = require('request-promise-native');
const config = require('../config.js');

let hostId = null;
const commonOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    json: true
};

module.exports = {
    /**
     * @returns Promise
     */
    registerOnServer: () => {
        return si.getCpuInfo().then(cpuInfo => {
            const options = {
                ...commonOptions,
                uri: config.server.address + '/host/register',
                body: {
                    name: config.host.name,
                    cpuInfo: cpuInfo
                }
            };
            return request(options);
        }).then(response => {
            if (response.error) {
                throw new Error(response.message);
            }
            hostId = response.message;
            return hostId;
        });
    },

    sendMessages: (messagesToSend) => {
        const options = {
            ...commonOptions,
            uri: config.server.address + '/host/data',
            body: {
                hostId: hostId,
                messages: messagesToSend
            }
        };

        return request(options);
    }
};
