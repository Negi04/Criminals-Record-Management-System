import React, { useState } from 'react';
import axios from 'axios';

function SearchCriminal() {
  const [searchType, setSearchType] = useState('aadhar'); // 'aadhar' or 'name'
  const [aadharId, setAadharId] = useState('');
  const [name, setName] = useState('');
  const [criminal, setCriminal] = useState(null);
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setCriminal(null);
    setCriminals([]);
    
    const token = localStorage.getItem('token');

    if (searchType === 'aadhar') {
      if (!aadharId) {
        setError('Please enter Aadhar ID');
        return;
      }

      if (aadharId.length !== 12) {
        setError('Aadhar ID must be 12 digits');
        return;
      }

      setLoading(true);

      try {
        const response = await axios.get(`http://localhost:5000/api/criminals/search?aadhar_id=${aadharId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCriminal(response.data);
      } catch (error) {
        setError(error.response?.data?.error || 'Error searching criminal');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name || name.trim() === '') {
        setError('Please enter a name');
        return;
      }

      setLoading(true);

      try {
        const response = await axios.get(`http://localhost:5000/api/criminals/search/name?name=${encodeURIComponent(name.trim())}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCriminals(response.data);
        if (response.data.length === 1) {
          setCriminal(response.data[0]);
        }
      } catch (error) {
        setError(error.response?.data?.error || 'Error searching criminals');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderCriminalDetails = (criminalData) => (
    <div className="criminal-details">
      <div className="details-grid">
        <div className="detail-item">
          <strong>Aadhar ID:</strong> {criminalData.aadhar_id}
        </div>
        <div className="detail-item">
          <strong>Name:</strong> {criminalData.name}
        </div>
        <div className="detail-item">
          <strong>Age:</strong> {criminalData.age || 'N/A'}
        </div>
        <div className="detail-item">
          <strong>Gender:</strong> {criminalData.gender || 'N/A'}
        </div>
        <div className="detail-item">
          <strong>Address:</strong> {criminalData.address || 'N/A'}
        </div>
        <div className="detail-item">
          <strong>Crime Type:</strong> {criminalData.crime_type}
        </div>
        <div className="detail-item">
          <strong>Crime Details:</strong> {criminalData.crime_details || 'N/A'}
        </div>
        <div className="detail-item">
          <strong>Crime Date:</strong> {criminalData.crime_date ? new Date(criminalData.crime_date).toLocaleDateString() : 'N/A'}
        </div>
        <div className="detail-item">
          <strong>Status:</strong> 
          <span className={`status-${criminalData.status.toLowerCase()}`}>
            {criminalData.status}
          </span>
        </div>
        {criminalData.officer_name && (
          <div className="detail-item">
            <strong>Arresting Officer:</strong> {criminalData.officer_name}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="search-criminal">
      <h1>Search Criminal Records</h1>
      
      <div className="search-type-selector" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => {
            setSearchType('aadhar');
            setError('');
            setCriminal(null);
            setCriminals([]);
            setAadharId('');
            setName('');
          }}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: searchType === 'aadhar' ? '#3b82f6' : '#e2e8f0',
            color: searchType === 'aadhar' ? 'white' : '#475569',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: searchType === 'aadhar' ? '600' : '400'
          }}
        >
          Search by Aadhar ID
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchType('name');
            setError('');
            setCriminal(null);
            setCriminals([]);
            setAadharId('');
            setName('');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: searchType === 'name' ? '#3b82f6' : '#e2e8f0',
            color: searchType === 'name' ? 'white' : '#475569',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: searchType === 'name' ? '600' : '400'
          }}
        >
          Search by Name
        </button>
      </div>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <label>{searchType === 'aadhar' ? 'Enter Aadhar ID:' : 'Enter Name:'}</label>
          {searchType === 'aadhar' ? (
            <input
              type="text"
              value={aadharId}
              onChange={(e) => setAadharId(e.target.value)}
              placeholder="12-digit Aadhar ID"
              maxLength="12"
              pattern="[0-9]{12}"
            />
          ) : (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter criminal name"
            />
          )}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {criminal && (
        <div>
          <h2>Criminal Record Found</h2>
          {renderCriminalDetails(criminal)}
        </div>
      )}

      {criminals.length > 1 && (
        <div>
          <h2>Found {criminals.length} Criminal Records</h2>
          {criminals.map((criminalData, index) => (
            <div key={criminalData.id} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Record {index + 1}</h3>
              {renderCriminalDetails(criminalData)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchCriminal;