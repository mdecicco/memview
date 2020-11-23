import React, { Component } from 'react';
import { connect } from 'react-redux';
import './WatchView.scss';

class WatchView extends Component {
    constructor (props) {
        super(props);

        this.state = {
        };
    }

    render () {
        return (
            <div className='screen-view watch-view'>
            </div>
        );
    }
};

export default connect(
    (state) => ({
    }),
    (dispatch) => ({
    })
)(WatchView);
