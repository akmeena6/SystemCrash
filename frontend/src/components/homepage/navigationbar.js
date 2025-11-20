import ProfileIcon from "@mui/icons-material/AccountCircleRounded";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Tooltip, useMediaQuery } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logotradethrill from "../../logotradethrill.svg";
import "./navigationbar.css";

const Navbar = ({ search_stuff }) => {
  const { products, setProducts } = search_stuff;
  const navigate = useNavigate();
  const [searchString, setSearchString] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDesktop = useMediaQuery("(min-width:768px)");

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const goToHome = () => {
    try {
      navigate("/home");
    } catch (error) {
      console.error("Error navigating to home:", error);
    }
  };

  const handleMenuItemClick = (route) => {
    setIsMobileMenuOpen(false);
    navigate(route);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchString.trim() === "") {
      axios
        .get("http://127.0.0.1:8000/get_products")
        .then((res) => {
          setProducts(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      axios
        .post("http://127.0.0.1:8000/search", { query: searchString })
        .then((res) => {
          setProducts(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <div className="navbar">
      <img
        src={logotradethrill}
        alt="logo"
        className="navbar-logo"
        onClick={goToHome}
      />
      <div className="navbar-logo-name" onClick={goToHome}>
        TradeThrill
      </div>
      <div className="search-container">
        <InputBase
          className="searchbar"
          placeholder="Search for items"
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
          onKeyPress={handleKeyPress}
          endAdornment={
            <InputAdornment position="end">
              <SearchIcon className="search-icon" onClick={handleSearch} />
            </InputAdornment>
          }
        />
      </div>
      <div className="menu-toggle" onClick={toggleMobileMenu}>
        <MenuIcon className="menu-icon" />
        {isMobileMenuOpen && (
          <div className="dropdown-menu">
            <ul>
              <li onClick={() => handleMenuItemClick("/profilepage")}>
                Profile
              </li>
              <li onClick={() => handleMenuItemClick("/sellpage")}>
                Sell Item
              </li>
              <li onClick={() => handleMenuItemClick("/chatpage")}>Chat</li>
              <li onClick={() => handleMenuItemClick("/wishlist")}>Wishlist</li>
              <li onClick={() => handleMenuItemClick("/uploadeditems")}>
                Uploaded Items
              </li>
              <li onClick={() => handleMenuItemClick("/notify")}>
                Notifications
              </li>
            </ul>
          </div>
        )}
      </div>
      {isDesktop && (
        <div className="desktop-icons">
          <Tooltip title="Wishlist" placement="bottom">
            <FavoriteBorderIcon
              className="favoriteicon"
              onClick={() => handleMenuItemClick("/wishlist")}
            />
          </Tooltip>
          <Tooltip title="Products on Sale" placement="bottom">
            <StorefrontIcon
              className="uploadedicon"
              onClick={() => handleMenuItemClick("/uploadeditems")}
            />
          </Tooltip>
          <button
            className="navbar-button"
            onClick={() => handleMenuItemClick("/sellpage")}
          >
            SELL
          </button>
          <button
            className="navbar-button"
            onClick={() => handleMenuItemClick("/chatpage")}
          >
            CHAT
          </button>
          <Tooltip title="Notifications" placement="bottom">
            <NotificationsIcon
              className="notificationicon"
              onClick={() => handleMenuItemClick("/notify")}
            />
          </Tooltip>
          <Tooltip title="Profile" placement="bottom">
            <ProfileIcon
              className="profileicon"
              onClick={() => handleMenuItemClick("/profilepage")}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default Navbar;
