// src/components/Sidebar.js

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css'; // We will create this CSS file next

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h3>CRMS</h3>
        <span>Criminal Records</span>
      </div>
      
      <div className="sidebar-links">
        {/* We use NavLink here because it automatically adds an 'active' class to the current page's link */}
        <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
        <NavLink to="/criminals" className="nav-link">Criminal Records</NavLink>
        <NavLink to="/search" className="nav-link">Search</NavLink>
        <NavLink to="/police-officers" className="nav-link">Police Officers</NavLink>
        {user.role === 'admin' && (
          <NavLink to="/admin" className="nav-link">Admin Panel</NavLink>
        )}
      </div>
      
      <div className="sidebar-footer">
        <div className="user-profile">
            <NavLink to="/profile" className="profile-link">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
            </NavLink>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;