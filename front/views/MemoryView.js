import React, { Component } from 'react';
import { connect } from 'react-redux';
import { MemoryInterface } from '/logic';
import { formatAddress } from '/util';
import './MemoryView.scss';

class MemoryView extends Component {
    constructor (props) {
        super(props);
        this.state = {
            size: null,
            editingAddr: null,
            bytesPerCol: 4,
            bytesPerRow: 4,
            colWidth: (20 * 4) + 3,
            colCount: 1,
            rowCount: 1,
            rowOff: 0,
            baseAddr: 0,
            memoryIntervalDur: 250,
            memoryRefreshCount: 0
        };

        this.handleResize = this.resized.bind(this);
        this.handleKeyUp = this.keyUp.bind(this);
        this.handleKeyDown = this.keyDown.bind(this);
        this.handleScrollMouseDown = this.scrollMouseDown.bind(this);
        this.handleMouseUp = this.mouseUp.bind(this);
        this.handleMouseMove = this.mouseMove.bind(this);
        this.handleScroll = this.scroll.bind(this);
        this.keyRepeatTimeout = null;

        this.scrollStartPos = null;
        this.scrollInterval = null;
        this.scrollIntervalTime = 0;
        this.scrollIntervalDur = -1;
        this.scrollNubOff = 0;
        this.scrollMult = 1;

        this.memoryInterval = null;
        this.memory = new MemoryInterface(props.process.handle);

        this.outerRef = null;
        this.scrollNubRef = null;
        this.setRef = r => {
            const update = !this.outerRef;
            this.outerRef = r;
            if (update) this.resized();
        };
        this.setScrollNubRef = r => {
            this.scrollNubRef = r;
            if (r) r.style.top = 'calc(50% - 25px)';
        };
    }

    componentDidMount () {
        this.bind();
    }

    componentWillUnmount () {
        this.unbind();
    }

    componentDidUpdate (prevProps) {
        if (prevProps.active && !this.props.active) this.unbind();
        else if (this.props.active && !prevProps.active) this.bind();
    }

    bind () {
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('wheel', this.handleScroll);
        this.memoryInterval = setInterval(() => {
            this.refreshData();
            this.setState({ memoryRefreshCount: this.state.memoryRefreshCount + 1 });
        }, this.state.memoryIntervalDur);
    }

    unbind () {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('wheel', this.handleScroll);
        if (this.memoryInterval) clearInterval(this.memoryInterval);
    }

    resized () {
        if (this.outerRef) {
            const rect = this.outerRef.getBoundingClientRect();
            const { size, colWidth, bytesPerCol, baseAddr } = this.state;
            if (!size || size.x != rect.width || size.y != rect.height) {
                let colCount = 1;
                let exceed = false;
                while (!exceed) {
                    const hexWidth = (colCount * colWidth) + 3;
                    const asciiWidth = colCount * bytesPerCol * 10;
                    exceed = hexWidth + asciiWidth >= rect.width + (this.state.bytesPerRow * 10);
                    colCount++;
                }
                colCount -= 2;

                const bytesPerRow = bytesPerCol * colCount;
                const rowCount = Math.floor(rect.height / 16);
                this.refreshData({ bytesPerRow, rowCount });
                this.setState({
                    size: { x: rect.width, y: rect.height },
                    colCount,
                    rowCount,
                    bytesPerRow
                });
                if (this.scrollNubRef) this.scrollNubRef.style.top = `${((rect.height / 2) - 25) + this.scrollNubOff}px`;
            }
        }
    }

    refreshData (args) {
        const { baseAddr, rowOff, bytesPerRow, rowCount } = this.state;
        const ibaseAddr = args && args.hasOwnProperty('baseAddr') ? args.baseAddr : baseAddr;
        const irowOff = args && args.hasOwnProperty('rowOff') ? args.rowOff : rowOff;
        const ibytesPerRow = args && args.hasOwnProperty('bytesPerRow') ? args.bytesPerRow : bytesPerRow;
        const irowCount = args && args.hasOwnProperty('rowCount') ? args.rowCount : rowCount;

        const start = ibaseAddr + (irowOff * ibytesPerRow);
        const end = start + (irowCount * ibytesPerRow);
        this.memory.setBufferRange(start, end);
    }

    keyDown (e) {
        if (this.keyRepeatTimeout) clearTimeout(this.keyRepeatTimeout);
        this.keyRepeatTimeout = setTimeout(() => { this.keyDown(e); }, 300);

        const { editingAddr, colCount } = this.state;
        // console.log(e.keyCode);
        switch (e.keyCode) {
            case 37: {
                // left
                if (editingAddr === null) return;
                this.selectAddr(editingAddr - 1);
                break;
            }
            case 38: {
                // up
                if (editingAddr === null) return;
                this.selectAddr(editingAddr - (colCount * 4));
                break;
            }
            case 39: {
                // right
                if (editingAddr === null) return;
                this.selectAddr(editingAddr + 1);
                break;
            }
            case 40: {
                // down
                if (editingAddr === null) return;
                this.selectAddr(editingAddr + (colCount * 4));
                break;
            }
        }
    }

    keyUp (e) {
        if (this.keyRepeatTimeout) clearTimeout(this.keyRepeatTimeout);
    }

