import { default as addAppReducers } from './app';
import { default as addProcessReducers } from './process';

export default function addReducers (redux, Namespaces, Actions) {
    addAppReducers(redux, Namespaces, Actions);
    addProcessReducers(redux, Namespaces, Actions);
}
