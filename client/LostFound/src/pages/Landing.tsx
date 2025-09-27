import React, { useState } from "react";
import "../scss/Landing.scss";
import { TypeAnimation } from "react-type-animation";

export default function Landing() {
  const [clicked, setClicked] = useState(false);

  return (
    <>
      {/*<img className="nav-wave" src={nav_wave} />*/}
      <div className="login-container">
        <div className="login-header">
          <TypeAnimation
            sequence={[
              // Same substring at the start will only be typed out once, initially
              "",
              100, // wait 1s before replacing "Mice" with "Hamsters"
              "Want to find or return something? Create an account now!",
              2000,
            ]}
            wrapper="span"
            speed={50}
            style={{ display: "inline-block", fontSize: "3rem", fontFamily: 'Raleway', fontWeight: '600', color: '#333' }}
            repeat={Infinity}
          />
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <button onClick={() => setClicked(true)} className="login-btn">
            Login here
          </button>
          <button onClick={() => setClicked(true)} className="login-btn">
            Register here
          </button>
        </div>
      </div>
      {/* {clicked && <LoginPopup setClicked={setClicked} />} */}
    </>
  );
}