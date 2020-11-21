import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Comm from './comm';
import { Provider, connect } from 'react-redux';
import { redux } from './redux';
import './style';

import {
    NoProcessScreen,
    MainScreen
} from './screens';

class Main extends Component {
    constructor (props) {
        super(props);
    }

    render () {
        const { process } = this.props;
        return (
            <main>
                {process ? (<MainScreen process={process}/>) : (<NoProcessScreen/>)}
            </main>
        );
    }
};

const ConnectedMain = connect(
    (state) => ({
        process: state.process.info
    }),
    (dispatch) => ({
    })
)(Main);

class App extends Component {
    constructor (props) {
        super(props);
    }

    render () {
        const { app } = redux.state();
        return (
            <Provider store={redux.store}>
                <ConnectedMain/>
            </Provider>
        );
    }
};

ReactDOM.render(<App />, document.getElementById("root"));
