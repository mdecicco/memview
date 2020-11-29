import React from 'react';
import ReactDOM from 'react-dom';
import './Portal.scss';

const escapeKeyCode = 27;
function isLeftClickEvent (event) {
    return event.button === 0;
}
function isModifiedEvent (event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

function contains (context, node) {
    if (context && context.contains) return context.contains(node);
    else if (context && context.compareDocumentPosition) {
        return context === node || !!(context.compareDocumentPosition(node) & 16);
    } else return containsFallback(context, node);
}

function containsFallback (context, node) {
    if (node) {
        do {
            if (node === context) return true;
        } while ((node = node.parentNode));
    }

    return false;
}

export default class Portal extends React.Component {
    constructor (props) {
        super(props);
        this.listening = false;
        this.preventMouseRootClose = false;
        this.mousemove = this.handleMouseCapture.bind(this);
        this.click = this.handleMouse.bind(this);
        this.keyup = this.handleKeyUp.bind(this);
        this.scroll = this.handleScroll.bind(this);

        this.root = document.createElement('div');
        this.root.classList.add('react-portal');
        document.body.appendChild(this.root);
        this.rootObserver = new MutationObserver(() => {
            if (this.root.children.length === 0) {
                this.rootObserver.disconnect();
                document.body.removeChild(this.root);
                this.root = null;
            }
        });
        this.rootObserver.observe(this.root, { childList: true });
    }
    componentDidMount () {
        if (this.props.onRendered) this.props.onRendered();
        this.addEventListeners();
    }

    componentWillUnmount () {
        this.removeEventListeners();
    }

    addEventListeners () {
        // A clickable fullscreen div is used when preventExternalClicks is true,
        // no need for event listeners
        if (this.listening || this.props.preventExternalClicks || this.props.ignoreEvents) return;
        document.addEventListener('mousemove', this.mousemove, true);
        document.addEventListener('click', this.click);
        document.addEventListener('keyup', this.keyup);
        document.addEventListener('mousewheel', this.scroll);
        document.addEventListener('DOMMouseScroll', this.scroll);
        this.listening = true;
    }

    removeEventListeners () {
        // A clickable fullscreen div is used when preventExternalClicks is true,
        // no need for event listeners
        if (!this.listening || this.props.preventExternalClicks || this.props.ignoreEvents) return;
        document.removeEventListener('mousemove', this.mousemove, true);
        document.removeEventListener('click', this.click);
        document.removeEventListener('keyup', this.keyup);
        document.removeEventListener('mousewheel', this.scroll);
        document.removeEventListener('DOMMouseScroll', this.scroll);
        this.preventMouseRootClose = false;
        this.listening = false;
    }

    handleMouseCapture (e) {
        this.preventMouseRootClose = (
            isModifiedEvent(e) ||
            !isLeftClickEvent(e) ||
            contains(this.root.children[0], e.target)
        );
        if (this.props.allowedElements) {
            this.props.allowedElements.forEach(ele => {
                if (!ele) return;
                if (contains(ele, e.target)) this.preventMouseRootClose = true;
            });
        }
    }

    handleMouse (e) {
        if (!this.preventMouseRootClose && this.props.onOutsideClick) {
            const doUnbind = this.props.onOutsideClick(e);
            if (doUnbind === true || doUnbind === undefined) this.removeEventListeners();
        }
    }

    handleBackgroundClick (e) {
        if (this.props.onOutsideClick) {
            const doUnbind = this.props.onOutsideClick(e);
            if (doUnbind === true || doUnbind === undefined) this.removeEventListeners();
        }
    }

    handleKeyUp (e) {
        if (e.keyCode === escapeKeyCode && this.props.onEscapePress) {
            const doUnbind = this.props.onEscapePress(e);
            if (doUnbind === true || doUnbind === undefined) this.removeEventListeners();
        }
    }

    handleScroll (e) {
        if (!this.preventMouseRootClose && this.props.onOutsideScroll) {
            const doUnbind = this.props.onOutsideScroll(e);
            if (doUnbind === true || doUnbind === undefined) this.removeEventListeners();
        }
    }

    render () {
        const darken = this.props.darkenBackground;
        const preventExternalClicks = this.props.preventExternalClicks;
        return ReactDOM.createPortal((
            <div className='react-portal__container' style={{ zIndex: 999999 + (this.props.zIndex || 0) }}>
                <div
                    className={`
                        react-portal__background
                        ${darken ? 'react-portal__background--dark' : ''}
                        ${preventExternalClicks ? 'react-portal__background--clickable' : ''}
                    `}
                    onClick={(e) => this.handleBackgroundClick(e)}
                />
                <div className='react-portal__content'>
                    {this.props.children}
                </div>
            </div>
        ), this.root);
    }
};
