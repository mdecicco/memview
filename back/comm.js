const { ipcMain, ipcRenderer } = require('electron');

class Comm {
    constructor (window) {
        this.window = window;
        this.reducers = {};
        ipcMain.on('action', (event, action) => {
            if (!action.hasOwnProperty('type')) {
                console.warn(`Received value is not an action`);
                return;
            }
    
            if (!this.reducers.hasOwnProperty(action.type)) {
                console.warn(`Action type '${action.type}' has no reducer`, action.data);
            } else this.reducers[action.type](action.data, this, event);
        });
    }

    send (type, data) {
        this.window.webContents.send('action', { type, data });
    }

    addReducer (type, reducer) {
        this.reducers[type] = reducer;
    }
};

module.exports = function(window) {
    global.state = new Comm(window);
};
