/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-control-regex */

import React from 'react';
import './Input.scss';

export const Pattern = {
    phone: /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/,
    name: /^(?=.{1,40}$)[a-zA-Z]+(?:[-'\s][a-zA-Z]+)*/,
    email: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
    number: /^-?[0-9]\d*(\.\d+)?$/,
    hex: /(^0[xX][0-9a-fA-F]+$)|(^[0-9a-fA-F]+$)/,
    negHex: /(^(\-?)0[xX][0-9a-fA-F]+$)|(^(\-?)[0-9a-fA-F]+$)/
};

export const Validate = {
    phone: (v) => {
        const parts = v.match(/([0-9]*)/g).filter(m => m.length > 0);
        if (parts.length === 4) return `+${parts[0]} (${parts[1]}) ${parts[2]}-${parts[3]}`;
        if (parts.length === 3) return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
        if (parts.length === 2) return `${parts[0]}-${parts[1]}`;
    },
    name: (v) => v.trim(),
    email: (v) => v.trim(),
    hex: (v) => v.trim().toUpperCase().replace('X', 'x')
};

function getAbsoluteBoundingRect (el) {
    const doc = document;
    const win = window;
    const body = doc.body;

    // pageXOffset and pageYOffset work everywhere except IE <9.
    let offsetX = win.pageXOffset !== undefined ? win.pageXOffset
        : (doc.documentElement || body.parentNode || body).scrollLeft;
    let offsetY = win.pageYOffset !== undefined ? win.pageYOffset
        : (doc.documentElement || body.parentNode || body).scrollTop;
    const rect = el.getBoundingClientRect();

    if (el !== body) {
        var parent = el.parentNode;

        // The element's rect will be affected by the scroll positions of
        // *all* of its scrollable parents, not just the window, so we have
        // to walk up the tree and collect every scroll offset. Good times.
        while (parent !== body) {
            offsetX += parent.scrollLeft;
            offsetY += parent.scrollTop;
            parent = parent.parentNode;
        }
    }

    return {
        bottom: rect.bottom + offsetY,
        height: rect.height,
        left: rect.left + offsetX,
        right: rect.right + offsetX,
        top: rect.top + offsetY,
        width: rect.width
    };
}

export class Input extends React.Component {
    constructor (props) {
        super(props);

        const val = this.getValidated(props.value);
        this.state = {
            focused: false,
            value: val,
            lastValid: val
        };

        this.input = null;
    }

    inputRef (ref) {
        if (this.props.autocomplete) this.input = ref ? ref.input : null;
        else this.input = ref;
    }

    isValid () {
        const { pattern, required, maxLength, patternNotMatchedMessage } = this.props;
        const value = this.state ? this.state.value : this.props.value;
        if (!value) return { valid: true, message: '' };

        const matches = (value && pattern && pattern instanceof RegExp && pattern.test(value)) || !pattern;
        const hasMaxLen = maxLength !== undefined && maxLength !== null && (typeof maxLength) === 'number';
        const tooLong = hasMaxLen && ((typeof value) === 'string') && value.length > maxLength;

        if (!matches) {
            if (patternNotMatchedMessage) return { valid: false, message: patternNotMatchedMessage };
            else {
                let message = 'Invalid value';
                if (pattern === Pattern.phone) message = 'Please enter a valid phone number (like \'+1 (234) 567-8910\')';
                else if (pattern === Pattern.name) message = 'Please enter a name that is fewer than 40 characters and contains no numbers or special characters';
                else if (pattern === Pattern.email) message = 'Please enter a valid email (like \'name@site.com\')';
                else if (pattern === Pattern.number) message = 'Please enter a valid number, with no more than 1 decimal point and no more than one negative sign (at the beginning)';

                return { valid: false, message };
            }
        }

        if (!value && required) return { valid: false, message: 'This is a required field' };

        if (tooLong) return { valid: false, message: `Please enter a value that is fewer than ${maxLength} characters` };

        return { valid: true, message: '' };
    }

    getValidated (value) {
        let v = value;

        if (this.isValid().valid && this.props.validate && v) v = this.props.validate(v);
        else if (!value && this.props.default) v = this.props.default;

        const validInput = ((typeof v === 'string') && v.length > 0) || ((typeof v === 'number') && !isNaN(v));
        if (validInput && (this.props.type === 'dollar' || this.props.precision)) {
            v = parseFloat(v).toFixed(this.props.precision || 2);
            if (this.props.maxZeros) {
                const parts = v.split('.');
                let fractional = parts[1];
                let sliceTo = this.props.maxZeros;
                for (let i = fractional.length - 1;i >= sliceTo;i--) {
                    if (fractional[i] !== '0') sliceTo = i + 1;
                }
                fractional = fractional.substr(0, sliceTo);
                v = `${parts[0]}.${fractional}`;
            }
        }

        return v;
    }

    componentDidUpdate (prevProps) {
        if (this.props.value !== prevProps.value) {
            const val = this.getValidated(this.props.value);
            this.setState({
                value: val,
                lastValid: val
            });
        }
    }
    
    componentDidMount () {
        if (this.input && this.props.autoFocus) this.input.focus();
    }

    render () {
        const {
            alwaysShowInvalidTooltip,
            borderless,
            disabled,
            emptyPlaceholder,
            filters,
            getItemValue,
            updateSearchOnChange,
            inputClass,
            isItemSelectable,
            itemFilter,
            name,
            onChange,
            onClose,
            onFocusOut,
            onSearchChange,
            realtime,
            options,
            outerClass,
            placeholder,
            readOnly,
            renderItem,
            special,
            title,
            type,
            outerStyle
        } = this.props;
        const { focused, value, lastValid } = this.state;
        const { valid, message } = this.isValid();
        const minify = focused || value || !title;
        let inputType = type || 'text';
        let inputValue = value;
        let prefix = null;
        let postfix = null;
        let hideNegative = false;
        if (inputType === 'dollar') {
            inputType = 'number';
            const v = parseFloat(inputValue);
            if (!isNaN(v)) {
                if (v < 0) hideNegative = true;
                prefix = `${v < 0 ? '-' : ''}$`;
            }
        } else if (inputType === 'percent') {
            inputType = 'number';
            const v = parseFloat(inputValue);
            if (!isNaN(v)) postfix = '%';
        }

        const click = () => { this.input.focus(); };
        const focus = () => { this.setState({ focused: true }); };
        const change = (e) => {
            this.setState({ value: e.target.value }, () => {
                if (realtime && onChange) {
                    const val = this.getValidated(e.target.value);
                    if (val !== lastValid && onChange) onChange(val, this.isValid().valid);
                }
            });
        };
        const select = (val) => {
            // called when an autocomplete result is selected
            if (onChange) {
                onChange(val);
                if (onSearchChange && updateSearchOnChange) {
                    const searchVal = val ? (getItemValue ? getItemValue(val) : val) : null;
                    onSearchChange(searchVal || '');
                }
            }
            this.setState({ focused: false });
            if (this.input) this.input.blur();
        };
        const blur = () => {
            const val = this.getValidated(value);
            if (val !== lastValid && onChange) onChange(val, valid);
            this.setState({
                focused: false,
                value: val,
                lastValid: valid ? val : lastValid
            });
            if (this.input) this.input.blur();
            if (onFocusOut) onFocusOut();
        };

        let mainClasses = `material-input ${outerClass || ''}`;
        let placeholderClasses = 'material-input__placeholder';
        let borderClasses = 'material-input__border';
        let inputClasses = 'material-input__input';

        if (hideNegative) inputClasses += ' material-input__input--hide-negative';
        if (borderless) mainClasses += ' material-input--borderless';
        if (focused && !readOnly) borderClasses += ' material-input__border--expanded';
        if ((minify && title) || (title && type === 'date')) {
            placeholderClasses += ' material-input__placeholder--minified';
            mainClasses += ' material-input--placeholder-minified';
        }
        if (special) placeholderClasses += ' material-input__placeholder--special';
        if (!valid) {
            placeholderClasses += ' material-input__placeholder--invalid';
            borderClasses += ' material-input__border--invalid';
        }

        const invalidTooltipStyle = {};
        if (!valid && this.input) {
            const bounds = getAbsoluteBoundingRect(this.input);
            invalidTooltipStyle.top = `${bounds.top}px`;
            invalidTooltipStyle.left = `${bounds.left + (bounds.width / 2)}px`;
        }

        if (type === 'toggle') {
            return (
                <div
                    className={`${mainClasses} material-input--toggle`}
                    disabled={disabled}
                    style={outerStyle}
                >
                    {title ? (
                        <span
                            className={
                                `material-input__toggle-title
                                ${special ? 'material-input__toggle-title--special' : ''}
                            `}
                        >{title}</span>
                    ) : null}
                    <label className='switch' name={name} readOnly={readOnly}>
                        <input
                            type='checkbox'
                            disabled={disabled}
                            checked={value}
                            onChange={(e) => {
                                this.setState({ value: e.target.checked });
                                if (onChange) onChange(e.target.checked);
                            }}
                        />
                        <span className='slider'/>
                    </label>
                </div>
            );
        } else if (type === 'select') {
            const selectOptions = Array.from(options, o => Object.assign({}, o));
            if (placeholder) {
                selectOptions.unshift({
                    text: placeholder,
                    value: null
                });
            }
            return (
                <div
                    className={`${mainClasses} material-input--select`}
                    disabled={disabled}
                    style={outerStyle}
                >
                    {title ? (
                        <span
                            className={
                                `material-input__select-title
                                ${special ? 'material-input__select-title--special' : ''}
                            `}
                        >{title}</span>
                    ) : null}
                    <select
                        name={name}
                        disabled={disabled}
                        readOnly={readOnly}
                        value={value || ''}
                        onChange={(e) => {
                            const value = selectOptions[e.target.selectedIndex].value;
                            this.setState({ value });
                            if (onChange) onChange(value);
                        }}
                    >
                        {selectOptions.map(o => (
                            <option
                                key={o.value}
                                value={o.value}
                            >
                                {o.text}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        return (
            <div
                className={mainClasses}
                onClick={click}
                disabled={disabled}
                title={message}
                style={outerStyle}
            >
                {title && (<span className={placeholderClasses}>{title || ''}</span>)}
                <div className={inputClasses} data-prefix={prefix} data-postfix={postfix}>
                    <input
                        ref={(ref) => { this.inputRef(ref); }}
                        className={inputClass}
                        type={inputType}
                        value={inputValue}
                        onChange={change}
                        onFocus={focus}
                        onBlur={blur}
                        onKeyPress={(e) => { if (e.charCode === 13) blur(); }}
                        name={name}
                        placeholder={minify && placeholder ? placeholder : ''}
                        readOnly={readOnly}
                        disabled={disabled}
                        spellCheck={false}
                    />
                </div>
                {!borderless ? (<div className={borderClasses}/>) : null}
            </div>
        );
    }
}