    scrollMouseDown (e) {
        this.scrollStartPos = e.clientY;
        if (this.scrollInterval) clearInterval(this.scrollInterval);
        this.scrollInterval = setInterval(() => {
            this.scrollIntervalTime += 10;
            if (this.scrollIntervalTime > this.scrollIntervalDur) {
                this.scrollIntervalTime = 0;
                if (this.scrollIntervalDur >= 0) {
                    const scrollDir = this.scrollNubOff / Math.abs(this.scrollNubOff);
                    this.refreshData({ rowOff: this.state.rowOff + (scrollDir * this.scrollMult) });
                    this.setState({ rowOff: this.state.rowOff + (scrollDir * this.scrollMult) });
                }
            }
        }, 1);
    }

    mouseUp (e) {
        this.scrollStartPos = null;
        this.scrollIntervalTime = 0;
        this.scrollIntervalDur = -1;
        this.scrollNubOff = 0;
        this.scrollNubRef.style.top = 'calc(50% - 25px)';
        this.setState({ scrollNubOff: 0 });
        if (this.scrollInterval) clearInterval(this.scrollInterval);
    }

    mouseMove (e) {
        if (this.scrollStartPos) {
            let delta = this.scrollStartPos - e.clientY;
            const max = (this.state.size.y / 2) - 25;
            if (delta < -max) delta = -max;
            if (delta > max) delta = max;
            this.scrollNubOff = -delta;
            this.scrollNubRef.style.top = `${((this.state.size.y / 2) - 25) + this.scrollNubOff}px`;
            const scrollFrac = Math.abs(delta) / max;
            this.scrollIntervalDur = 500 - (scrollFrac * 500);
            this.scrollMult = Math.floor(scrollFrac * 10);
            if (this.scrollIntervalDur === 500) this.scrollIntervalDur = -1;
        }
    }

    scroll (e) {
        if (Math.abs(e.deltaY) === 0) return;
        const dir = e.deltaY / Math.abs(e.deltaY);
        this.refreshData({ rowOff: this.state.rowOff + dir });
        this.setState({ rowOff: this.state.rowOff + dir });
    }

    selectAddr (addr) {
        if (this.memory.at(addr) === null) return;
        const { rowCount, bytesPerRow, rowOff } = this.state;
        const addrRow = Math.floor(addr / bytesPerRow);
        const off = addrRow > rowOff ? (addrRow < rowOff + rowCount ? 0 : addrRow - ((rowOff + rowCount) - 1)) : addrRow - rowOff;
        if (off) this.refreshData({ rowOff: rowOff + off });
        this.setState({
            editingAddr: addr,
            rowOff: rowOff + off
        });
    }

    render () {
        const {
            size,
            editingAddr,
            colWidth,
            colCount,
            rowCount,
            rowOff,
            bytesPerRow,
            bytesPerCol,
            baseAddr,
            memoryIntervalDur
        } = this.state;

        const bytes = [];
        const lines = [];
        const ascii = [];

        for (let r = 0;r < rowCount;r++) {
            const rowAddr = ((r + rowOff) * bytesPerRow);
            lines.push((
                <span className='row-off' key={r}>{formatAddress(rowAddr, { fill: '00000000000000', mask: 0xFFFFFFFFFFFF })}</span>
            ));
            lines.push((
                <br key={`${r}b`}/>
            ));

            for (let c = 0;c < colCount;c++) {
                for (let b = 0;b < bytesPerCol;b++) {
                    const addr = ((r + rowOff) * bytesPerRow) + (c * bytesPerCol) + b;
                    let classes = 'byte';
                    let doBreak = false;
                    if (b === (bytesPerCol - 1)) {
                        if (c === colCount - 1) {
                            classes += ' byte--row-end';
                            doBreak = true;
                        }
                        classes += ' byte--col-end'
                    }
                    if (addr === editingAddr) classes += ' byte--cur';

                    const { val, changed } = this.memory.at(addr);
                    let text = '..';
                    if (val === null) classes += ' byte--empty';
                    else text = ('0' + (val & 0xFF).toString(16).toUpperCase()).slice(-2);
                    if (changed) classes += ' byte--changed';

                    bytes.push((
                        <span
                            className={classes}
                            style={{ animation: changed ? `hex-view__byte-changed ${memoryIntervalDur}ms linear infinite` : 'none'}}
                            key={addr}
                            onClick={() => this.selectAddr(addr)}
                        >
                            {text}
                        </span>
                    ));

                    ascii.push((
                        <span key={addr}>
                            {String.fromCharCode(val).replace(/[\x00-\x1F]/g, '.')}
                        </span>
                    ));

                    if (doBreak) {
                        bytes.push((
                            <br key={`${addr}b`}/>
                        ));
                        ascii.push((
                            <br key={`${addr}b`}/>
                        ));
                    }
                }
            }
        }

        return (
            <div className='hex-cont screen-view'>
                <div className='hex-lines'>
                    {lines}
                </div>
                <div
                    ref={this.setRef}
                    className='hex-view'
                >
                    {bytes}
                </div>
                <div
                    className='ascii-view'
                    style={{ minWidth: `${bytesPerRow * 10}px`, maxWidth: `${bytesPerRow * 10}px` }}
                >
                    {ascii}
                </div>
                <div className='hex-scroll'>
                    <div
                        className='hex-scroll__nub'
                        onMouseDown={this.handleScrollMouseDown}
                        onMouseUp={this.handleScrollMouseUp}
                        onMouseMove={this.handleScrollMouseMove}
                        ref={this.setScrollNubRef}
                    />
                </div>
            </div>
        );
    }
};


export default connect(
    (state) => ({
        active: state.app.tabIdx === 2,
        addressMode: state.app.addressMode
    }),
    (dispatch) => ({
    })
)(MemoryView);
