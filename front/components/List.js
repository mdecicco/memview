import React, { Component } from 'react';
import './List.scss'

export default class List extends Component {
    constructor (props) {
        super(props);
    }

    render () {
        const { items, keyField, nameField, onSelect, listItemRender } = this.props;
        const Item = listItemRender;
        
        return (
            <div className={`list ${onSelect ? 'list--selectable' : ''}`}>
                {items.map((i, idx) => (
                    <div
                        className='list__item'
                        key={keyField ? i[keyField] : `${idx}`}
                        onClick={() => onSelect(i)}
                    >
                        {Item ? <Item item={i}/> : (<span>{i[nameField]}</span>)}
                    </div>
                ))}
            </div>
        );
    }
};
