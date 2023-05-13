import React, { Component } from "react";
import "./styles.sass";

class Footer extends Component {
  render() {
    return (
      <footer className="footer">
        <p className="has-link">
          A trading platform. Made with <span className="heart">♥</span> by{" "}
          <a target="blank" href="http://iamarshad.com">
            Arshad Khan
          </a>
          , updated and maintained by{" "}
          <a target="blank" href="https://henry.bao.nyc">
            Henry Bao
          </a>
          .
        </p>
      </footer>
    );
  }
}

export default Footer;
