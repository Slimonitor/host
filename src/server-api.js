const si = require('./sysinfo.js');
const request = require('request-promise-native');
const config = require('../config.js');

let hostId = null;

module.exports = {
    /**
     * @returns Promise
     */
    registerOnServer: () => {
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
        });
    },

    sendMessages: (messagesToSend) => {
        const options = {
            method: 'POST',
            uri: config.server.address + '/host/data',
            body: {
                hostId: hostId,
                messages: messagesToSend
            },
            headers: {
                'Content-Type': 'application/json'
            },
            json: true // Automatically stringifies the body to JSON
        };

        return request(options);
    }
};
