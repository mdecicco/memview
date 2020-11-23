import React, { Component } from 'react';
import { connect } from 'react-redux';
import { redux, Actions } from '/redux';
import './MainScreen.scss';
import {
    SearchView,
    WatchView,
    MemoryView,
    ModuleView,
    TypeView,
    SettingsView
} from '/views';

class MainScreen extends Component {
    constructor (props) {
        super(props);
    }

    render () {
        const { process, tab, selectTab } = this.props;

        return (
            <div className='screen main-screen'>
                <header>
                    <h1>{process.szExeFile}</h1>
                    <nav>
                        <span className={tab === 0 ? 'active' : ''} onClick={() => selectTab(0)}>Search</span>
                        <span className={tab === 1 ? 'active' : ''} onClick={() => selectTab(1)}>Watch</span>
                        <span className={tab === 2 ? 'active' : ''} onClick={() => selectTab(2)}>Memory</span>
                        <span className={tab === 3 ? 'active' : ''} onClick={() => selectTab(3)}>Modules</span>
                        <span className={tab === 4 ? 'active' : ''} onClick={() => selectTab(4)}>Types</span>
                        <span className={tab === 5 ? 'active' : ''} onClick={() => selectTab(5)}>Settings</span>
                    </nav>
                </header>
                {tab !== 0 ? (null) : (<SearchView process={process}/>)}
                {tab !== 1 ? (null) : (<WatchView process={process}/>)}
                {tab !== 2 ? (null) : (<MemoryView process={process}/>)}
                {tab !== 3 ? (null) : (<ModuleView process={process}/>)}
                {tab !== 4 ? (null) : (<TypeView process={process}/>)}
                {tab !== 5 ? (null) : (<SettingsView process={process}/>)}
            </div>
        );
    }
};

export default connect(
    (state) => ({
        tab: state.app.tabIdx
    }),
    (dispatch) => ({
        selectTab: idx => { redux.dispatch({ type: Actions.APP_SELECT_TAB, idx }); }
    })
)(MainScreen);
