import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import "./uploadeditems.css";

const UploadedItems = () => {
  const [uploadedItems, setUploadedItems] = useState([]);
  const { authCreds } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure user is authenticated
    if (authCreds.user_id === 0) {
      navigate("/");
    }
  }, [authCreds.user_id, navigate]);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/on_sale/${authCreds.user_id}`)
      // .get(`http://127.0.0.1:8000/on_sale/${authCreds.user_id}`)
      .then((res) => {
        setUploadedItems(res.data);
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error);
      });
  }, [authCreds.user_id]);

  const handleEdit = (product_id) => {
    console.log("Navigating to edit page with itemId:", product_id);
    navigate(`/editproducts/${product_id}`);
  };

  const handleRemove = async (product_id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/remove_product/${product_id}`);
      // Refresh uploaded items after successful removal
      const updatedItems = uploadedItems.filter(
        (item) => item.product_id !== product_id
      );
      setUploadedItems(updatedItems);
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  return (
    <div className="uploaded-items-container">
      <h2 className="heading">Products on Sale by You</h2>
      <div className="item-list">
        {uploadedItems.map((item) => (
          <div key={item.product_id} className="uploaded-item">
            <p>Title: {item.title}</p>
            <p>Description: {item.description}</p>
            <p>Sell Price: {item.sell_price}</p>
            <p>Cost Price: {item.cost_price}</p>
            <p>Usage: {item.usage} months</p>
            <p>Number of people interested: {item.nf_interests}</p>
            <p>Tags: #{item.tags}</p>
            <button
              className="edit"
              onClick={() => handleEdit(item.product_id)}
            >
              Edit
            </button>
            <button
              className="remove"
              onClick={() => handleRemove(item.product_id)}
            >
              Remove Product
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedItems;
