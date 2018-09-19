import React from 'react';
import PropTypes from 'prop-types';

import '@material/radio/mdc-radio.scss';

class Radio extends React.Component {
  render() {
    let { id, checked, label, name, disable, onRadioChange, required} = this.props;
    let disableClassName = '';
    if (disable) {
      disableClassName = ' mdc-radio--disabled'
    }
    return (
      <div className="mdc-form-field">
        <div className={'mdc-radio' + disableClassName}>
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
        <label htmlFor={id}>{label}</label>
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
  onRadioChange: PropTypes.func,
}


export default Radio;