import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { ref, get } from "firebase/database";
import { realtimeDb } from "./firebase";

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const [userData, setUserData] = useState({
    firstname: "",
    email: "",
    password: "",
  });

  const [showBackupMessage, setShowBackupMessage] = useState(false);

  useEffect(() => {
    if (user && user.userId) {
      const userRef = ref(realtimeDb, `Authentication/${user.userId}`); // Correct the path here

      // Fetch user data from the database
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          } else {
            console.error("No user data found in the database.");
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, [user]);

  const handleChatBackupRequest = () => {
    setShowBackupMessage(true);
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Profile</h1>
      <div className="dashboard-details">
        <div className="dashboard-detail">
          <strong>UserId:</strong> {userData.userId || "N/A"}
        </div>
        <div className="dashboard-detail">
          <strong>First Name:</strong> {userData.firstname || "N/A"}
        </div>
        <div className="dashboard-detail">
          <strong>Email:</strong> {userData.email || "N/A"}
        </div>
        <div className="dashboard-detail">
          <strong>Password:</strong> {userData.password || "N/A"}
        </div>
        <div
          className="flex"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <button
            className="chat-button logout-button"
            onClick={() => {
              localStorage.removeItem("user"); // Clear login info
              window.location.href = "/"; // Redirect to login
            }}
          >
            Logout
          </button>
          <button className="chat-button" onClick={handleChatBackupRequest}>
            Request Chat Backup
          </button>
        </div>
        <div className="chat-backup-section">
          {showBackupMessage && (
            <div className="chat-backup-message">
              <p>
                Chat Backup Request:
                <br />
                Please email us at <strong>wind090504@gmail.com</strong> with
                the following details:
              </p>
              <ul>
                <li>
                  Your User ID: <strong>{user?.userId || "N/A"}</strong>
                </li>
                <li>
                  Other User ID: <strong>[Enter the Other User ID]</strong>
                </li>
                <li>
                  Message: "Please send the chat backup for the conversation
                  between the above users."
                </li>
              </ul>
              <p>
                The chat backup will be sent to your registered email within 10
                days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
