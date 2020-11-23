import React, { Component } from 'react';
import { connect } from 'react-redux';
import { formatAddress, formatSize } from '/util';
import './ModuleView.scss';

import { List, Address } from '/components';

const ModuleListItem = (process, selected) => props => {
    const { item } = props;
    const base = formatAddress(item.modBaseAddr, { sign: false, short: true });
    let range = `${base} (${formatSize(item.modBaseSize)})`;
    const classes = ['module'];
    if (process.szExeFile === item.szModule) classes.push('main');
    if (item.szModule === selected.szModule) classes.push('selected');
    return (
        <div className={classes.join(' ')}>
            <span className='name'>{item.szModule}</span>
            <span className='range'>{range}</span>
        </div>
    );
}

class ModuleView extends Component {
    constructor (props) {
        super(props);

        this.state = {
            selected: props.process.modules.find(m => m.szModule === props.process.szExeFile)
        };

        this.handleModuleSelect = this.selectModule.bind(this);
    }

    selectModule (selected) {
        this.setState({ selected });
    }

    render () {
        const { selected } = this.state;
        const { process } = this.props;
        const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
        const modules = process.modules.sort((a, b) => {
            if (a.szModule === process.szExeFile) return -1;
            if (b.szModule === process.szExeFile) return 1;
            return collator.compare(a.szModule, b.szModule)
        });
        return (
            <div className='screen-view module-view'>
                <List
                    items={process.modules}
                    keyField='szModule'
                    outerClass='module-list'
                    listItemRender={ModuleListItem(process, selected)}
                    onSelect={this.handleModuleSelect}
                />
                <div className='module-view__info'>
                    <h2>{selected.szModule}</h2>
                    <div className='info-row'>
                        <span>Base Address</span>
                        <Address value={selected.modBaseAddr} options={{ sign: false, short: true }}/>
                    </div>
                    <div className='info-row'>
                        <span>End Address</span>
                        <Address value={selected.modBaseAddr + selected.modBaseSize} options={{ sign: false, short: true }}/>
                    </div>
                    <div className='info-row'>
                        <span>Size</span>
                        <span>{formatSize(selected.modBaseSize)}</span>
                    </div>
                </div>
            </div>
        );
    }
};

export default connect(
    (state) => ({
        addressMode: state.app.addressMode
    }),
    (dispatch) => ({
    })
)(ModuleView);
