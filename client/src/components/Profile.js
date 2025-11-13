import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div>Error loading profile</div>;
  }

  return (
    <div className="profile">
      <h1>Your Profile</h1>
      <div className="profile-details">
        <div className="detail-item">
          <strong>Aadhar ID:</strong> {profile.aadhar_id}
        </div>
        <div className="detail-item">
          <strong>Name:</strong> {profile.name}
        </div>
        <div className="detail-item">
          <strong>Email:</strong> {profile.email}
        </div>
        <div className="detail-item">
          <strong>Role:</strong> {profile.role}
        </div>
        {profile.designation && (
          <div className="detail-item">
            <strong>Designation:</strong> {profile.designation}
          </div>
        )}
        {profile.role === 'police' && (
          <>
            <div className="detail-item">
              <strong>Cases Solved:</strong> {profile.cases_solved || 0}
            </div>
            <div className="detail-item">
              <strong>Ongoing Cases:</strong> {profile.ongoing_cases || 0}
            </div>
          </>
        )}
        <div className="detail-item">
          <strong>Status:</strong> 
          <span className={`status-${profile.status.toLowerCase()}`}>
            {profile.status}
          </span>
        </div>
        <div className="detail-item">
          <strong>Member Since:</strong> {new Date(profile.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export default Profile;