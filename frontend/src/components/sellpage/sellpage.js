import axios from "axios";
import { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/AuthProvider";
import "./sellpage.css";

import { useNavigate } from "react-router-dom";

const SellPage = () => {
  const { authCreds, setAuthCreds } = useContext(AuthContext);
  const [pid, setPid] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const navigate = useNavigate();
  const [data, setData] = useState({
    seller_id: authCreds.user_id,
    sell_price: 0,
    cost_price: 0,
    title: "",
    usage: 0,
    description: "",
    tags: "",
    // image: null,
  });

  useEffect(() => {
    // Ensure user is authenticated
    if (authCreds.user_id === 0) {
      navigate("/");
    }
  }, [authCreds.user_id, navigate]);

  const [sellPriceError, setSellPriceError] = useState(false);
  const [costPriceError, setCostPriceError] = useState(false);
  const [usageError, setUsageError] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const floatValue = parseFloat(value);

    // Determine which input field triggered the change and update the corresponding error state
    switch (name) {
      case "sell_price":
        setSellPriceError(floatValue < 0);
        break;
      case "cost_price":
        setCostPriceError(floatValue < 0);
        break;
      case "usage":
        setUsageError(floatValue < 0);
        break;
      default:
        break;
    }

    // if (floatValue >= 0) {
    //   setData({
    //     ...data,
    //     [name]: value,
    //   });
    // }
    setData({
      ...data,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedPhoto(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPhoto) {
      alert("Please upload a photo.");
      return;
    }

    if (data.sell_price < 0 || data.cost_price < 0 || data.usage < 0) {
      alert("Price and usage cannot be negative.");
      return; // Exit early, do not proceed with form submission
    }

    const formData = new FormData();
    formData.append("file", selectedPhoto);
    formData.append("data", JSON.stringify(data));

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/sellproduct",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(response.data); // Logging response data for debugging purposes

      // Display an alert message when product is uploaded successfully
      alert("Product uploaded successfully!");
      navigate("/home");
      // Reset form data or navigate to another page if needed
      // Example: setData({ ...initialData });
    } catch (error) {
      console.error("Error uploading product:", error);
      // Display an alert message for error if needed
      // Example: alert("Error uploading product: " + error.message);
    }
  };

  return (
    <div className="sellpage">
      <div className="sell-container">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="sell-container">
            <h1>Product Details</h1>
            <div className="sell-section">
              <h2>UPLOAD PHOTO</h2>
              <div className="upload-photo">
                <input
                  type="file"
                  id="file"
                  name="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  // required // Make photo upload required
                />
                <label htmlFor="file">Select Photo</label>
                {selectedPhoto && (
                  <img
                    src={URL.createObjectURL(selectedPhoto)}
                    alt="Uploaded"
                    style={{ maxWidth: "300px" }}
                  />
                )}
              </div>
            </div>

            <div className="sell-section">
              <h2>PRODUCT TITLE</h2>
              <input
                type="text"
                name="title"
                placeholder="Enter the title"
                onChange={handleInputChange}
                required // Make title required
              />
            </div>

            <div className="sell-section">
              <h2>CATEGORY</h2>
              <div className="category-selection">
                <select name="tags" onChange={handleInputChange} required>
                  {" "}
                  {/* Make category required */}
                  <option value="">Select Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Cycle">Cycle</option>
                  <option value="Stationary">Stationary</option>
                  <option value="Lab Stuff">Lab Stuff</option>
                  <option value="Books">Books</option>
                  <option value="Sports Essentials">Sports Essentials</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div className="sell-section">
              <h2>PRODUCT DESCRIPTION</h2>
              <textarea
                name="description"
                placeholder="Give the detailed information and details of the product"
                onChange={handleInputChange}
                required // Make description required
              ></textarea>
            </div>

            <div className="sell-section">
              <h2>SELL PRICE</h2>
              <input
                type="number"
                name="sell_price"
                placeholder="Enter the price"
                onChange={handleInputChange}
                required // Make sell price required
              />
              {sellPriceError && (
                <p className="error-message">Enter a valid price</p>
              )}
            </div>

            <div className="sell-section">
              <h2>COST PRICE</h2>
              <input
                type="number"
                name="cost_price"
                placeholder="Enter the price"
                onChange={handleInputChange}
                required // Make cost price required
              />
              {costPriceError && (
                <p className="error-message">Enter a valid price</p>
              )}
            </div>

            <div className="sell-section">
              <h2>USING SINCE</h2>
              <input
                type="number"
                name="usage"
                placeholder="Enter number of months"
                onChange={handleInputChange}
                required // Make usage required
              />
              {usageError && (
                <p className="error-message">Enter a valid usage</p>
              )}
            </div>

            <div className="sell-section">
              <button type="submit" className="submit-button">
                SUBMIT
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellPage;
