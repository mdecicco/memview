import { ipcRenderer } from 'electron';

class Comm {
    constructor () {
        this.reducers = {};
        ipcRenderer.on('action', (event, action) => {
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
        ipcRenderer.send('action', { type, data });
    }

    addReducer (type, reducer) {
        this.reducers[type] = reducer;
    }
};

let out = null;
if (global.state) out = global.state;
else {
    out = new Comm();
    global.state = out;
}

export default out;
