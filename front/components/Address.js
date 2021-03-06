import React, { Component } from 'react';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import './Address.scss';
import { formatAddress, copyData } from '/util';
import { redux, Actions } from '/redux';

export default class Address extends Component {
    constructor (props) {
        super(props);

        this.handleGoTo = this.goTo.bind(this);
        this.handleCopy = this.copy.bind(this);
    }

    goTo () {
        redux.dispatch({
            type: Actions.APP_GO_TO_MEMORY,
            address: this.props.value
        });
    }

    copy () {
        const { value, options } = this.props;
        copyData(formatAddress(value, options));
    }

    render () {
        const { value, options } = this.props;
        const { process } = redux.state();

        return [
            <ContextMenuTrigger key='1' id={`addr-${value}`}>
                <span className='address'>
                    {formatAddress(value, options)}
                </span>
            </ContextMenuTrigger>,
            <ContextMenu key='2' id={`addr-${value}`}>
                <MenuItem onClick={this.handleGoTo}>
                    Go to in memory view
                </MenuItem>
                <MenuItem onClick={this.handleCopy}>
                    Copy
                </MenuItem>
            </ContextMenu>
        ];
    }
};
