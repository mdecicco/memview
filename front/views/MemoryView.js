import React, { Component } from 'react';
import { connect } from 'react-redux';
import { MemoryInterface } from '/logic';
import { formatAddress, parseAddress, formatSize } from '/util';
import './MemoryView.scss';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

import { Dialog, Input, Pattern, Validate } from '/components';
const GoToMode = {
    Relative: 0,
    Absolute: 1
};

class MemoryView extends Component {
    constructor (props) {
        super(props);
        this.state = {
            // view state
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
            memoryRefreshCount: 0,
            sizeEstablished: false,
            newBaseAddress: null,
            byteOffset: 0,
            hoveredByte: null,
            hoveringByte: false,
            
            // goto
            showGoToDialog: false,
            goToAddr: '',
            goToAddrValid: false,
            goToAddrMode: GoToMode.Relative
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

        this.screenRef = null;
        this.outerRef = null;
        this.scrollNubRef = null;
        this.setScreenRef = r => {
            this.screenRef = r;
        };
        this.setRef = r => {
            const update = !this.outerRef;
            this.outerRef = r;
            if (update && r) {
                this.resized();
            }
        };
        this.setScrollNubRef = r => {
            this.scrollNubRef = r;
            if (r) r.style.top = 'calc(50% - 25px)';
        };
        
        this.closeGoTo = () => {
            this.setState({ showGoToDialog: false });
        };
        this.changeGoTo = (v, valid) => {
            this.setState({ goToAddr: v, goToAddrValid: valid });
        };
        this.changeGoToMode = v => {
            this.setState({ goToAddrMode: v });
        };
        this.goTo = () => {
            if (!this.state.goToAddrValid) return;
            let addr = parseAddress(this.state.goToAddr);
            if (this.state.goToAddrMode === GoToMode.Relative) addr += this.state.baseAddr;
            this.setState({
                showGoToDialog: false,
                goToAddr: ''
            });
            this.selectAddr(addr);
        };
    }

    componentDidMount () {
        this.bind();
        if (this.props.goTo) {
            this.setBaseAddress(this.props.goTo);
        }
    }

    componentWillUnmount () {
        this.setState({ sizeEstablished: false });
        this.unbind();
    }

    componentDidUpdate (prevProps, prevState) {
        if (prevProps.active && !this.props.active) {
            this.unbind();
            this.setState({ sizeEstablished: false });
        } else if (this.props.active && !prevProps.active) {
            this.bind();
        }
        
        if (prevProps.goTo !== this.props.goTo && this.props.goTo !== null) {
            this.setBaseAddress(this.props.goTo);
        }
        
        if (!prevState.sizeEstablished && this.state.sizeEstablished && this.state.newBaseAddress !== null) {
            this.selectAddr(this.state.newBaseAddress);
        }
        
        this.resized();
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
        this.outerRef = null;
        this.scrollNubRef = null;
    }

    resized () {
        if (this.outerRef) {
            const rect = this.outerRef.getBoundingClientRect();
            const {
                size,
                colWidth,
                bytesPerCol,
                baseAddr,
                newBaseAddress,
                rowOff,
                byteOffset,
                sizeEstablished
            } = this.state;
            
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
                const curAddr = this.state.newBaseAddress || (rowOff * this.state.bytesPerRow) + byteOffset;
                const changes = {
                    size: { x: rect.width, y: rect.height },
                    colCount,
                    rowCount,
                    bytesPerRow,
                    sizeEstablished: true
                };
                
                const newRowOff = Math.floor(curAddr / bytesPerRow);
                changes.rowOff = newRowOff;
                changes.byteOffset = curAddr - (newRowOff * bytesPerRow);
                
                this.refreshData(changes);
                this.setState(changes);
                if (this.scrollNubRef) this.scrollNubRef.style.top = `${((rect.height / 2) - 25) + this.scrollNubOff}px`;
            }
        }
    }

