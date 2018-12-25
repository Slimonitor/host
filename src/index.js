const debug = require('debug')('index');

(() => {
    debug({
        ...{a: 'babel'},
        b: 'works'
    });
})();
