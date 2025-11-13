import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './CriminalManagement.css';

function CriminalManagement() {
  const [criminals, setCriminals] = useState([]);
  const [filteredCriminals, setFilteredCriminals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  
  // State for the Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCriminal, setEditingCriminal] = useState(null);

  const [formData, setFormData] = useState({
    aadhar_id: '', name: '', age: '', gender: '', address: '', crime_type: '',
    crime_details: '', crime_date: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editSelectedPhoto, setEditSelectedPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);

  useEffect(() => {
    fetchCriminals();
  }, []);

  // Create preview URLs and cleanup
  useEffect(() => {
    if (selectedPhoto) {
      const url = URL.createObjectURL(selectedPhoto);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedPhoto]);

  useEffect(() => {
    if (editSelectedPhoto) {
      const url = URL.createObjectURL(editSelectedPhoto);
      setEditPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setEditPreviewUrl(null);
    }
  }, [editSelectedPhoto]);

  const fetchCriminals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/criminals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCriminals(response.data);
      setFilteredCriminals(response.data);
    } catch (error) {
      setMessage('Error fetching criminals');
    } finally {
      setLoading(false);
    }
  };

  // Filter criminals by name
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCriminals(criminals);
    } else {
      const filtered = criminals.filter(criminal =>
        criminal.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCriminals(filtered);
    }
  }, [searchTerm, criminals]);

  const handleChange = (e) => {
    if (e.target.name === 'photo') {
      setSelectedPhoto(e.target.files[0]);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (selectedPhoto) {
        formDataToSend.append('photo', selectedPhoto);
      }
      
      const response = await axios.post('http://localhost:5000/api/criminals', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage('Criminal record added successfully');
      setShowAddForm(false);
      setFormData({
        aadhar_id: '', name: '', age: '', gender: '', address: '', crime_type: '',
        crime_details: '', crime_date: ''
      });
      setSelectedPhoto(null);
      fetchCriminals();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error adding criminal record');
    }
  };
  
  const handleStatusUpdate = async (criminalId, status) => {
    // ... (This function is the same as before)
  };

  const handleEditClick = (criminal) => {
    setEditingCriminal(criminal);
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    if (e.target.name === 'photo') {
      setEditSelectedPhoto(e.target.files[0]);
    } else {
      setEditingCriminal({ ...editingCriminal, [e.target.name]: e.target.value });
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(editingCriminal).forEach(key => {
        if (key !== 'id' && key !== 'imageUrl' && editingCriminal[key] !== undefined) {
          formDataToSend.append(key, editingCriminal[key]);
        }
      });
      
      // Add photo if a new one was selected
      if (editSelectedPhoto) {
        formDataToSend.append('photo', editSelectedPhoto);
      }
      
      await axios.put(`http://localhost:5000/api/criminals/${editingCriminal.id}`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage('Criminal record updated successfully');
      setIsEditModalOpen(false);
      setEditingCriminal(null);
      setEditSelectedPhoto(null);
      fetchCriminals();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error updating criminal record');
    }
  };

  const canAddCriminal = user.role === 'admin' || user.role === 'police';
  const canUpdateStatus = user.role === 'admin' || user.role === 'police';

  if (loading) return <div className="loading">Loading criminal records...</div>;

  const getInitials = (name) => {
    if (!name) return '??';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="criminal-management-page">
      <h1>Criminal Records Management</h1>
      {message && <div className="message">{message}</div>}
      
      {/* --- THIS SECTION IS NOW RESTORED --- */}
      {canAddCriminal && (
        <div className="add-criminal-section">
          <button className="btn-primary" onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) {
              setFormData({
                aadhar_id: '', name: '', age: '', gender: '', address: '', crime_type: '',
                crime_details: '', crime_date: ''
              });
              setSelectedPhoto(null);
            }
          }}>
            {showAddForm ? 'Cancel' : 'Add New Criminal'}
          </button>
          
          {showAddForm && (
            <form onSubmit={handleSubmit} className="add-criminal-form" encType="multipart/form-data">
              <h3>Add New Criminal Record</h3>
              <div className="form-group">
                <label>Aadhar ID</label>
                <input type="text" name="aadhar_id" value={formData.aadhar_id} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Crime Type</label>
                <input type="text" name="crime_type" value={formData.crime_type} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Crime Details</label>
                <textarea name="crime_details" value={formData.crime_details} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Crime Date</label>
                <input type="date" name="crime_date" value={formData.crime_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Photo</label>
                <div style={{ marginBottom: '10px' }}>
                  <label 
                    htmlFor="photo-upload-add" 
                    style={{ 
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      marginBottom: '10px'
                    }}
                  >
                    Browse from Local PC
                  </label>
                  <input 
                    type="file" 
                    id="photo-upload-add"
                    name="photo" 
                    accept="image/*" 
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                </div>
                {selectedPhoto && previewUrl && (
                  <div className="photo-preview" style={{ marginTop: '10px' }}>
                    <p style={{ marginBottom: '10px', fontWeight: '500' }}>Selected: {selectedPhoto.name}</p>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                    />
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary">Add Criminal Record</button>
            </form>
          )}
        </div>
      )}

      <div className="criminals-list">
        <div className="search-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <label htmlFor="criminal-search" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
            Search by Name:
          </label>
          <input
            id="criminal-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter criminal name to search..."
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 15px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          {searchTerm && (
            <p style={{ marginTop: '8px', color: '#64748b', fontSize: '0.9rem' }}>
              Showing {filteredCriminals.length} of {criminals.length} criminals
            </p>
          )}
        </div>
        
        <table className="criminals-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Aadhar ID</th>
              <th>Crime Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCriminals.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  {searchTerm ? 'No criminals found matching your search.' : 'No criminal records available.'}
                </td>
              </tr>
            ) : (
              filteredCriminals.map(criminal => (
              <tr key={criminal.id}>
                <td>
                  {criminal.imageUrl ? (
                    <img 
                      src={criminal.imageUrl.startsWith('http') ? criminal.imageUrl : `http://localhost:5000${criminal.imageUrl}`} 
                      alt={criminal.name} 
                      className="criminal-photo" 
                    />
                  ) : (
                    <div className="photo-placeholder">{getInitials(criminal.name)}</div>
                  )}
                </td>
                <td><span className="criminal-name">{criminal.name}</span></td>
                <td>{criminal.aadhar_id}</td>
                <td>{criminal.crime_type}</td>
                <td><span className={`status-badge status-${criminal.status.toLowerCase()}`}>{criminal.status}</span></td>
                <td>
                  <button className="btn-primary" onClick={() => handleEditClick(criminal)}>
                    Edit
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- The Edit Modal remains the same --- */}
      {isEditModalOpen && editingCriminal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsEditModalOpen(false);
            setEditSelectedPhoto(null);
            setEditPreviewUrl(null);
            setEditingCriminal(null);
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Criminal Record</h2>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(false);
                  setEditSelectedPhoto(null);
                  setEditPreviewUrl(null);
                  setEditingCriminal(null);
                }} 
                className="close-button"
                title="Close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Aadhar ID</label>
                  <input type="text" name="aadhar_id" value={editingCriminal.aadhar_id || ''} onChange={handleEditFormChange} />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" name="name" value={editingCriminal.name || ''} onChange={handleEditFormChange} />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" name="age" value={editingCriminal.age || ''} onChange={handleEditFormChange} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={editingCriminal.gender || ''} onChange={handleEditFormChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea name="address" value={editingCriminal.address || ''} onChange={handleEditFormChange} rows="3" />
                </div>
                <div className="form-group">
                  <label>Crime Type</label>
                  <input type="text" name="crime_type" value={editingCriminal.crime_type || ''} onChange={handleEditFormChange} />
                </div>
                <div className="form-group">
                  <label>Crime Details</label>
                  <textarea name="crime_details" value={editingCriminal.crime_details || ''} onChange={handleEditFormChange} rows="3" />
                </div>
                <div className="form-group">
                  <label>Crime Date</label>
                  <input type="date" name="crime_date" value={editingCriminal.crime_date || ''} onChange={handleEditFormChange} />
                </div>
                <div className="form-group">
                  <label style={{ marginBottom: '10px', display: 'block', fontWeight: '500' }}>Photo</label>
                  {editingCriminal.imageUrl && !editSelectedPhoto && (
                    <div className="current-photo" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <p style={{ marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Current Photo:</p>
                      <img 
                        src={`http://localhost:5000${editingCriminal.imageUrl}`} 
                        alt="Current" 
                        style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '2px solid #e2e8f0' }} 
                      />
                    </div>
                  )}
                  <div style={{ marginBottom: '15px', display: 'block' }}>
                    <label 
                      htmlFor="photo-upload-edit" 
                      style={{ 
                        display: 'inline-block',
                        padding: '0.6rem 1.2rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        border: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      📁 Browse from Local PC
                    </label>
                    <input 
                      type="file" 
                      id="photo-upload-edit"
                      name="photo" 
                      accept="image/*" 
                      onChange={handleEditFormChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {editSelectedPhoto && editPreviewUrl && (
                    <div className="photo-preview" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <p style={{ marginBottom: '10px', fontWeight: '500', color: '#475569' }}>New Photo Selected: {editSelectedPhoto.name}</p>
                      <img 
                        src={editPreviewUrl} 
                        alt="Preview" 
                        style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(false);
                    setEditSelectedPhoto(null);
                    setEditPreviewUrl(null);
                    setEditingCriminal(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CriminalManagement;