import { default as addAppReducers } from './app';

export default function addReducers (redux, Namespaces, Actions) {
    addAppReducers(redux, Namespaces, Actions);
}
