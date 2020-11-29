const memory = require('memoryjs');

function formatSize (size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let sz = size;
    let unit = 0;
    while (sz >= 1024) {
        sz /= 1024;
        unit++;
    }
    return `${sz.toFixed(2)} ${units[unit]}`;
}

module.exports = function () {
    state.addReducer('memory.get', (args, comm, e) => {
        const { handle, range } = args;
        // console.log(`read 0x${range.start.toString(16).toUpperCase()} to 0x${range.end.toString(16).toUpperCase()} (${formatSize(range.end - range.start)})`);
        e.returnValue = memory.readBuffer(handle, range.start, range.end - range.start);
    });
};
