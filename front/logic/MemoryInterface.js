import { ipcRenderer } from 'electron';

export default class MemoryInterface {
    constructor (processHandle) {
        this.processHandle = processHandle;
        this.buffer = null;
        this.range = {
            start: 0,
            end: 0
        };
        this.lastBuffer = null;
        this.lastRange = {
            start: 0,
            end: 0
        };
    }

    setBufferRange (start, end) {
        this.lastRange = this.range;
        this.lastBuffer = this.buffer;
        this.range = { start, end };
        this.buffer = ipcRenderer.sendSync('action', {
            type: 'memory.get',
            data: {
                handle: this.processHandle,
                range: this.range
            }
        });
    }

    at (addr) {
        if (!this.buffer || addr < this.range.start || addr >= this.range.end) return { val: null, changed: false };
        const val = this.buffer[addr - this.range.start];
        const lastValNotValid = !this.lastBuffer || addr < this.lastRange.start || addr >= this.lastRange.end;
        return {
            val,
            changed: lastValNotValid ? false : this.lastBuffer[addr - this.lastRange.start] !== val
        };
    }
};
