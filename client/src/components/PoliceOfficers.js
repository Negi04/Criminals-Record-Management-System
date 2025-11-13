import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './PoliceOfficers.css';

function PoliceOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/police-officers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOfficers(response.data);
    } catch (error) {
      setError('Error fetching police officers');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

  const getDesignationColor = (designation) => {
    const colors = {
      'Inspector': '#3b82f6',
      'Sub-Inspector': '#8b5cf6',
      'Assistant Sub-Inspector': '#10b981',
      'Head Constable': '#f59e0b',
      'Constable': '#ef4444'
    };
    return colors[designation] || '#64748b';
  };

  if (loading) return <div className="loading">Loading police officers...</div>;

  return (
    <div className="police-officers-page">
      <h1>Police Officers</h1>
      {error && <div className="error-message">{error}</div>}
      
      {officers.length === 0 ? (
        <p>No police officers found.</p>
      ) : (
        <div className="officers-grid">
          {officers.map(officer => (
            <div key={officer.id} className="officer-card">
              <div className="officer-header">
                <div className="officer-avatar">
                  {getInitials(officer.name)}
                </div>
                <div className="officer-info">
                  <h3 className="officer-name">{officer.name}</h3>
                  <span 
                    className="officer-designation"
                    style={{ backgroundColor: getDesignationColor(officer.designation) }}
                  >
                    {officer.designation}
                  </span>
                </div>
              </div>
              
              <div className="officer-stats">
                <div className="stat-item">
                  <div className="stat-label">Cases Solved</div>
                  <div className="stat-value solved">{officer.cases_solved || 0}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Ongoing Cases</div>
                  <div className="stat-value ongoing">{officer.ongoing_cases || 0}</div>
                </div>
              </div>

              {(user.role === 'admin' || user.role === 'police') && (
                <div className="officer-details">
                  <div className="detail-row">
                    <span className="detail-label">Aadhar ID:</span>
                    <span className="detail-value">{officer.aadhar_id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{officer.email}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PoliceOfficers;

