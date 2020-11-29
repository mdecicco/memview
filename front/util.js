import { redux } from './redux';

export function parseAddress (addr) {
    if (redux.state().app.addressMode === 'hex') return parseInt(addr, 16);
    return parseInt(addr, 10);
}

export function formatAddress (addr, options) {
    if (redux.state().app.addressMode === 'hex') {
        const fill = options && options.fill ? options.fill : '00000000';
        const prefix = options && options.prefix !== undefined ? options.prefix : '0x';
        const sign = options && options.sign !== undefined ? options.sign : true;
        const short = options && options.short !== undefined ? options.short : false;
        if (sign) {
            const addrSign = addr < 0 ? '-' : '+';
            if (short) return addrSign + prefix + Math.abs(addr).toString(16).toUpperCase();
            return addrSign + prefix + (fill + Math.abs(addr).toString(16).toUpperCase()).slice(-fill.length);
        }
        if (short) return prefix + Math.abs(addr).toString(16).toUpperCase();
        return prefix + (fill + Math.abs(addr).toString(16).toUpperCase()).slice(-fill.length);
    }

    const fill = options && options.fill ? options.fill : '00000000';
    return (fill + addr).toString().slice(-fill.length);
}

export function formatSize (size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let sz = size;
    let unit = 0;
    while (sz >= 1024) {
        sz /= 1024;
        unit++;
    }
    return `${sz.toFixed(2)} ${units[unit]}`;
}

export function copyData (data, cb) {
    navigator.permissions.query({name: "clipboard-write"}).then(result => {
        if (result.state === 'granted' || result.state === 'prompt') {
            navigator.clipboard.writeText(data).then(function() {
                if (cb) cb(true, 0);
            }, function() {
                console.error('Failed to copy data to the clipboard');
                if (cb) cb(false, 1);
            });
        } else {
            if (cb) cb(false, 2);
            console.error('Permission to copy to clipboard denied');
        }
    });
}
