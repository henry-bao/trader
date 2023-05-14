import React, { Component, PropTypes } from "react";

import "./styles.sass";
import loadPageProps from "../../utils/loadPageProps";

class Admin extends Component {
  componentDidMount() {
    loadPageProps("Amin - Trader");
  }

  render() {
    let last_item = this.props.location.query.l_i;
    let query = "";
    if (last_item) {
      query = `?l_i=${last_item}`;
    }
    return (
      <div className="loginWrapper">
        <h3 className="loginHeading text-center">
          Login with your social account to add trade items or propose a trade
        </h3>
        <div className="btnWrapper">
          <a href={`/auth/google${query}`}>
            <button className="loginBtn googleBtn">Google Login</button>
          </a>
          <a href={`/auth/facebook${query}`}>
            <button className="loginBtn fbBtn">Facebook Login</button>
          </a>
          {/* <a href={`/auth/twitter${query}`}><button className="loginBtn twitterBtn">Twitter Login</button></a> */}
        </div>
      </div>
    );
  }
}

Admin.propTypes = {
  location: PropTypes.object.isRequired,
};

export default Admin;
