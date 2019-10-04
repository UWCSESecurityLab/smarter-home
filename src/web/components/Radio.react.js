import React from 'react';
import PropTypes from 'prop-types';

import '@material/radio/mdc-radio.scss';

class Radio extends React.Component {
  render() {
    let { id, checked, label, name, disable, onRadioChange, required, radioClassName} = this.props;
    let combinedClassName = ['mdc-radio'];
    if (radioClassName) {
      combinedClassName.push(radioClassName)
    }
    if (disable) {
      combinedClassName.push('mdc-radio--disabled')
    }
    return (
      <div className="mdc-form-field">
        <div className={combinedClassName.join(' ')}>
          <input className="mdc-radio__native-control"
                type="radio" id={id} name={name}
                checked={checked}
                required={required}
                onChange={() => {
                  onRadioChange(name, id)
                }}/>
          <div className="mdc-radio__background">
            <div className="mdc-radio__outer-circle"></div>
            <div className="mdc-radio__inner-circle"></div>
          </div>
        </div>
        { label
          ? <label htmlFor={id}><span className="radio-label">{label}</span></label>
          : null }
      </div>
    );
  }
}

Radio.propTypes = {
  id: PropTypes.string,
  checked: PropTypes.bool,
  label: PropTypes.node,
  name: PropTypes.string,
  disable: PropTypes.bool,
  required: PropTypes.bool,
  radioClassName: PropTypes.string,
  onRadioChange: PropTypes.func,
}


export default Radio;