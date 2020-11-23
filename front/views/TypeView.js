import React, { Component } from 'react';
import { connect } from 'react-redux';
import './TypeView.scss';

class TypeView extends Component {
    constructor (props) {
        super(props);

        this.state = {
        };
    }

    render () {
        return (
            <div className='screen-view type-view'>
            </div>
        );
    }
};

export default connect(
    (state) => ({
    }),
    (dispatch) => ({
    })
)(TypeView);
