import { ipcRenderer } from 'electron';

class Comm {
    constructor () {
        this.reducers = {};
        ipcRenderer.on('action', (event, action) => {
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
        ipcRenderer.send('action', { type, data });
    }

    addReducer (action, reducer) {
        this.reducers[action.type] = reducer;
    }
};

let out = null;
if (global.state) out = global.state;
else {
    out = new Comm();
    global.state = out;
}

export default out;
