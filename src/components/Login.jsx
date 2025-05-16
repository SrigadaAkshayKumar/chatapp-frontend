import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { realtimeDb } from "./firebase";
import { UserContext } from "./UserContext";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState({ message: "", type: "" });
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const showPopup = (message, type = "info") => {
    setPopup({ message, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  };

  const handleLogin = async () => {
    try {
      const userRef = ref(realtimeDb, `Authentication/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.password === password) {
          showPopup("Logged in successfully!", "success");

          // Store in context and localStorage for persistence
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));

          // Redirect to chat after short delay
          setTimeout(() => navigate("/chat"), 1500);
        } else {
          showPopup("Incorrect password.", "error");
        }
      } else {
        showPopup("User ID not found.", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showPopup("Login error. Try again.", "error");
    }
  };

  return (
    <div className="login-container">
      {popup.message && (
        <div className={`popup ${popup.type}`}>{popup.message}</div>
      )}
      <h1 className="login-title">Login</h1>
      <input
        className="login-input"
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <input
        className="login-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="login-button" onClick={handleLogin}>
        Login
      </button>
      <p className="signup-login-link">
        Not registered?{" "}
        <button
          className="login-navigation-button"
          onClick={() => navigate("/Signup")}
        >
          Signup here
        </button>
      </p>
      <p className="signup-login-link">
        Learn How to use CipherThread?{" "}
        <button
          className="login-navigation-button"
          onClick={() => navigate("/Use")}
        >
          click here
        </button>
      </p>
    </div>
  );
};

export default Login;
