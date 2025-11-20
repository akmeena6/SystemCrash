import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logotradethrill from "../../logotradethrill.svg";
import "./forgotpassword.css";
import forgotpasswordpage from "./forgotpasswordpage.png";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    user_id: 0,
    new_password: "",
    confirm_password: "",
    otp: "", // Added OTP to initial state
  });

  const [error, setError] = useState({
    rollnoEmpty: false,
    newPasswordEmpty: false,
    confirmPasswordEmpty: false,
    otpEmpty: false,
    passwordsMatch: true,
  });

  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));

    setError((prevError) => ({
      ...prevError,
      passwordsMatch: true,
    }));
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (user.new_password !== user.confirm_password) {
      setError((prevError) => ({
        ...prevError,
        passwordsMatch: false,
      }));
      return;
    }

    // Send RAW data to backend
    const userData = {
      user_id: user.user_id,
      new_password: user.new_password,
      confirm_password: user.confirm_password,
    };

    try {
      await axios.post("http://127.0.0.1:8000/forgotpassword", userData);
      alert("OTP sent to your registered email.");
      setStep(2);
    } catch (error) {
      console.error(error);
      if (error.response) {
        const msg = error.response.data.detail;
        if (msg === "User not found") alert("User not registered.");
        else if (msg === "User access restricted due to reports")
          alert("You are banned.");
        else if (msg === "User is not verified") alert("Account not verified.");
        else alert("Error: " + msg);
      }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    // Prepare data for the newotp endpoint
    const otpData = {
      user_id: user.user_id,
      otp: parseInt(user.otp), // Ensure OTP is an integer
    };

    try {
      await axios.post("http://127.0.0.1:8000/newotp", otpData);
      alert("Password Reset Successful! Please Login.");
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert("Invalid OTP or Session Expired.");
      // navigate("/forgotpassword"); // Optional: Stay on page to retry
    }
  };

  return (
    <div className="forgotpassword">
      <div className="backgroundimg">
        <img className="img" src={forgotpasswordpage} alt="ForgotPasswordimg" />
      </div>
      <div className="logoimg">
        <img className="logo" src={logotradethrill} alt="TradeThrill" />
        <h1 className="logoname">Trade Thrill</h1>
      </div>
      <div className="forgotpasswordcontent">
        <h1>Forgot Password</h1>

        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <p>Enter Roll Number:</p>
              <input
                type="number"
                name="user_id"
                onChange={handleChange}
                className={`form-control ${error.rollnoEmpty ? "error" : ""}`}
                placeholder="Enter Roll Number"
                required
              />
            </div>

            <div className="form-group">
              <p>New Password:</p>
              <input
                type="password"
                name="new_password"
                value={user.new_password}
                onChange={handleChange}
                className={`form-control ${
                  error.newPasswordEmpty ? "error" : ""
                }`}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <p>Confirm Password:</p>
              <input
                type="password"
                name="confirm_password"
                value={user.confirm_password}
                onChange={handleChange}
                className={`form-control ${
                  !error.passwordsMatch ? "error" : ""
                }`}
                placeholder="Confirm new password"
                required
              />
              {!error.passwordsMatch && (
                <p className="error-message">Passwords don't match</p>
              )}
            </div>

            <div className="button-container">
              <button type="submit" className="submit">
                Send OTP
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <p>Enter OTP:</p>
              <input
                type="number"
                name="otp"
                value={user.otp}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter OTP"
                required
              />
            </div>

            <div className="button-container">
              <button type="submit" className="submit">
                Verify & Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
