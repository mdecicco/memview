import React, { Component } from 'react';
import { connect } from 'react-redux';
import './SettingsView.scss';

class SettingsView extends Component {
    constructor (props) {
        super(props);

        this.state = {
        };
    }

    render () {
        return (
            <div className='screen-view settings-view'>
            </div>
        );
    }
};

export default connect(
    (state) => ({
    }),
    (dispatch) => ({
    })
)(SettingsView);
