import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../context/AuthProvider";
import Navbar from "../Navbar/navbar";
import "./transactions.css";

const Transactions = () => {
  const [transactions, setTransactions] = useState({
    sold_results: [],
    bought_results: [],
  }); // Initialize with empty arrays structure
  const { authCreds } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (authCreds.user_id === 0) {
      navigate("/");
    } else {
      axios
        .get(`http://127.0.0.1:8000/get_transactions/${authCreds.user_id}`)
        .then((res) => {
          setTransactions(res.data);
        })
        .catch((error) => {
          console.error("Error fetching transactions:", error);
        });
    }
  }, [authCreds.user_id, navigate]);

  return (
    <>
      <Navbar trans="active" />
      <div className="content-container">
        <h1 className="heading">Your Transactions</h1>
        <div className="transactions-container">
          {/* SOLD ITEMS SECTION */}
          <div className="transaction-listsold">
            <h2 className="transaction-heading">Items Sold</h2>
            {transactions.sold_results &&
            transactions.sold_results.length > 0 ? (
              transactions.sold_results.map((transaction, index) => (
                // Fix: Use index as key since backend doesn't return ID
                <div key={index} className="transaction-item">
                  <div className="transaction-details">
                    <p className="item-name">{transaction.title}</p>
                    <p className="item-description">
                      Description: {transaction.description}
                    </p>
                    <p className="item-cost">
                      Sell Price: Rs.{transaction.cost}
                    </p>
                    <p className="item-id">Buyer Name: {transaction.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No items sold yet.</p>
            )}
          </div>

          {/* BOUGHT ITEMS SECTION */}
          <div className="transaction-listbought">
            <h2 className="transaction-heading">Items Bought</h2>
            {transactions.bought_results &&
            transactions.bought_results.length > 0 ? (
              transactions.bought_results.map((transaction, index) => (
                // Fix: Use index as key since backend doesn't return ID
                <div key={index} className="transaction-item">
                  <div className="transaction-details">
                    <p className="item-name">{transaction.title}</p>
                    <p className="item-description">
                      Description: {transaction.description}
                    </p>
                    <p className="item-cost">
                      Sell Price: Rs.{transaction.cost}
                    </p>
                    <p className="item-id">Seller Name: {transaction.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No items bought yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Transactions;
