import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import "./sellpage.css";

const EditProducts = () => {
  const { product_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({
    sell_price: 0,
    cost_price: 0,
    title: "",
    usage: 0,
    description: "",
    tags: "",
  });
  const { authCreds } = useContext(AuthContext);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);

  useEffect(() => {
    if (!authCreds.user_id) {
      navigate("/");
    }
  }, [authCreds.user_id, navigate]);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/get_specific_product/${product_id}`)
      .then((res) => {
        setData({
          sell_price: res.data.sell_price,
          cost_price: res.data.cost_price,
          title: res.data.title,
          usage: res.data.usage,
          description: res.data.description,
          tags: res.data.tags,
        });
        if (res.data.product_image) {
          setExistingPhoto(res.data.product_image);
        }
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
      });
  }, [product_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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

    // Check if a new photo is selected
    if (selectedPhoto) {
      const formData = new FormData();
      formData.append("file", selectedPhoto);
      formData.append(
        "data",
        JSON.stringify({ ...data, product_id: product_id })
      );

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/edit_products",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log(response.data);
        window.alert("Product details saved successfully!");
        navigate("/uploadeditems");
      } catch (error) {
        console.error(error);
      }
    } else {
      // No new photo selected, send only product details
      try {
        const updatedData = { ...data, product_id: product_id };
        const response = await axios.post(
          "http://127.0.0.1:8000/edit_product_details",
          updatedData
        );

        console.log(response.data);
        window.alert("Product details saved successfully!");
        navigate("/uploadeditems");
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="sellpage">
      <div className="sell-container">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="sell-container">
            <h1>Edit Product Details</h1>
            <div className="sell-section">
              <h2>UPLOAD PHOTO</h2>
              <div className="upload-photo">
                <input
                  type="file"
                  id="file"
                  name="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label htmlFor="file">Select Photo</label>
                {(selectedPhoto || existingPhoto) && (
                  <img
                    // src={URL.createObjectURL(selectedPhoto)}
                    src={
                      selectedPhoto
                        ? URL.createObjectURL(selectedPhoto)
                        : `data:image/png;base64,${existingPhoto}`
                    }
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
                value={data.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="sell-section">
              <h2>CATEGORY</h2>
              <div className="category-selection">
                <select
                  name="tags"
                  value={data.tags}
                  onChange={handleInputChange}
                >
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
                value={data.description}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="sell-section">
              <h2>SELL PRICE</h2>
              <input
                type="number"
                name="sell_price"
                placeholder="Enter the price"
                value={data.sell_price}
                onChange={handleInputChange}
              />
            </div>

            <div className="sell-section">
              <h2>COST PRICE</h2>
              <input
                type="number"
                name="cost_price"
                placeholder="Enter the price"
                value={data.cost_price}
                onChange={handleInputChange}
              />
            </div>

            <div className="sell-section">
              <h2>USING SINCE</h2>
              <input
                type="number"
                name="usage"
                placeholder="Enter number of months"
                value={data.usage}
                onChange={handleInputChange}
              />
            </div>

            <div className="sell-section">
              <button type="submit" className="submit-button">
                SAVE
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProducts;
