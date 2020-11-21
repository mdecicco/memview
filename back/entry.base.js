const { app, BrowserWindow } = require('electron');
const path = require('path');
const initComm = require('./comm');
const initActions = require('./actions');

module.exports = (html) => {
    app.on('ready', () => {
        const w = new BrowserWindow({
            height: 600,
            width: 800,
            webPreferences: {
                nodeIntegration: true
            }
        });

        w.setMenu(null);
        w.toggleDevTools();
        w.loadURL(html);
        initComm(w);
        initActions();
    });

    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });

    require('electron-reloader')(module, {
        debug: true,
        watchRenderer: true
    });
};
