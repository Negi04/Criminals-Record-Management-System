import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css'; // This is the file we will update next

function Dashboard() {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    switch (user.role) {
      case 'admin':
        return `Hello, System Administrator ${user.name}`;
      case 'police':
        return `Hello, Officer ${user.name}`;
      default:
        return `Welcome, ${user.name}`;
    }
  };

  const getFeatures = () => {
    // ... (Your getFeatures function remains exactly the same, no changes needed here)
    const baseFeatures = [
      'View your profile',
      'Search criminal records'
    ];

    if (user.role === 'admin') {
      return [
        ...baseFeatures,
        'Manage user registrations',
        'View all criminal records',
        'Add/Edit criminal records',
        'Update criminal status'
      ];
    } else if (user.role === 'police') {
      return [
        ...baseFeatures,
        'View all criminal records',
        'Add new criminal records',
        'Update criminal status'
      ];
    } else {
      return [
        ...baseFeatures,
        'View public criminal records (arrested/convicted only)'
      ];
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{getWelcomeMessage()}</h1>
        <p className="dashboard-subtitle">Your access level: <strong>{user.role}</strong></p>
      </div>

      <div className="dashboard-content">
        <div className="info-card">
          <h2>Your Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value">{user.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Aadhar ID</span>
              <span className="info-value">{user.aadhar_id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>
          </div>
        </div>
        
        <div className="info-card">
          <h2>Available Features</h2>
          <ul className="features-list">
            {getFeatures().map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;