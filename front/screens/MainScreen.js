import React, { Component } from 'react';
import { connect } from 'react-redux';
import Comm from '/comm';
import { MemoryInterface } from '/logic';
import { redux, Actions } from '/redux';
import './MainScreen.scss';

class HexView extends Component {
    constructor (props) {
        super(props);
        this.state = {
            size: null,
            editingIdx: null,
            bytesPerCol: 4,
            bytesPerRow: 4,
            colWidth: ((20 * 4) + 3) + 3,
            colCount: 1,
            rowCount: 1,
            rowOff: 0,
            baseAddr: 0,
            memoryIntervalDur: 500,
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
        this.memory = new MemoryInterface(props.handle);
        
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
    
    componentWillUnmount () {
        window.addEventListener('resize', null);
        window.addEventListener('keyup', null);
        window.addEventListener('keydown', null);
        window.addEventListener('mousemove', null);
        window.addEventListener('mouseup', null);
        window.addEventListener('wheel', null);
        if (this.memoryInterval) clearInterval(this.memoryInterval);
    }
    
    resized () {
        if (this.outerRef) {
            const rect = this.outerRef.getBoundingClientRect();
            const { size, colWidth, bytesPerCol } = this.state;
            if (!size || size.x != rect.width || size.y != rect.height) {
                const colCount = Math.floor((rect.width + 3) / colWidth);
                const bytesPerRow = bytesPerCol * colCount;
                const rowCount = Math.floor(rect.height / 17);
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
        
        const { editingIdx, colCount } = this.state;
        // console.log(e.keyCode);
        switch (e.keyCode) {
            case 37: {
                // left
                if (editingIdx === null || editingIdx === 0) return;
                this.setState({ editingIdx: editingIdx - 1 });
                break;
            }
            case 38: {
                // up
                if (editingIdx === null || (editingIdx - (colCount * 4)) < 0) return;
                this.setState({ editingIdx: editingIdx - (colCount * 4) });
                break;
            }
            case 39: {
                // right
                if (editingIdx === null || editingIdx + 1 >= this.data.length) return;
                this.setState({ editingIdx: editingIdx + 1 });
                break;
            }
            case 40: {
                // down
                if (editingIdx === null || (editingIdx + (colCount * 4)) >= this.data.length) return;
                this.setState({ editingIdx: editingIdx + (colCount * 4) });
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
        const dir = e.deltaY / Math.abs(e.deltaY);
        this.refreshData({ rowOff: this.state.rowOff + dir });
        this.setState({ rowOff: this.state.rowOff + dir });
    }
    
    byteClicked (idx) {
        if (idx < 0 || idx >= this.data.length) return;
        this.setState({ editingIdx: idx });
    }
    
    render () {
        const {
            size,
            editingIdx,
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
        for (let r = 0;r < rowCount;r++) {
            let rowAddr = ((r + rowOff) * bytesPerRow);
            const addrSign = rowAddr < 0 ? '-' : '+';
            rowAddr = Math.abs(rowAddr);
            const addrHex = ('00000000' + (rowAddr & 0xFFFFFFFF).toString(16).toUpperCase()).slice(-8);
            lines.push((
                <span className='row-off' key={r}>{`${addrSign}0x${addrHex}`}</span>
            ));
            
            for (let c = 0;c < colCount;c++) {
                for (let b = 0;b < bytesPerCol;b++) {
                    const addr = baseAddr + ((r + rowOff) * bytesPerRow) + (c * bytesPerCol) + b;
                    let classes = 'byte';
                    let doBreak = false;
                    if (b === (bytesPerCol - 1)) {
                        if (c === colCount - 1) {
                            classes += ' byte--row-end';
                            doBreak = true;
                        }
                        classes += ' byte--col-end'
                    }
                    if (addr === editingIdx) classes += ' byte--cur';
                    
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
                            onClick={() => this.byteClicked(addr)}
                        >
                            {text}
                        </span>
                    ));
                    
                    if (doBreak) {
                        bytes.push((
                            <br key={`${addr}b`}/>
                        ));
                    }
                }
            }
        }
        
        return (
            <div className='hex-cont'>
                <div className='hex-lines'>
                    {lines}
                </div>
                <div
                    ref={this.setRef}
                    className='hex-view'
                >
                    {bytes}
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

class MainScreen extends Component {
    constructor (props) {
        super(props);
    }
	
    render () {
        const { process } = this.props;
        
        return (
            <div className='page main-screen'>
                <h1>{'process.szExeFile'}</h1>
                <HexView handle={process.handle}/>
            </div>
        );
    }
};
export default connect(
    (state) => ({
    }),
    (dispatch) => ({
    })
)(MainScreen);