    refreshData (args) {
        const { rowOff, bytesPerRow, rowCount, byteOffset } = this.state;
        const irowOff = args && args.hasOwnProperty('rowOff') ? args.rowOff : rowOff;
        const ibytesPerRow = args && args.hasOwnProperty('bytesPerRow') ? args.bytesPerRow : bytesPerRow;
        const irowCount = args && args.hasOwnProperty('rowCount') ? args.rowCount : rowCount;
        const ibyteOffset = args && args.hasOwnProperty('byteOffset') ? args.byteOffset : byteOffset;

        const start = (irowOff * ibytesPerRow) + ibyteOffset;
        const end = start + (irowCount * ibytesPerRow);
        this.memory.setBufferRange(start, end);
    }

    keyDown (e) {
        if (this.keyRepeatTimeout) clearTimeout(this.keyRepeatTimeout);
        this.keyRepeatTimeout = setTimeout(() => { this.keyDown(e); }, 300);

        const { editingAddr, colCount, showGoToDialog } = this.state;
        const editorFocused = !showGoToDialog;
        
        // console.log(e.keyCode);
        switch (e.keyCode) {
            case 37: {
                // left
                if (editingAddr === null || !editorFocused) return;
                this.selectAddr(editingAddr - 1);
                break;
            }
            case 38: {
                // up
                if (editingAddr === null || !editorFocused) return;
                this.selectAddr(editingAddr - (colCount * 4));
                break;
            }
            case 39: {
                // right
                if (editingAddr === null || !editorFocused) return;
                this.selectAddr(editingAddr + 1);
                break;
            }
            case 40: {
                // down
                if (editingAddr === null || !editorFocused) return;
                this.selectAddr(editingAddr + (colCount * 4));
                break;
            }
            case 71: {
                // g
                if (e.ctrlKey) {
                    this.setState({ showGoToDialog: true });
                }
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

    setBaseAddress (addr) {
        const cb = !this.state.sizeEstablished ? null : () => {
            if (this.state.sizeEstablished) {
                this.selectAddr(addr);
            }
        };
        
        this.setState({ newBaseAddress: addr, byteOffset: 0 }, cb);
    }
    
    computeAddressSelectionChanges (addr, args) {
        if (this.memory.at(addr) === null) return this.state;
        const { rowCount, bytesPerRow, rowOff, baseAddr, newBaseAddress, byteOffset } = this.state;
        const irowCount = args && args.hasOwnProperty('rowCount') ? args.rowCount : rowCount;
        const ibytesPerRow = args && args.hasOwnProperty('bytesPerRow') ? args.bytesPerRow : bytesPerRow;
        const irowOff = args && args.hasOwnProperty('rowOff') ? args.rowOff : rowOff;
        const ibaseAddr = args && args.hasOwnProperty('baseAddr') ? args.baseAddr : baseAddr;
        const inewBaseAddress = args && args.hasOwnProperty('newBaseAddress') ? args.newBaseAddress : newBaseAddress;
        const ibyteOffset = args && args.hasOwnProperty('byteOffset') ? args.byteOffset : byteOffset;
        
        const addrRow = Math.floor((addr - ibyteOffset) / ibytesPerRow);
        let off = 0;
        if (addrRow > irowOff) {
            if (addrRow < irowOff + irowCount) off = 0;
            else off = addrRow - (irowOff + irowCount - 1);
        } else off = addrRow - irowOff;
        
        if (off > irowCount) off += (irowCount - 1);
        const newOffset = inewBaseAddress === null ? ibyteOffset : inewBaseAddress - ((irowOff + off) * ibytesPerRow);
        return {
            editingAddr: addr,
            rowOff: irowOff + off,
            baseAddr: inewBaseAddress === null ? ibaseAddr : inewBaseAddress,
            byteOffset: newOffset,
            newBaseAddress: null
        };
    }

    selectAddr (addr) {
        if (this.memory.at(addr) === null) return;
        this.setState(this.computeAddressSelectionChanges(addr));
    }

    byteMouseOver (addr) {
        this.setState({ hoveredByte: addr, hoveringByte: true });
    }

    byteMouseLeave (addr) {
        this.setState({ hoveringByte: false });
    }

    render () {
        const {
            // view state
            size,
            editingAddr,
            colWidth,
            colCount,
            rowCount,
            rowOff,
            bytesPerRow,
            bytesPerCol,
            baseAddr,
            byteOffset,
            memoryIntervalDur,
            hoveredByte,
            hoveringByte,
            
            // goto
            showGoToDialog,
            goToAddr,
            goToAddrValid,
            goToAddrMode
        } = this.state;
        const { addressMode } = this.props;

        const bytes = [];
        const lines = [];
        const ascii = [];
        
        const minAddr = ((rowOff * bytesPerRow) - baseAddr) + byteOffset;
        const maxAddr = ((((rowCount - 1) + rowOff) * bytesPerRow) - baseAddr) + byteOffset;
        const longestAddr = Math.abs(minAddr) < Math.abs(maxAddr) ? maxAddr : minAddr;
        const fill = formatAddress(longestAddr, { short: true, prefix: '', sign: false }).replace(/./g, '0');

        for (let r = 0;r < rowCount;r++) {
            const rowAddr = ((r + rowOff) * bytesPerRow) + byteOffset;
            lines.push((
                <span className='row-off' key={r}>{formatAddress(rowAddr - baseAddr, { fill, sign: baseAddr !== 0 })}</span>
            ));
            lines.push((
                <br key={`${r}b`}/>
            ));

            for (let c = 0;c < colCount;c++) {
                for (let b = 0;b < bytesPerCol;b++) {
                    const addr = (((r + rowOff) * bytesPerRow) + (c * bytesPerCol) + b) + byteOffset;
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
                            onMouseEnter={() => this.byteMouseOver(addr)}
                            onMouseLeave={() => this.byteMouseLeave(addr)}
                        >
                            {text}
                        </span>
                    ));

                    ascii.push((
                        <span
                            key={addr}
                            className={classes}
                            onClick={() => this.selectAddr(addr)}
                        >
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
            <div style={{ flexGrow: 1, flexDirection: 'column', display: 'flex', overflow: 'hidden' }}>
                <Dialog
                    open={showGoToDialog}
                    title='Test'
                    buttons={[
                        { label: 'Close' },
                        { label: 'Go', onClick: this.goTo, disabled: !goToAddrValid }
                    ]}
                    onEnterPress={goToAddrValid ? this.goTo : null}
                    onClose={this.closeGoTo}
                >
                    <Input
                        type='select'
                        title='Mode'
                        onChange={this.changeGoToMode}
                        value={goToAddrMode}
                        options={[
                            { value: GoToMode.Relative, text: 'Relative To Base' },
                            { value: GoToMode.Absolute, text: 'Absolute Offset' }
                        ]}
                    />
                    <Input
                        type='text'
                        title='Address'
                        autoFocus={true}
                        placeholder={`Address (${addressMode})`}
                        pattern={goToAddrMode === GoToMode.Relative ? Pattern.negHex : Pattern.hex}
                        validate={Validate.hex}
                        onChange={this.changeGoTo}
                        value={goToAddr}
                        realtime={true}
                    />
                </Dialog>
                <span style={{ color: '#ffa5008f', fontSize: '11px' }}>
                    <span style={{ marginRight: '5px' }}>Base: {formatAddress(baseAddr, { short: true, sign: false })}</span>
                    <span style={{ marginRight: '5px' }}>Cur: {formatAddress(editingAddr, { short: true, sign: false })}</span>
                    <span>Size: {formatSize(rowCount * bytesPerRow)}</span>
                </span>
                <div className='hex-cont screen-view' ref={this.setScreenRef}>
                    <div className='hex-lines'>
                        {lines}
                    </div>
                    <ContextMenuTrigger id='hex-view' disable={!hoveringByte}>
                        <div
                            ref={this.setRef}
                            className='hex-view'
                        >
                            {bytes}
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenu id='hex-view'>
                        <MenuItem onClick={() => { this.setBaseAddress(hoveredByte); }}>
                            Set As Base Address
                        </MenuItem>
                    </ContextMenu>
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
            </div>
        );
    }
};


export default connect(
    (state) => ({
        active: state.app.tabIdx === 2,
        addressMode: state.app.addressMode,
        goTo: state.app.goToAddress
    }),
    (dispatch) => ({
    })
)(MemoryView);
