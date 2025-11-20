import axios from "axios";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import logotradethrill from "../../logotradethrill.svg";
import "./login.css";
import login from "./login.png";

const Login = () => {
  const navigate = useNavigate();
  const { setAuthCreds, setIsLoggedIn } = useContext(AuthContext);

  const [user, setUser] = useState({
    user_id: "",
    hashed_password: "", // This state variable name is kept to avoid breaking your form, but it holds the RAW password now.
  });

  const [error, setError] = useState({
    rollnoEmpty: false,
    passwordEmpty: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation
    if (!user.user_id) {
      setError((prev) => ({ ...prev, rollnoEmpty: true }));
      return;
    }
    if (!user.hashed_password) {
      setError((prev) => ({ ...prev, passwordEmpty: true }));
      return;
    }

    loginAction();
  };

  const loginAction = async () => {
    // We send the User ID and RAW Password to the backend
    const loginData = {
      user_id: user.user_id,
      password: user.hashed_password,
    };

    axios
      .post("http://127.0.0.1:8000/login", loginData)
      .then((res) => {
        // If we get here, the Server said "200 OK" -> Password is correct
        if (res.data.message === "success") {
          setAuthCreds((prevAuthCreds) => ({
            ...prevAuthCreds,
            user_id: res.data.user_id,
            name: res.data.name,
            email: res.data.email,
            active: res.data.verified,
            notification: res.data.notifications,
            profile_pic: res.data.photo,
            hashed_password: res.data.hashed_password, // Server might return hash for context, usually not needed on client but kept for compatibility
          }));

          setIsLoggedIn(true);

          if (res.data.verified) {
            navigate("/home");
          } else {
            navigate("/otp");
          }
        }
      })
      .catch((error) => {
        console.log("Login Error:", error);

        if (error.response) {
          const status = error.response.status;
          const detail = error.response.data.detail;

          if (status === 401) {
            alert("Incorrect Password");
          } else if (status === 404) {
            alert("User not found. Please Register.");
          } else if (status === 403) {
            if (detail === "User access restricted due to reports") {
              alert("You've been reported and banned.");
            } else if (detail === "User is not verified") {
              // Optional: Navigate to OTP if they exist but aren't verified
              alert("Your account is not verified.");
              // navigate("/otp", { state: { user_id: user.user_id } });
            }
          } else {
            alert("Login Failed: " + detail);
          }
        } else {
          alert("Server is not responding. Is the backend running?");
        }
      });
  };

  return (
    <div className="login">
      <div className="backgroundimg">
        <img className="img" src={login} alt="Loginimg" />
      </div>
      <div className="logoimg">
        <img className="logo" src={logotradethrill} alt="TradeThrill" />
        <h1 className="logoname">Trade Thrill</h1>
      </div>
      <div className="logincontent">
        <h1>Login</h1>
        <h4>
          Don't have an account? <Link to="/register">SignUp</Link>
        </h4>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <p>Enter Roll Number:</p>
            <input
              type="number"
              name="user_id"
              value={user.user_id}
              onChange={handleChange}
              className={`form-control ${error.rollnoEmpty ? "error" : ""}`}
              placeholder="Enter Roll Number"
            />
            {error.rollnoEmpty && (
              <p className="error-message">Roll Number is required</p>
            )}
          </div>
          <div className="form-group">
            <p>Password:</p>
            <input
              type="password"
              name="hashed_password"
              onChange={handleChange}
              className={`form-control ${error.passwordEmpty ? "error" : ""}`}
              placeholder="Enter Password"
            />
            {error.passwordEmpty && (
              <p className="error-message">Password is required</p>
            )}
          </div>
          <div>
            <button type="submit" className="submit">
              Login
            </button>
          </div>
          <p>
            <Link to="/forgotpassword">Forgot Password</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
