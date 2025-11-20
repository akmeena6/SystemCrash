import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import "./homepage.css";
import Navbar from "./navigationbar"; // Adjust the path accordingly

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  // this is the backend schema for each product
  // ⁠ product = {
  //   "product_id": row[0],
  //   "product_title": row[1],
  //   "sell_price": row[2],
  //   "seller_name": row[3],
  //   "seller_email": row[4],
  //   "product_image": row[5]
  // } ⁠
  const { authCreds, setAuthCreds, setIsLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    // Check if user is not authenticated, then navigate to the login page
    if (authCreds.user_id === 0) {
      navigate("/");
    }
  }, [authCreds.user_id, navigate]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/get_products")
      // .get("http://127.0.0.1:8000/get_products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // if(authCreds.user_id == 0){
  //   navigate('/login');
  //   return null;
  // }

  return (
    <div className="homepage">
      <div className="background">
        <Navbar search_stuff={{ products, setProducts }} />
        <div className="recommendations-section">
          <h1 className="recommendation">Recent Recommendations</h1>
        </div>

        <div className="products-section">
          <h2 className="products-heading">Featured Products</h2>
          <div className="products-container">
            {products.map((product) => (
              <div
                key={product.product_id}
                className="product"
                onClick={() => navigate(`/productview/${product.product_id}`)}
                style={{ cursor: "pointer" }} // Optionally change cursor to pointer for visual indication
              >
                <img
                  src={`data:image/png;base64,${product.product_image}`}
                  alt={product.product_title}
                  className="product-image"
                />
                <h3>{product.product_title}</h3>
                <p>Price: Rs.{product.sell_price}</p>
                <p>Seller Name: {product.seller_name}</p>
                <p>Seller Email: {product.seller_email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
