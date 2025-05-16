import React, { useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "./UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Restore user data from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser && !user) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser?.userId) {
        setUser(parsedUser);
      }
    }
  }, [user, setUser]);

  const handleUserClick = () => {
    if (user && user.userId) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <header className="header">
      <div className="header-logo">CipherThread</div>
      {!isAuthPage && (
        <div className="header-user" onClick={handleUserClick}>
          <span className="header-user-id">{user?.userId || "Login"}</span>
          <FontAwesomeIcon icon={faUserCircle} className="header-logo-icon" />
        </div>
      )}
    </header>
  );
};

export default Header;
