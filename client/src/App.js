// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import the new layout and sidebar
import MainLayout from './MainLayout';
import Sidebar from './components/Sidebar'; // Though used in MainLayout, good to be aware of it

// Import Pages
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import CriminalManagement from './components/CriminalManagement';
import SearchCriminal from './components/SearchCriminal';
import Profile from './components/Profile';
import PoliceOfficers from './components/PoliceOfficers';

// Import Global Styles
import './App.css';

// A wrapper for routes that should only be accessible to logged-in users
function PrivateRoutes() {
  const { user } = useAuth();
  return user ? <MainLayout /> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes - No sidebar here */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/dashboard" />} 
        />

        {/* Private Routes - All these will have the new sidebar layout */}
        <Route element={<PrivateRoutes />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/criminals" element={<CriminalManagement />} />
          <Route path="/search" element={<SearchCriminal />} />
          <Route path="/police-officers" element={<PoliceOfficers />} />
          <Route path="/profile" element={<Profile />} />
          <Route 
            path="/admin" 
            element={user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />} 
          />
        </Route>

        {/* Fallback route to redirect users */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </div>
  );
}

export default App;