import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../context/AuthProvider";
import Navbar from "../Navbar/navbar";
import "./changepassword.css";

const ChangePassword = () => {
  const nav = useNavigate();
  const { authCreds } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [u, setU] = useState({
    user_id: authCreds.user_id,
    new_password: "",
    confirm_password: "",
    otp: "",
  });
  const [err, setErr] = useState({});

  useEffect(() => {
    if (!authCreds.user_id) nav("/");
    setU((p) => ({ ...p, user_id: authCreds.user_id }));
  }, [authCreds.user_id, nav]);

  const hChange = (e) => {
    setU({ ...u, [e.target.name]: e.target.value });
    setErr({ ...err, passwordsMatch: true });
  };

  const hSendOTP = async (e) => {
    e.preventDefault();
    if (u.new_password !== u.confirm_password) {
      setErr({ ...err, passwordsMatch: false });
      return;
    }

    try {
      // Send RAW passwords. Backend handles hashing.
      await axios.post("http://127.0.0.1:8000/forgotpassword", {
        user_id: u.user_id,
        new_password: u.new_password,
        confirm_password: u.confirm_password,
      });
      setStep(2);
    } catch (e) {
      console.error(e);
      alert("Error sending OTP. Try again.");
    }
  };

  const hVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/newotp", {
        user_id: u.user_id,
        otp: parseInt(u.otp),
      });
      alert("Password Changed Successfully. Please Login.");
      nav("/");
    } catch (e) {
      console.error(e);
      alert("Invalid OTP");
    }
  };

  return (
    <>
      <Navbar />
      <div className="change-container">
        <div className="xyz-forgot-password-container">
          <h2>Change Password</h2>
          {step === 1 && (
            <form onSubmit={hSendOTP}>
              <div className="form-group">
                <p>User ID:</p>
                <input type="number" value={u.user_id} readOnly />
              </div>
              <div className="form-group">
                <p>New Password:</p>
                <input
                  type="password"
                  name="new_password"
                  value={u.new_password}
                  onChange={hChange}
                  placeholder="New password"
                  required
                />
              </div>
              <div className="form-group">
                <p>Confirm Password:</p>
                <input
                  type="password"
                  name="confirm_password"
                  value={u.confirm_password}
                  onChange={hChange}
                  placeholder="Confirm password"
                  required
                />
                {!err.passwordsMatch && (
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
            <form onSubmit={hVerifyOTP}>
              <div className="form-group">
                <p>Enter OTP:</p>
                <input
                  type="number"
                  name="otp"
                  value={u.otp}
                  onChange={hChange}
                  placeholder="Enter OTP"
                  required
                />
              </div>
              <div className="button-container">
                <button type="submit" className="submit">
                  Verify & Change
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ChangePassword;
