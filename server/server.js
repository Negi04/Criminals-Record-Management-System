const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret_key_here';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'criminal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Database initialization
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aadhar_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'police', 'user')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Criminals table
  db.run(`CREATE TABLE IF NOT EXISTS criminals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aadhar_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    address TEXT,
    crime_type TEXT NOT NULL,
    crime_details TEXT,
    crime_date TEXT,
    status TEXT DEFAULT 'wanted' CHECK(status IN ('wanted', 'arrested', 'convicted', 'released')),
    imageUrl TEXT,
    arresting_officer_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(arresting_officer_id) REFERENCES users(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
  )`);

  // Add imageUrl column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE criminals ADD COLUMN imageUrl TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Add police officer specific columns to users table
  db.run(`ALTER TABLE users ADD COLUMN designation TEXT`, (err) => {
    // Ignore error if column already exists
  });
  db.run(`ALTER TABLE users ADD COLUMN cases_solved INTEGER DEFAULT 0`, (err) => {
    // Ignore error if column already exists
  });
  db.run(`ALTER TABLE users ADD COLUMN ongoing_cases INTEGER DEFAULT 0`, (err) => {
    // Ignore error if column already exists
  });

  // Create default admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (aadhar_id, name, email, password, role, status) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
          ['123456789012', 'System Admin', 'admin@crimerecords.com', adminPassword, 'admin', 'approved']);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Routes

