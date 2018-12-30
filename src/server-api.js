const request = require('request-promise-native');

module.exports = (config) => {
    return {
        sendMessages: (messagesToSend) => {
            const options = {
                method: 'POST',
                uri: config.server.address + '/host/data',
                body: {
                    host: config.host.name,
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
};
