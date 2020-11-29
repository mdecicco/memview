import React from 'react';
import ReactDOM from 'react-dom';
import Portal from './Portal';
import './Dialog.scss';

export default class Dialog extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            open: props.defaultOpen || (props.open && (props.defaultOpen || props.defaultOpen === undefined))
        };
        
        this.close = () => {
            if (!this.state.open) return;
            
            this.setState({ open: false });
            if (this.props.onClose) this.props.onClose();
            this.unbind();
        };
        
        this.open = () => {
            if (this.state.open) return;
            
            this.setState({ open: true });
            this.bind();
        };
        
        
        this.keydown = this.handleKeyDown.bind(this);
    }
    
    componentDidMount () {
        this.bind();
    }

    componentWillUnmount () {
        this.unbind();
    }

    bind () {
        if (this.listening) return;
        document.addEventListener('keydown', this.keydown);
        this.listening = true;
    }

    unbind () {
        if (!this.listening) return;
        document.removeEventListener('keydown', this.keydown);
        this.listening = false;
    }
    
    componentDidUpdate (prevProps) {
        if (prevProps.open && !this.props.open && this.state.open) this.close();
        if (!prevProps.open && this.props.open && !this.state.open) this.open();
    }
    
    handleKeyDown (e) {
        if (e.keyCode === 13 && this.props.onEnterPress) {
            const result = this.props.onEnterPress(e);
            if (result || result === undefined) this.close();
        }
    }
    
    render () {
        const { open } = this.state;
        const { closeOnEscape, closeOnExternalClick, children, title, buttons } = this.props;
        if (!open) return null;
        return (
            <Portal
                preventExternalClicks={true}
                onEscapePress={closeOnEscape || closeOnEscape === undefined ? this.close : null}
                onOutsideClick={closeOnExternalClick || closeOnExternalClick === undefined ? this.close : null}
            >
                <div className='dialog'>
                    {title ? (
                        <header className='dialog__header'>
                            <span>{title}</span>
                        </header>
                    ) : null}
                    <div className='dialog__content'>{children}</div>
                    <footer className='dialog__footer'>
                        {(buttons || []).map((b, idx) => {
                            const cb = !b.onClick ? this.close : b.onClick;
                            return (
                                <button key={idx} onClick={cb} disabled={b.disabled}>{b.label}</button>
                            );
                        })}
                    </footer>
                </div>
            </Portal>
        );
    }
};
