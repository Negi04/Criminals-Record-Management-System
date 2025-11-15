import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SearchCriminal from './SearchCriminal';
import './PoliceOfficers.css';

function PoliceOfficers() {
  const [activeTab, setActiveTab] = useState('officers'); // 'officers' or 'search'
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === 'officers') {
      fetchOfficers();
    }
  }, [activeTab]);

  const fetchOfficers = async () => {
    setLoading(true);
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

  return (
    <div className="police-officers-page">
      <h1>Police Officers</h1>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('officers')}
          style={{
            padding: '12px 24px',
            marginRight: '10px',
            backgroundColor: activeTab === 'officers' ? '#3b82f6' : 'transparent',
            color: activeTab === 'officers' ? 'white' : '#475569',
            border: 'none',
            borderBottom: activeTab === 'officers' ? '3px solid #3b82f6' : '3px solid transparent',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'officers' ? '600' : '400',
            fontSize: '16px'
          }}
        >
          Officers List
        </button>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'search' ? '#3b82f6' : 'transparent',
            color: activeTab === 'search' ? 'white' : '#475569',
            border: 'none',
            borderBottom: activeTab === 'search' ? '3px solid #3b82f6' : '3px solid transparent',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'search' ? '600' : '400',
            fontSize: '16px'
          }}
        >
          Search Criminal Details
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'officers' ? (
        <>
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading">Loading police officers...</div>
          ) : officers.length === 0 ? (
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
        </>
      ) : (
        <SearchCriminal />
      )}
    </div>
  );
}

export default PoliceOfficers;

