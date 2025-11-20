import axios from "axios"; // Import Axios for making HTTP requests
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./chatpage.css";

function ChatPage() {
  const { userId } = useParams(); // Get the seller's ID from the URL params
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [ws, setWs] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users based on the current user ID
    fetchUsers(userId);

    // WebSocket connection logic remains unchanged
    const newWs = new WebSocket(
      `wss://tradethrill.jitik.online:8000/chat/${userId}`
    );
    newWs.onopen = () => {
      console.log("WebSocket connected");
    };

    newWs.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === "message") {
        setMessages([...messages, data.message]);
      } else if (data.type === "userList") {
        setUsers(data.userList);
      }
    };

    setWs(newWs);

    return () => {
      newWs.close();
    };
  }, [userId]); // Only fetch users when userId changes (component mounts)

  const fetchUsers = async (userId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/users/${userId}`); // Fetch users list based on the current user ID
      setUsers(response.data); // Update the users state with the fetched users list
    } catch (error) {
      console.error("Failed to fetch users:", error.message);
    }
  };

  const sendMessage = () => {
    if (ws && inputMessage.trim() !== "") {
      const message = {
        type: "message",
        content: inputMessage,
        receiver: selectedUser,
      };
      ws.send(JSON.stringify(message));
      setMessages([...messages, message]);
      setInputMessage("");
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    // Clear previous messages
    setMessages([]);
    // Request conversation history with selected user
    const requestHistory = {
      type: "history",
      user: user,
    };
    ws.send(JSON.stringify(requestHistory));
  };

  return (
    <div className="chat-page-container">
      <p className="center-statement">
        *Our team is currently fine-tuning this feature, ironing out any
        existing bugs. Once the debugging process is complete, we'll ensure its
        smooth operation. In the meantime, users can reach out to sellers using
        the email addresses provided in the product listings. We apologize for
        any inconvenience caused and appreciate your patience.
      </p>
      <div className="user-list">
        <h2>Users</h2>
        <ul>
          {users.map((user, index) => (
            <li key={index} onClick={() => selectUser(user)}>
              {user}
            </li>
          ))}
        </ul>
      </div>
      <div className="conversation">
        <h2>
          {selectedUser ? `Conversation with ${selectedUser}` : "Select a user"}
        </h2>
        <div className="message-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.sender === selectedUser
                  ? "sent-message"
                  : "received-message"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
      {/* <p>Work is still under process</p>  */}
    </div>
  );
}
export default ChatPage;
