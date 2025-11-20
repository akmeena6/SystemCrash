import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import "./Otp.css";

const Otp = () => {
  const { authCreds, setAuthCreds } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get data passed from Register page

  const [packet, setPacket] = useState({
    user_id: "",
    otp: "",
  });

  // Auto-fill User ID if passed from Register page
  useEffect(() => {
    if (location.state && location.state.user_id) {
      setPacket((prev) => ({
        ...prev,
        user_id: location.state.user_id,
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPacket((prevPacket) => ({
      ...prevPacket,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare data ensuring types match Backend Pydantic models
    const submissionData = {
      user_id: packet.user_id,
      otp: parseInt(packet.otp), // Convert string "123456" to integer 123456
    };

    axios
      .post("http://127.0.0.1:8000/otp", submissionData)
      .then((res) => {
        console.log(res.data);
        if (res.data.message === "success") {
          // Update Context (Optional, since they usually need to login next anyway)
          setAuthCreds({
            ...authCreds,
            active: 1,
          });

          alert("OTP Verified Successfully! Please Login.");
          navigate("/login");
        } else {
          alert("Invalid OTP. Please try again.");
          // Don't navigate away, let them retry
        }
      })
      .catch((err) => {
        console.error(err);
        if (err.response && err.response.data) {
          alert(err.response.data.detail || "Verification Failed");
        } else {
          alert("Server Error");
        }
      });
  };

  return (
    <div className="otp-container">
      <div className="otp-box">
        <h2>Enter OTP</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <label htmlFor="user_id" className="label">
              Roll Number :
            </label>
            <input
              type="number"
              placeholder="Enter Roll Number"
              name="user_id"
              id="user_id"
              value={packet.user_id} // Controlled input
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-field">
            <label htmlFor="otp" className="label">
              OTP :
            </label>
            <input
              type="number" // Changed to number for better mobile keyboard
              placeholder="Enter OTP"
              name="otp"
              id="otp"
              value={packet.otp}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Otp;
