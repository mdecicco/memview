import React, { Component } from 'react';
import { connect } from 'react-redux';
import Comm from '/comm';
import { redux, Actions } from '/redux';
import './NoProcessScreen.scss'

import {
    SearchList
} from '/components';

class NoProcessScreen extends Component {
    constructor (props) {
        super(props);
    }

    componentDidMount () {
        Comm.send('process.list');
    }

    refresh () {
        Comm.send('process.list');
    }

    onSelect (item) {
        console.log(item.info);
        redux.dispatch({ type: Actions.APP_SELECT_PROCESS, processId: item.id });
    }

    render () {
        const { processes } = this.props;

        return (
            <div className='screen no-process-screen'>
                <h1>Select Process</h1>
                <SearchList
                    items={processes}
                    fields={['name']}
                    keyField='id'
                    nameField='name'
                    onSelect={this.onSelect}
                    listItemRender={({ item }) => (
                        <div className='process-item'>
                            <span>{item.name}</span>
                            <span>PID: {item.id}</span>
                        </div>
                    )}
                />
                <div style={{ flexGrow: 1 }}/>
                <button style={{ marginTop: 5 }} onClick={this.refresh}>Refresh</button>
            </div>
        );
    }
};
export default connect(
    (state) => ({
        processes: state.app.processes
    }),
    (dispatch) => ({
    })
)(NoProcessScreen);
