// src/MainLayout.js

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import './MainLayout.css'; // We will create this file next

function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="content-area">
        <Outlet /> 
        {/* Outlet is a placeholder where React Router will render the current page (e.g., Dashboard) */}
      </main>
    </div>
  );
}

export default MainLayout;