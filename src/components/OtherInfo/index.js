import React, { PropTypes, Component } from 'react';

import './styles.sass';

class OtherInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locationEditing: false,
      contactEditing: false
    };
  }

  handleCFSubmit(event) {
    console.log('Contact Form Event-', event);
    event.preventDefault();
    this.props.updateProfileInfo();
    this.setState({contactEditing: false});
  }

  getLocationData() {
    const { localAddress, city, state, landmark, country, pinCode} = this.props.data;
    if (this.state.locationEditing) {
      return (
        <div className="lIWrapper" key="lIWrapper">
          <div className="inputWrapper">
            <label htmlFor="localAddress">Local Address:</label>
            <input id="localAddress" className="localAddress" type="text" placeholder="Local Address" defaultValue={localAddress} />
          </div>
          <div className="inputWrapper">
            <label htmlFor="city">City:</label>
            <input id="city" className="city" type="text" placeholder="City" defaultValue={city} />
          </div>
          <div className="inputWrapper">
            <label htmlFor="state">State:</label>
            <input id="state" className="state" type="text" placeholder="State" defaultValue={state} />
          </div>
          <div className="inputWrapper">
            <label htmlFor="landmark">Landmark:</label>
            <input id="landmark" className="landmark" type="text" placeholder="Landmark" defaultValue={landmark} />
          </div>
          <div className="inputWrapper">
            <label htmlFor="country">Country:</label>
            <input id="country" className="country" type="text" placeholder="Country" defaultValue={country} />
          </div>
          <div className="inputWrapper">
            <label htmlFor="pinCode">Pin Code:</label>
            <input id="pinCode" className="pinCode" type="text" placeholder="Pin Code" defaultValue={pinCode} />
          </div>
        </div>
      );
    } else {
      return (
        <div className="lIWrapper" key="lIWrapperText">
          <div className="inputWrapper">
            <label>Local Address:</label>
            <p className="inputData">{localAddress}</p>
          </div>
          <div className="inputWrapper">
            <label>City:</label>
            <p className="inputData">{city}</p>
          </div>
          <div className="inputWrapper">
            <label>State:</label>
            <p className="inputData">{state}</p>
          </div>
          <div className="inputWrapper">
            <label>Landmark:</label>
            <p className="inputData">{landmark}</p>
          </div>
          <div className="inputWrapper">
            <label>Country:</label>
            <p className="inputData">{country}</p>
          </div>
          <div className="inputWrapper">
            <label>Pin Code:</label>
            <p className="inputData">{pinCode}</p>
          </div>
        </div>
      );
    }
  }

  getContactData() {
    const { email, phoneNo } = this.props.data;
    if (this.state.contactEditing) {
      return (
        <form className="cIWrapper" key="cIWrapper" onSubmit={this.handleCFSubmit.bind(this)}
         ref={node => this.contactForm = node} name="contactForm">
          <div className="inputWrapper">
            <label htmlFor="email">Email:</label>
            <input id="email" name="email" className="email" type="email" placeholder="Email" defaultValue={email} />
          </div>
          <div className="inputWrapper">
            <label htmlFor="phoneNo">Phone no:</label>
            <input id="phoneNo" name="phoneNo" className="phone" type="tel" placeholder="Phone No" defaultValue={phoneNo} />
          </div>
          <input type="submit" ref={node => (this.submitCFBtn = node)} style={{display: 'none'}}/>
        </form>
      );
    } else {
      return (
        <div className="cIWrapper" key="cIWrapperText">
          <div className="inputWrapper">
            <label>Email:</label>
            <p className="inputData">{email}</p>
          </div>
          <div className="inputWrapper">
            <label>Phone no:</label>
            <p className="inputData">{phoneNo}</p>
          </div>
        </div>
      );
    }
  }

  getButtons(info) {
    if (!this.state.locationEditing && info === 'LOCATION') {
      return (
        <button className="marB20"
          onClick={() => {
            this.setState({ locationEditing: true });
          }}>
          Edit
        </button>
      );
    } else if (!this.state.contactEditing && info === 'CONTACT') {
      return (
        <button className="marB20"
          onClick={() => {
            this.setState({ contactEditing: true });
          }}>
          Edit
        </button>
      );
    } else {
      let buttons;
      switch (info) {
        case 'LOCATION':
          buttons = ([
            <button className="marB20"
              key="lSave"
              onClick={() => {
                this.setState({ locationEditing: false });
              }}>
              Save
            </button>,
            <button className="marB20 cancelBtn"
              key="lCancel"
              onClick={() => {
                this.setState({ locationEditing: false });
              }}>
              Cancel
            </button>
          ]);

          break;
        case 'CONTACT':
          buttons = ([
            <button className="marB20"
              key="cSave"
              onClick={() => {
                // this will trigger synthetic form submission event
                // refs can't be used here as they will trigger native event
                // and then page will reload
                this.submitCFBtn.click();
                // dont put setState here, let the form first submit
                // and then change state
              }}>
              Save
            </button>,
            <button className="marB20 cancelBtn"
              key="cCancel"
              onClick={() => {
                this.setState({ contactEditing: false });
              }}>
              Cancel
            </button>
          ]);
          break;
      }
      return buttons;
    }
  }

  render() {
    return (
      <div className="otherInfo">
        <div className="locationInfo">
          <div className="heading">
            <h3 className="normal marB20">Location Info</h3>
            {this.getButtons('LOCATION')}
          </div>
          {this.getLocationData()}
        </div>
        <div className="contactInfo">
          <div className="heading">
            <h3 className="normal marB20">Contact Info</h3>
            {this.getButtons('CONTACT')}
          </div>
          {this.getContactData()}
        </div>
      </div>
    );
  }
}

OtherInfo.propTypes = {
  data: PropTypes.object.isRequired,
  updateProfileInfo: PropTypes.func.isRequired
};

export default OtherInfo;
