import React from 'react';
import PropTypes from 'prop-types';

import '@material/checkbox/mdc-checkbox.scss';

class Checkbox extends React.Component {
  render() {
    const { id, checked, label, name, onCheckboxChange } = this.props;
    return (
      <div className="mdc-form-field">
        <div className="mdc-checkbox">
          <input type="checkbox"
                 checked={checked}
                 className="mdc-checkbox__native-control"
                 id={id}
                 name={name}
                 onChange={() => { onCheckboxChange(name, id)}}/>
          <div className="mdc-checkbox__background">
            <svg className="mdc-checkbox__checkmark"
                 viewBox="0 0 24 24">
              <path className="mdc-checkbox__checkmark-path"
                    fill="none"
                    d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
            </svg>
            <div className="mdc-checkbox__mixedmark"></div>
          </div>
        </div>
        <label htmlFor={id}>{label}</label>
      </div>
    );
  }
}

Checkbox.propTypes = {
  id: PropTypes.string,
  checked: PropTypes.bool,
  label: PropTypes.node,
  name: PropTypes.string,
  onCheckboxChange: PropTypes.func,
}

export default Checkbox;