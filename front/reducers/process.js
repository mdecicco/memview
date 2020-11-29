import update from 'immutability-helper';
import Comm from '/comm';

export default function addReducers(redux, Namespaces, Actions) {
    redux.addReducer(Namespaces.PROCESS, Actions.PROCESS_OPENED, (state, action) => {
        console.log(action.process);
        setTimeout(() => {
            redux.dispatch({
                type: Actions.APP_PROCESS_OPENED,
                processId: action.process.th32ProcessID,
                baseAddress: action.process.modBaseAddr
            });
        }, 1);
        return update(state, {
            info: { $set: action.process }
        });
    });
    redux.addReducer(Namespaces.PROCESS, Actions.PROCESS_ERROR, (state, action) => {
        return update(state, {
            error: { $set: action.error }
        });
    });
    
    Comm.addReducer('process.error', error => {
        console.log(error);
        redux.dispatch({ type: Actions.PROCESS_ERROR, error });
    });
    
    Comm.addReducer('process.opened', process => {
        redux.dispatch({ type: Actions.PROCESS_OPENED, process });
    });
}