// User registration (only admin can approve)
app.post('/api/register', async (req, res) => {
  const { aadhar_id, name, email, password, role } = req.body;

  if (!aadhar_id || !name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (aadhar_id.length !== 12) {
    return res.status(400).json({ error: 'Aadhar ID must be 12 digits' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(`INSERT INTO users (aadhar_id, name, email, password, role, status) 
            VALUES (?, ?, ?, ?, ?, 'pending')`, 
            [aadhar_id, name, email, hashedPassword, role], 
            function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Aadhar ID already registered' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({ 
        message: 'Registration successful. Waiting for admin approval.',
        userId: this.lastID 
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { aadhar_id, password } = req.body;

  if (!aadhar_id || !password) {
    return res.status(400).json({ error: 'Aadhar ID and password are required' });
  }

  db.get(`SELECT * FROM users WHERE aadhar_id = ?`, [aadhar_id], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'approved') {
      return res.status(400).json({ error: 'Account pending approval' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, aadhar_id: user.aadhar_id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        aadhar_id: user.aadhar_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

// Get pending user requests (admin only)
app.get('/api/pending-users', authenticateToken, requireRole(['admin']), (req, res) => {
  db.all(`SELECT id, aadhar_id, name, email, role, created_at FROM users WHERE status = 'pending'`, 
         (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Approve/reject user (admin only)
app.put('/api/users/:id/status', authenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(`UPDATE users SET status = ? WHERE id = ?`, [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User ${status} successfully` });
  });
});

// Criminal management routes

// Add criminal (police only)
app.post('/api/criminals', authenticateToken, requireRole(['police', 'admin']), upload.single('photo'), (req, res) => {
  const { aadhar_id, name, age, gender, address, crime_type, crime_details, crime_date } = req.body;
  const created_by = req.user.id;

  if (!aadhar_id || !name || !crime_type) {
    return res.status(400).json({ error: 'Aadhar ID, name, and crime type are required' });
  }

  let imageUrl = null;
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  db.run(`INSERT INTO criminals (aadhar_id, name, age, gender, address, crime_type, crime_details, crime_date, imageUrl, created_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [aadhar_id, name, age, gender, address, crime_type, crime_details, crime_date, imageUrl, created_by], 
          function(err) {
    if (err) {
      // If upload was successful but database insert failed, delete the uploaded file
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Criminal with this Aadhar ID already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({ 
      message: 'Criminal record added successfully',
      criminalId: this.lastID 
    });
  });
});

// Get all criminals (police and admin can see all, users see limited)
app.get('/api/criminals', authenticateToken, (req, res) => {
  let query = `SELECT c.*, u.name as officer_name FROM criminals c LEFT JOIN users u ON c.arresting_officer_id = u.id`;
  let params = [];

  // Regular users can only see arrested/convicted criminals
  if (req.user.role === 'user') {
    query += ` WHERE c.status IN ('arrested', 'convicted')`;
  }

  query += ` ORDER BY c.created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Update criminal status (police and admin only)
app.put('/api/criminals/:id/status', authenticateToken, requireRole(['police', 'admin']), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['wanted', 'arrested', 'convicted', 'released'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Get current criminal record to check previous status and officer
  db.get(`SELECT status, arresting_officer_id, created_by FROM criminals WHERE id = ?`, [id], (err, criminal) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!criminal) {
      return res.status(404).json({ error: 'Criminal not found' });
    }

    let arresting_officer_id = null;
    if (status === 'arrested') {
      arresting_officer_id = req.user.id;
    } else {
      arresting_officer_id = criminal.arresting_officer_id;
    }

    db.run(`UPDATE criminals SET status = ?, arresting_officer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, 
           [status, arresting_officer_id, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Criminal not found' });
      }

      // Update officer statistics
      const officerId = arresting_officer_id || criminal.created_by;
      if (officerId) {
        // Count solved cases (arrested or convicted)
        db.get(`SELECT COUNT(*) as count FROM criminals WHERE arresting_officer_id = ? AND status IN ('arrested', 'convicted')`, 
               [officerId], (err, solved) => {
          if (!err && solved) {
            // Count ongoing cases (wanted or arrested)
            db.get(`SELECT COUNT(*) as count FROM criminals WHERE (arresting_officer_id = ? OR created_by = ?) AND status IN ('wanted', 'arrested')`, 
                   [officerId, officerId], (err, ongoing) => {
              if (!err && ongoing) {
                db.run(`UPDATE users SET cases_solved = ?, ongoing_cases = ? WHERE id = ?`, 
                       [solved.count, ongoing.count, officerId]);
              }
            });
          }
        });
      }

      res.json({ message: 'Criminal status updated successfully' });
    });
  });
});

// Search criminals by Aadhar ID
app.get('/api/criminals/search', authenticateToken, (req, res) => {
  const { aadhar_id } = req.query;

  if (!aadhar_id) {
    return res.status(400).json({ error: 'Aadhar ID is required for search' });
  }

  let query = `SELECT c.*, u.name as officer_name FROM criminals c LEFT JOIN users u ON c.arresting_officer_id = u.id WHERE c.aadhar_id = ?`;
  
  // Regular users can only see arrested/convicted criminals
  if (req.user.role === 'user') {
    query += ` AND c.status IN ('arrested', 'convicted')`;
  }

  db.get(query, [aadhar_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'No criminal found with this Aadhar ID' });
    }

    res.json(row);
  });
});

// Search criminals by name
app.get('/api/criminals/search/name', authenticateToken, (req, res) => {
  const { name } = req.query;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required for search' });
  }

  let query = `SELECT c.*, u.name as officer_name FROM criminals c LEFT JOIN users u ON c.arresting_officer_id = u.id WHERE c.name LIKE ?`;
  let params = [`%${name.trim()}%`];
  
  // Regular users can only see arrested/convicted criminals
  if (req.user.role === 'user') {
    query += ` AND c.status IN ('arrested', 'convicted')`;
  }

  query += ` ORDER BY c.name ASC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No criminals found with this name' });
    }

    res.json(rows);
  });
});

// Update criminal record (police and admin only)
app.put('/api/criminals/:id', authenticateToken, requireRole(['police', 'admin']), upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { aadhar_id, name, age, gender, address, crime_type, crime_details, crime_date } = req.body;

  // Get existing criminal to check if we need to delete old image
  db.get(`SELECT imageUrl FROM criminals WHERE id = ?`, [id], (err, criminal) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!criminal) {
      return res.status(404).json({ error: 'Criminal not found' });
    }

    // Build update query dynamically based on what's provided
    const updates = [];
    const values = [];
    
    let imageUrl = criminal.imageUrl;
    
    // If a new photo was uploaded
    if (req.file) {
      // Delete old image if it exists
      if (criminal.imageUrl && criminal.imageUrl.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, criminal.imageUrl);
        fs.unlink(oldImagePath, (err) => {
          // Ignore error if file doesn't exist
        });
      }
      imageUrl = `/uploads/${req.file.filename}`;
      updates.push('imageUrl = ?');
      values.push(imageUrl);
    }

    if (aadhar_id !== undefined) {
      updates.push('aadhar_id = ?');
      values.push(aadhar_id);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (age !== undefined) {
      updates.push('age = ?');
      values.push(age);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (crime_type !== undefined) {
      updates.push('crime_type = ?');
      values.push(crime_type);
    }
    if (crime_details !== undefined) {
      updates.push('crime_details = ?');
      values.push(crime_details);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const query = `UPDATE criminals SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
      if (err) {
        // If database update failed but file was uploaded, delete the new file
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Criminal record updated successfully' });
    });
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(`SELECT id, aadhar_id, name, email, role, status, designation, cases_solved, ongoing_cases, created_at FROM users WHERE id = ?`, 
         [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(row);
  });
});

// Get all police officers (admin and police can see all, users see limited info)
app.get('/api/police-officers', authenticateToken, (req, res) => {
  let query = `SELECT id, aadhar_id, name, email, designation, cases_solved, ongoing_cases, created_at 
               FROM users WHERE role = 'police' AND status = 'approved'`;
  
  // Regular users can see basic info only
  if (req.user.role === 'user') {
    query += ` ORDER BY cases_solved DESC, name ASC`;
  } else {
    query += ` ORDER BY cases_solved DESC, name ASC`;
  }

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get police officer statistics (for updating case counts)
app.get('/api/police-officers/stats', authenticateToken, requireRole(['admin', 'police']), (req, res) => {
  // Calculate actual stats from criminals table
  const query = `
    SELECT 
      u.id,
      u.name,
      u.designation,
      COUNT(CASE WHEN c.status IN ('arrested', 'convicted') AND c.arresting_officer_id = u.id THEN 1 END) as actual_solved,
      COUNT(CASE WHEN c.status IN ('wanted', 'arrested') AND (c.arresting_officer_id = u.id OR c.created_by = u.id) THEN 1 END) as actual_ongoing
    FROM users u
    LEFT JOIN criminals c ON (c.arresting_officer_id = u.id OR c.created_by = u.id)
    WHERE u.role = 'police' AND u.status = 'approved'
    GROUP BY u.id, u.name, u.designation
    ORDER BY actual_solved DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});