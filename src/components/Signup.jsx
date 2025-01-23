import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ref, set, get } from "firebase/database";
import { realtimeDb } from "./firebase";
import { UserContext } from "./UserContext";

const Signup = () => {
  const [data, setData] = useState({
    userId: "",
    firstname: "",
    email: "",
    password: "",
  });
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const changeHandler = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const userIdRef = ref(realtimeDb, `Authentication/${data.userId}`);
    const snapshot = await get(userIdRef);

    if (snapshot.exists()) {
      alert("User ID already exists. Please choose a different one.");
      return;
    }

    set(userIdRef, data)
      .then(() => {
        alert("Registration successful!");
        // Set all user details in context
        setUser(data);
        navigate("/chat"); // Redirect to chat after successful signup
      })
      .catch((err) => {
        console.error(err);
        alert("Error during registration. Please try again.");
      });
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-form">
          <h1 className="signup-title">Registration Page</h1>
          <form className="signup-form-body" onSubmit={submitHandler}>
            <label className="signup-label">User ID (Unique):</label>
            <input
              className="signup-input"
              type="text"
              required
              name="userId"
              placeholder="Enter a unique user ID"
              onChange={changeHandler}
            />
            <br />
            <label className="signup-label">First Name:</label>
            <input
              className="signup-input"
              type="text"
              required
              name="firstname"
              placeholder="Enter your first name"
              onChange={changeHandler}
            />
            <br />
            <label className="signup-label">Email:</label>
            <input
              className="signup-input"
              type="email"
              required
              name="email"
              placeholder="Enter your email"
              onChange={changeHandler}
            />
            <br />
            <label className="signup-label">Password:</label>
            <input
              className="signup-input"
              type="password"
              required
              name="password"
              placeholder="Enter your password"
              onChange={changeHandler}
            />
            <br />
            <button className="signup-button" type="submit">
              Signup
            </button>
          </form>
          <p className="signup-login-link">
            Already registered?{" "}
            <button
              className="login-navigation-button"
              onClick={() => navigate("/login")}
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
