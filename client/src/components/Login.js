import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // This CSS will be updated in the next step

function Login() {
  const [formData, setFormData] = useState({
    aadhar_id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.aadhar_id, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-background">
      <div className="login-container">
        <div className="login-form-header">
          {/* --- NEW: Added an icon for a more professional look --- */}
          <div className="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"></path>
            </svg>
          </div>
          <h2>System Access</h2>
          <p>Criminal Record Management System</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="aadhar_id">Aadhar ID</label>
            <input
              id="aadhar_id"
              type="text"
              name="aadhar_id"
              placeholder="Enter your 12-digit Aadhar ID"
              value={formData.aadhar_id}
              onChange={handleChange}
              required
              maxLength="12"
              pattern="[0-9]{12}"
              title="Aadhar ID must be 12 digits"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        
        <div className="login-form-footer">
          <p>
            Don't have an account? <Link to="/register">Register Here</Link>
          </p>
          <div className="demo-info">
            <strong>Demo:</strong> Admin: 123456789012 / admin123
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;