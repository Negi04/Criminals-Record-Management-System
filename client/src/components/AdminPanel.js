import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchCriminal from './SearchCriminal';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'search'
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'users') {
      fetchPendingUsers();
    }
  }, [activeTab]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/pending-users');
      setPendingUsers(response.data);
    } catch (error) {
      setMessage('Error fetching pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${userId}/status`, { status });
      setMessage(`User ${status} successfully`);
      fetchPendingUsers();
    } catch (error) {
      setMessage('Error updating user status');
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            marginRight: '10px',
            backgroundColor: activeTab === 'users' ? '#3b82f6' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#475569',
            border: 'none',
            borderBottom: activeTab === 'users' ? '3px solid #3b82f6' : '3px solid transparent',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'users' ? '600' : '400',
            fontSize: '16px'
          }}
        >
          User Management
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
      {activeTab === 'users' ? (
        <>
          {message && <div className="message">{message}</div>}
          
          {loading ? (
            <div className="loading">Loading pending users...</div>
          ) : (
            <div className="pending-users">
              <h2>Pending User Registrations</h2>
              {pendingUsers.length === 0 ? (
                <p>No pending user registrations</p>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Aadhar ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.aadhar_id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn-approve"
                            onClick={() => handleStatusUpdate(user.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn-reject"
                            onClick={() => handleStatusUpdate(user.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      ) : (
        <SearchCriminal />
      )}
    </div>
  );
}

export default AdminPanel;