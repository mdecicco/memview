const memory = require('memoryjs');

module.exports = function () {
    state.addReducer('memory.get', (args, comm, e) => {
        const { handle, range } = args;
        console.log('read', args);
        e.returnValue = memory.readBuffer(handle, range.start, range.end - range.start);
    });
};
