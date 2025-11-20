import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import "./notifications.css";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const { authCreds } = useContext(AuthContext);

  useEffect(() => {
    if (authCreds.user_id === 0) {
      navigate("/");
    }
  }, [authCreds.user_id, navigate]);

  useEffect(() => {
    if (authCreds.user_id) {
      axios
        .get(`http://127.0.0.1:8000/get_notifications/${authCreds.user_id}`)
        .then((response) => {
          setNotifications(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [authCreds.user_id]);

  const handleAccept = (notification) => {
    if (notification.type === 0) {
      const data = {
        pid: notification.pid,
        seller_id: authCreds.user_id,
        buyer_id: notification.from_id,
      };
      axios
        .post("http://127.0.0.1:8000/notify_accept", data)
        .then((response) => {
          console.log(response);
          // Fix: Identify using pid and from_id instead of missing 'id'
          const updatedNotifications = notifications.map((notif) => {
            if (
              notif.pid === notification.pid &&
              notif.from_id === notification.from_id
            ) {
              return { ...notif, accepted: true };
            }
            return notif;
          });
          setNotifications(updatedNotifications);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const handleDecline = (notification) => {
    if (notification.type === 0) {
      const data = {
        pid: notification.pid,
        seller_id: authCreds.user_id,
        buyer_id: notification.from_id,
      };
      axios
        .post("http://127.0.0.1:8000/notify_reject", data)
        .then((response) => {
          console.log(response);
          // Fix: Filter using pid and from_id
          const updatedNotifications = notifications.filter(
            (notif) =>
              !(
                notif.pid === notification.pid &&
                notif.from_id === notification.from_id
              )
          );
          setNotifications(updatedNotifications);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const renderNotificationType = (type) => {
    switch (type) {
      case 0:
        return "requested to buy ";
      case 1:
        return "sold the product ";
      case 2:
        return "rejected to sell ";
      case 3:
        return "bought the product ";
      case 4:
        return "messaged you ";
      default:
        return "";
    }
  };

  return (
    <div className="notifications">
      <h1 className="notifications-heading">Notifications</h1>
      <div className="notifications-container">
        {notifications
          .slice()
          .reverse()
          .map((notification, index) => (
            // Fix: Use composite key or index since 'id' is missing
            <div
              key={`${notification.pid}-${notification.from_id}-${index}`}
              className="notification"
            >
              <div className="main_notification">
                {`${notification.from_name} ${renderNotificationType(
                  notification.type
                )}: ${notification.product_title}`}
              </div>

              {notification.type === 0 && (
                <div>
                  {notification.accepted ? (
                    <span className="accepted-text">Accepted</span>
                  ) : (
                    <>
                      <button
                        className="accept-btn"
                        onClick={() => handleAccept(notification)}
                      >
                        Accept
                      </button>
                      <button
                        className="decline-btn"
                        onClick={() => handleDecline(notification)}
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              )}
              <div className="action">{notification.time}</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Notifications;
