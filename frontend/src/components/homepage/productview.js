import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import "./productview.css";

const ProductViewPage = () => {
  const { product_id } = useParams(); // Get the product_id from the URL params

  const navigate = useNavigate();
  const [product, setProduct] = useState([]);
  const { authCreds } = useContext(AuthContext);

  useEffect(() => {
    // Ensure user is authenticated
    if (authCreds.user_id === 0) {
      navigate("/");
    }
  }, [authCreds.user_id, navigate]);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/get_specific_product/${product_id}`)
      .then((res) => {
        setProduct(res.data);
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
      });
  }, [product_id]);

  const [isWishlist, setIsWishlist] = useState(false);
  const [reportButtonText, setReportButtonText] = useState("Report User");
  const [isReportDisabled, setIsReportDisabled] = useState(false);
  const [isAddedToWishlist, setIsAddedToWishlist] = useState(false); // New state
  const [isRequested, setIsRequested] = useState(false); // New state
  const [requestCount, setRequestCount] = useState(0);

  // useEffect(() => {
  //   // Check if product is in wishlist
  //   // Here you can implement the logic to check if the product is in the user's wishlist
  //   // For simplicity, let's assume it's already added to the wishlist
  //   // You can replace this logic with your actual implementation
  //   setIsAddedToWishlist(false); // Set to true if product is in wishlist
  // }, [product, authCreds]);

  useEffect(() => {
    // Fetch request count when product changes
    if (authCreds.user_id !== 0 && product_id) {
      console.log(authCreds.user_id);
      console.log(product_id);
      axios
        .get(
          `http://127.0.0.1:8000/request_count/${product_id}/${authCreds.user_id}`
        )
        .then((res) => {
          setRequestCount(res.data.count);
        })
        .catch((error) => {
          console.error("Error fetching request count:", error);
        });
    }
  }, [product_id, authCreds]);

  const toggleWishlist = () => {
    setIsWishlist((prevState) => !prevState);
  };

  const addToWishlist = () => {
    let data = {
      product_id: parseInt(product_id),
      buyer_id: parseInt(authCreds.user_id),
    };
    axios
      .post("http://127.0.0.1:8000/wishlist", data)
      .then((response) => {
        setIsAddedToWishlist(true); // Set to true after successfully adding to wishlist
        navigate("/wishlist");
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.status === 400 &&
          error.response.data.detail === "Product already exists"
        ) {
          alert("You've already added this to wishlist");
        }
        if (
          error.response &&
          error.response.status === 400 &&
          error.response.data.detail ===
            "You cannot add your own product to your wishlist"
        ) {
          alert("You cannot add your own product to your wishlist");
        }
        console.log(error);
      });
  };

  const reportUser = () => {
    setReportButtonText("Reported");
    setIsReportDisabled(true);
  };

  const chatWithSeller = () => {
    navigate(`/chat/${product.seller_id}`); // Navigate to the chat page with seller's ID
  };

  const report = () => {
    let data = {
      product_id: parseInt(product_id),
      reporter_id: parseInt(authCreds.user_id),
    };
    axios
      .post("http://127.0.0.1:8000/report", data)
      .then((response) => {
        setReportButtonText("Reported"); // Update button text to "Reported"
        setIsReportDisabled(true); // Disable the button
        console.log(response.data);
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.status === 400 &&
          error.response.data.detail ===
            "Reporter and reported user cannot be the same"
        ) {
          alert("You cannot report youself");
        }
        if (
          error.response &&
          error.response.status === 400 &&
          error.response.data.detail ===
            "User has already been reported by this reporter"
        ) {
          alert("You've already reported this user");
        }
        console.log(error);
      });
  };

  const notif_request = () => {
    if (requestCount >= 3) {
      alert("You've already requested this product 3 times.");
      return;
    }
    if (requestCount == 1 || requestCount == 2) {
      const confirmRequest = window.confirm(
        "You've already requested this product. Do you want to request again?"
      );
      if (!confirmRequest) return;
    }
    let data = {
      pid: parseInt(product_id),
      buyer_id: parseInt(authCreds.user_id),
    };
    axios
      .post("http://127.0.0.1:8000/notify_request", data)
      .then((response) => {
        setIsRequested(true); // Set to true after successfully sending request
        setRequestCount((prevCount) => prevCount + 1);
        console.log(response.data);
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.status === 400 &&
          error.response.data.detail === "You cannot request your own product"
        ) {
          alert("You cannot request your own product");
        }
        console.log(error);
      });
  };

  return (
    <div className="product-view-page">
      <div className="product-details">
        <img
          src={`data:image/png;base64,${product.product_image}`}
          alt={product.product_title}
          className="product-image"
        />
      </div>
      <div className="seller-details">
        <h1>{product.title}</h1>
        <p>Description: {product.description}</p>
        <p>Sell Price: Rs.{product.sell_price}</p>
        <p>Cost Price: Rs.{product.cost_price}</p>
        <p>Usage: {product.usage} months</p>
        <h2>Seller Information</h2>
        <p>Seller Name: {product.seller_name}</p>
        <p>Seller Email: {product.seller_email}</p>
      </div>
      <div className="actions">
        <button onClick={() => addToWishlist()} disabled={isAddedToWishlist}>
          {isAddedToWishlist ? "Added to Wishlist" : "Add to Wishlist"}
        </button>
        <button onClick={() => report()} disabled={isReportDisabled}>
          {reportButtonText}
        </button>
        <button onClick={() => notif_request()} disabled={isRequested}>
          {isRequested ? "Requested" : "Request to buy"}
        </button>
        <button onClick={chatWithSeller}>Chat with Seller</button>
      </div>
    </div>
  );
};

export default ProductViewPage;
