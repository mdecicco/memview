const { ipcMain, ipcRenderer } = require('electron');

class Comm {
    constructor (window) {
        this.window = window;
        this.reducers = {};
        ipcMain.on('action', (event, action) => {
            this.onAction(action);
        });
    }

    onAction (action) {
        if (!action.hasOwnProperty('type')) {
            console.warn(`Received value is not an action`);
            return;
        }

        if (!this.reducers.hasOwnProperty(action.type)) {
            console.warn(`Action type '${action.type}' has no reducer`);
        } else this.reducers[action.type](this, action.data);
    }

    sendAction (type, data) {
        this.window.webContents.send('action', { type, data });
    }

    addReducer (action, reducer) {
        this.reducers[action.type] = reducer;
    }
};

module.exports = function(window) {
    global.state = new Comm(window);
};
