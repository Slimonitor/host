const os = require("os");
const defaultHostname = os.hostname();

module.exports = {
    host: {
        name: 'Host',
        hostname: defaultHostname,
        description: 'My Host',
        cluster: 'Default'
    },
    server: {
        address: 'http://localhost:4080'
    },
    updateInterval: 1000,
    sendInterval: 60000
};
