import update from 'immutability-helper';
import Comm from '/comm';

export default function addReducers(redux, Namespaces, Actions) {
    redux.addReducer(Namespaces.APP, Actions.APP_SELECT_PROCESS, (state, action) => {
        Comm.send('process.open', action.processId);
        return state;
    });

    redux.addReducer(Namespaces.APP, Actions.APP_RECEIVED_PROCESSES, (state, action) => {
        return update(state, {
            processes: { $set: action.processes }
        });
    });

    redux.addReducer(Namespaces.APP, Actions.APP_PROCESS_OPENED, (state, action) => {
        return update(state, {
            processId: { $set: action.processId },
            goToAddress: { $set: action.baseAddress }
        });
    });

    redux.addReducer(Namespaces.APP, Actions.APP_SELECT_TAB, (state, action) => {
        return update(state, {
            tabIdx: { $set: action.idx }
        });
    });
    
    redux.addReducer(Namespaces.APP, Actions.APP_GO_TO_MEMORY, (state, action) => {
        return update(state, {
            tabIdx: { $set: 2 },
            goToAddress: { $set: action.address }
        });
    });

    Comm.addReducer('process.receive', processes => {
        redux.dispatch({ type: Actions.APP_RECEIVED_PROCESSES, processes });
    });
}
