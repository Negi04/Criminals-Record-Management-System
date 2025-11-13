import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
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

  if (loading) {
    return <div className="loading">Loading pending users...</div>;
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel - User Management</h1>
      {message && <div className="message">{message}</div>}
      
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
    </div>
  );
}

export default AdminPanel;