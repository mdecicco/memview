import { createStore, combineReducers } from 'redux';
import update from 'immutability-helper';

import defaultState from '/default';

import { default as _Namespaces } from '/namespaces';
import { default as _Actions } from '/actions';
import addReducers from '/reducers';

class ReduxManager {
    constructor () {
        this.reducers = {};
        this.currentState = defaultState;
        this.rehydrateCallbacks = [];
        this.store = null;
        this.initialize();
    }

    addReducer (namespace, actionType, reducer) {
        if (this.reducers[actionType]) {
            //console.warn(`Attempted to add a reducer for an action type (${actionType}) which already has a reducer`);
            return;
        }
        this.reducers[actionType] = {
            namespace,
            reducer
        };
    }

    addStateLoadedCallback (cb) {
        this.rehydrateCallbacks.push(cb);
    }

    reduce (state, action) {
        if (!this.reducers[action.type]) {
            const exclude = ['@@redux'];

            if(!exclude.some(a => action.type.includes(a))) console.error(`No reducer exists for action type ${action.type}`);
            else this.currentState = state || defaultState;

            this.populateNewDefaultState();
            return this.currentState;
        }

        const namespace = this.reducers[action.type].namespace;
        const reducer = this.reducers[action.type].reducer;

        if (namespace === '' || !namespace) {
            const changes = { };
            const newState = reducer(state, action);
            for (let prop in newState) {
                if (state.hasOwnProperty(prop)) changes[prop] = { $set: newState[prop] };
                else {
                    console.warn('Reducer attempting to add new property to global state', {
                        action,
                        reducer,
                        changes,
                        property: prop,
                        reducerResult: newState
                    });
                }
            }
            this.currentState = update(state, changes);
            this.populateNewDefaultState();
            return this.currentState;
        }
        this.currentState = update(state, { [namespace]: { $merge: reducer(state[namespace], action) } });

        this.populateNewDefaultState();
        return this.currentState;
    }

    populateNewDefaultState () {
        const populateNewFields = (currentStateRef, defaultStateRef, field, path) => {
            if (!currentStateRef.hasOwnProperty(field)) {
                // A new namespace or property was added to the default
                // state, and needs to be included in the current state
                console.warn(`New field '${path}.${field}' added to default state. Including in current state.`);
                currentStateRef[field] = defaultStateRef[field];
            } else {
                if ((currentStateRef[field] instanceof Object) && !(currentStateRef[field] instanceof Array)) {
                    // This field exists in the current state and is an
                    // object. Check each property in the corresponding
                    // default state and add any new fields the current
                    // state doesn't have

                    for (var prop in defaultStateRef[field]) {
                        populateNewFields(currentStateRef[field], defaultStateRef[field], prop, `${path}.${field}`);
                    }
                }
            }
        };

        for (var prop in defaultState) {
            populateNewFields(this.currentState, defaultState, prop, 'state');
        }
    }

    dispatch (action) {
        this.store.dispatch(action);
    }

    initialize () {
        this.store = createStore(this.reduce.bind(this));
        addReducers(this, _Namespaces, _Actions);
    }

    state () {
        return this.currentState;
    }
};

if (!global._redux) global._redux = new ReduxManager();

export const Namespaces = _Namespaces;
export const Actions = _Actions;
export const redux = global._redux;
