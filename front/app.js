import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Comm from './comm';
import { Provider } from 'react-redux';
import { redux } from './redux';


class App extends Component {
    constructor (props) {
        super(props);
    }

    test () {
        Comm.sendAction('action', 'test');
    }

    render () {
        return (
            <Provider store={redux.store}>
                <button onClick={this.test}>test</button>
            </Provider>
        );
    }
};

ReactDOM.render(<App />, document.getElementById("root"));
