import React, { Component } from 'react';
import './SearchList.scss'
import List from './List';
import { Input } from './Input';

export default class SearchList extends Component {
    constructor (props) {
        super(props);
        this.state = {
            search: 'at'
        };
        
        this.onSearchChanged = search => {
            this.setState({ search });
        };
    }
    
    filter () {
        return this.props.items.filter(i => {
            return this.props.fields.some(f => {
                return i[f].trim().toLowerCase().includes(this.state.search.trim().toLowerCase());
            });
        });
    }

    render () {
        const { search } = this.state;
        const { keyField, nameField, listClass, searchClass, listItemRender, onSelect } = this.props;
        const items = this.filter();
        return (
            <div className='search-list'>
                <Input
                    type='text'
                    className={searchClass}
                    value={search}
                    onChange={this.onSearchChanged}
                    placeholder='Search...'
                    title='Process Name'
                    outerStyle={{ marginBottom: 5 }}
                    realtime
                />
                <List
                    items={this.filter()}
                    keyField={keyField}
                    nameField={nameField}
                    listClass={listClass}
                    listItemRender={listItemRender}
                    onSelect={onSelect}
                />
            </div>
        );
    }
};
