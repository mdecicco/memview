import React, { Component } from 'react';
import { connect } from 'react-redux';
import './SearchView.scss';

class SearchView extends Component {
    constructor (props) {
        super(props);

        this.state = {
        };
    }

    render () {
        return (
            <div className='screen-view search-view'>
            </div>
        );
    }
};

export default connect(
    (state) => ({
    }),
    (dispatch) => ({
    })
)(SearchView);
