import { ipcRenderer } from 'electron';

export default class MemoryInterface {
    constructor (processHandle) {
        this.processHandle = processHandle;
        this.data = null;
        this.lastData = null;
        this.range = null;
        this.lastRange = null;
    }

    setBufferRange (start, end) {
        this.lastRange = this.range;
        this.lastData = this.data;
        this.range = { start, end };
        this.data = ipcRenderer.sendSync('action', {
            type: 'memory.get',
            data: {
                handle: this.processHandle,
                range: this.range
            }
        });
    }

    at (addr) {
        if (!this.data || addr < this.data.start || addr >= this.data.end) return { val: null, changed: false };
        const val = this.data.buffer[addr - this.range.start];
        const lastValNotValid = !this.lastData || addr < this.lastData.start || addr >= this.lastData.end;
        return {
            val,
            changed: lastValNotValid ? false : this.lastData.buffer[addr - this.lastRange.start] !== val
        };
    }
};
