import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import "./Wishlist.css";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
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
      .get(`http://127.0.0.1:8000/get_wishlist/${authCreds.user_id}`)
      // .get(`http://127.0.0.1:8000/get_wishlist/${authCreds.user_id}`)
      .then((res) => {
        setWishlist(res.data);
      })
      .catch((error) => {
        console.error("Error fetching wishlist:", error);
      });
  }, [authCreds.user_id]);

  const removeFromWishlist = async (productId) => {
    try {
      await axios.post("http://127.0.0.1:8000/remove_wishlist", {
        product_id: productId,
        buyer_id: authCreds.user_id,
      });
      // Remove the item from the wishlist in the frontend
      setWishlist(wishlist.filter((item) => item.product_id !== productId));
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
    }
  };

  return (
    <>
      {/* <Navbar wishlist="active" /> */}
      <div className="content-container">
        <h1 className="heading">Your Wishlist</h1>
        {/* <section className="wishlist-section">
          <div className="wishlist-container"> */}
        <div className="wishlist-products">
          {wishlist.map((product) => (
            <div
              key={product.product_id}
              className="wishlist-product"
              onClick={() => navigate(`/productview/${product.product_id}`)}
              style={{ cursor: "pointer" }}
            >
              {/* <div className="wishlist-photo"> 
                    <img src={product.productImage} alt={product.title}/>
                  </div>  */}
              <div className="wishlist-details">
                <p className="product-name">{product.title}</p>
                <p className="seller-name">Seller Name: {product.name}</p>
                <p className="sell-price">Sell Price: {product.sell_price}</p>
                <p className="cost-price">Cost Price: {product.cost_price}</p>
                <p className="usage">Usage: {product.usage} months</p>
                <p className="product-description">
                  Description: {product.description}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Stop event propagation
                    removeFromWishlist(product.product_id);
                  }}
                >
                  Remove from Wishlist
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* </div>
        </section> */}
      </div>
    </>
  );
};

export default Wishlist;
