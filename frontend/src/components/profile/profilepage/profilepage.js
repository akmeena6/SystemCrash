import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../context/AuthProvider";
import Navbar from "../Navbar/navbar";
import "./profilepage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { authCreds, setAuthCreds } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize local state with context data
  const [newUserData, setNewUserData] = useState({
    name: authCreds.name,
    user_id: authCreds.user_id,
    email: authCreds.email,
    profile_pic: authCreds.profile_pic,
  });

  const [newProfilePic, setNewProfilePic] = useState(null);

  useEffect(() => {
    if (!authCreds.user_id) {
      navigate("/");
    }
  }, [authCreds.user_id, navigate]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewProfilePic(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData({
      ...newUserData,
      [name]: value,
    });
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();

    if (isEditing && !newUserData.name.trim()) {
      alert("Name cannot be empty");
      return;
    }

    try {
      // 1. Update Backend
      if (newProfilePic) {
        // Scenario A: Updating Name AND Photo
        const formData = new FormData();
        formData.append(
          "data",
          JSON.stringify({
            user_id: newUserData.user_id,
            name: newUserData.name,
          })
        );
        formData.append("file", newProfilePic);

        await axios.post("http://127.0.0.1:8000/edit_profile", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Scenario B: Updating Name ONLY
        await axios.post("http://127.0.0.1:8000/edit_name", {
          user_id: newUserData.user_id,
          name: newUserData.name,
        });
      }

      // 2. Refresh Context Data (The Fix)
      // We call 'view_profile' instead of 'login' because we don't have the password here.
      const res = await axios.get(
        `http://127.0.0.1:8000/view_profile?user_id=${newUserData.user_id}`
      );

      if (res.data) {
        setAuthCreds((prev) => ({
          ...prev,
          name: res.data.name,
          profile_pic: res.data.pic, // Backend returns base64 string here
          email: res.data.email,
        }));

        // Update local state to match
        setNewUserData((prev) => ({
          ...prev,
          name: res.data.name,
          profile_pic: res.data.pic,
        }));
      }

      setIsEditing(false);
      setNewProfilePic(null); // Clear the file input
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to update profile.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="profile-containers">
        <div className="profile-container">
          <section className="profile-section">
            <div className="matter">
              <div className="xyz">
                <div className="abc">
                  <div id="profile-pic">
                    {isEditing && (
                      <div>
                        <label htmlFor="newProfilePic">
                          Change Profile Picture:
                        </label>
                        <input
                          type="file"
                          id="newProfilePic"
                          name="newProfilePic"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    )}

                    {/* Image Logic: Show Preview if editing & file selected, otherwise show Context Image */}
                    {isEditing && newProfilePic ? (
                      <img
                        src={URL.createObjectURL(newProfilePic)}
                        alt="Preview"
                        className="user-image"
                      />
                    ) : (
                      <img
                        src={
                          authCreds.profile_pic
                            ? `data:image/png;base64,${authCreds.profile_pic}`
                            : "default_image_path_here.png"
                        }
                        alt="Profile"
                        className="user-image"
                      />
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form>
                    <div className="text">
                      <div>
                        <span className="ar">
                          <pre style={{ display: "inline-block" }}>NAME :</pre>
                        </span>
                        <input
                          type="text"
                          id="name"
                          className="br"
                          name="name"
                          value={newUserData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="btn">
                      <button
                        type="submit"
                        onClick={handleSaveClick}
                        className="button"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text">
                    <span className="br">Name: {authCreds.name}</span>
                    <span className="br">
                      IITK Roll Number: {authCreds.user_id}
                    </span>
                    <span className="br">Email: {authCreds.email}</span>
                  </div>
                )}
              </div>
              <div className="btn right-align">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="button"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
