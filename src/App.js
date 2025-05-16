import React from "react";
import { UserProvider } from "./components/UserContext";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import Errorpage from "./components/Errorpage";
import Header from "./components/Header";
import Use from "./components/Use";

const App = () => {
  return (
    <UserProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/chat" />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Use" element={<Use />} />
          <Route path="*" element={<Errorpage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;
