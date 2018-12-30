const debug = require('debug')('slimonitor:messages');
const maxMessagesInBuffer = 1000; // TODO
const messageStack = [];
const messageTypes = {
    hostHealth: 'hostHealth'
};

var messagesPreparedToSend = 0;

module.exports = {
    hasMessages: () => {
        return messageStack.length > 0;
    },
    
    pushMessage: (message) => {
        messageStack.push(message);
    },

    buildHostMessage: (data) => {
        return {
            type: messageTypes.hostHealth,
            timestamp: Date.now(),
            data: data
        };
    },
    
    /**
     * We make a shallow copy of message stack and save amount of messages
     * prepared to sent. That way if our copy isn't sent right away and
     * some other code pushes new messages, we won't loose any messages on clear
     */
    getMessagesToSend: (maxMessages) => {
        if(messagesPreparedToSend != 0)
            throw 'Last sent messages weren\' discarded!';
        var limit = Math.min(maxMessages || messageStack.length, messageStack.length);
        if(limit == 0)
            return [];
        messagesPreparedToSend = limit;
        return messageStack.slice(0, limit);
    },
    
    discardSentMessages: () => {
        messageStack.splice(0, messagesPreparedToSend);
        messagesPreparedToSend = 0;
    },
    
    returnSentMessagesToStack: () => {
        messagesPreparedToSend = 0;
        if(messageStack.length > maxMessagesInBuffer) {
            debug('Too many messages stored in buffer, cleaning up',
                messageStack.length - maxMessagesInBuffer + 1, 'messages...');
            while (messageStack.length >= maxMessagesInBuffer) {
                messageStack.shift(); // remove old messages
            }
        }
    }
};
