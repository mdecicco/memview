const process = require('./process');
const memory = require('./memory');

module.exports = function () {
    process();
    memory();
};
