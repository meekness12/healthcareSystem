// src/components/Header.jsx
import React from "react";

const Header = ({ user, onLogout }) => (
  <header className="header">
    <h2>Welcome, {user.name}</h2>
    <button className="logout-btn" onClick={onLogout}>
      Logout
    </button>
  </header>
);

export default Header;
