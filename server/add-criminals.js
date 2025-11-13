const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Criminal data with appropriate crimes
const criminals = [
  {
    aadhar_id: '100100100101',
    name: 'Arjit Rawat',
    age: 28,
    gender: 'Male',
    address: '123 Main Street, Dehradun, Uttarakhand',
    crime_type: 'Theft',
    crime_details: 'Involved in multiple shoplifting incidents and petty theft cases. Last seen stealing electronic items from a local store.',
    crime_date: '2024-01-15',
    status: 'wanted'
  },
  {
    aadhar_id: '100100100102',
    name: 'Shubham Chamoli',
    age: 32,
    gender: 'Male',
    address: '456 Park Avenue, Rishikesh, Uttarakhand',
    crime_type: 'Fraud',
    crime_details: 'Accused of credit card fraud and identity theft. Multiple complaints filed for unauthorized transactions.',
    crime_date: '2024-02-20',
    status: 'wanted'
  },
  {
    aadhar_id: '100100100103',
    name: 'Vansaj Rawat',
    age: 25,
    gender: 'Male',
    address: '789 Hill Road, Mussoorie, Uttarakhand',
    crime_type: 'Assault',
    crime_details: 'Involved in a physical altercation resulting in serious injuries. Multiple witnesses identified the suspect.',
    crime_date: '2024-03-10',
    status: 'arrested'
  },
  {
    aadhar_id: '100100100104',
    name: 'Srijan Paniuly',
    age: 30,
    gender: 'Male',
    address: '321 Valley Street, Haridwar, Uttarakhand',
    crime_type: 'Drug Trafficking',
    crime_details: 'Suspected of involvement in illegal drug distribution network. Under investigation for possession and sale of controlled substances.',
    crime_date: '2024-01-25',
    status: 'wanted'
  },
  {
    aadhar_id: '100100100105',
    name: 'Amit Joshi',
    age: 35,
    gender: 'Male',
    address: '654 River View, Nainital, Uttarakhand',
    crime_type: 'Burglary',
    crime_details: 'Multiple break-ins reported in residential areas. Suspected of stealing cash and jewelry from homes.',
    crime_date: '2024-02-05',
    status: 'wanted'
  },
  {
    aadhar_id: '100100100106',
    name: 'Abhay Manwal',
    age: 27,
    gender: 'Male',
    address: '987 Forest Lane, Almora, Uttarakhand',
    crime_type: 'Cyber Crime',
    crime_details: 'Involved in online scams and phishing attacks. Multiple victims reported financial losses through fraudulent schemes.',
    crime_date: '2024-03-18',
    status: 'wanted'
  },
  {
    aadhar_id: '100100100107',
    name: 'Akshat Maithani',
    age: 29,
    gender: 'Male',
    address: '147 Mountain Road, Pauri, Uttarakhand',
    crime_type: 'Robbery',
    crime_details: 'Armed robbery at a local bank. Suspect brandished a weapon and escaped with cash. High priority case.',
    crime_date: '2024-01-30',
    status: 'wanted'
  },
  {
    aadhar_id: '100100100108',
    name: 'Abhishek Mamgai',
    age: 26,
    gender: 'Male',
    address: '258 Lake Side, Bhimtal, Uttarakhand',
    crime_type: 'Vandalism',
    crime_details: 'Multiple incidents of property damage and vandalism. Caught on CCTV destroying public property.',
    crime_date: '2024-02-12',
    status: 'arrested'
  },
  {
    aadhar_id: '100100100109',
    name: 'Siddhant Bisht',
    age: 31,
    gender: 'Male',
    address: '369 Temple Street, Rudraprayag, Uttarakhand',
    crime_type: 'Extortion',
    crime_details: 'Involved in extortion racket targeting local businesses. Multiple complaints of threats and demands for money.',
    crime_date: '2024-03-05',
    status: 'wanted'
  },
  {
    aadhar_id: '100100100110',
    name: 'Aakash Maurya',
    age: 33,
    gender: 'Male',
    address: '741 Market Square, Haldwani, Uttarakhand',
    crime_type: 'Vehicle Theft',
    crime_details: 'Suspected of stealing multiple vehicles including motorcycles and cars. Part of an organized vehicle theft ring.',
    crime_date: '2024-02-28',
    status: 'wanted'
  }
];

// Get admin user ID
db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`, (err, admin) => {
  if (err) {
    console.error('Error fetching admin user:', err);
    db.close();
    return;
  }

  const created_by = admin ? admin.id : 1; // Use admin ID or default to 1

  console.log(`Adding ${criminals.length} criminals to the database...`);
  console.log(`Created by user ID: ${created_by}\n`);

  let inserted = 0;
  let errors = 0;

  criminals.forEach((criminal, index) => {
    db.run(
      `INSERT OR IGNORE INTO criminals 
       (aadhar_id, name, age, gender, address, crime_type, crime_details, crime_date, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        criminal.aadhar_id,
        criminal.name,
        criminal.age,
        criminal.gender,
        criminal.address,
        criminal.crime_type,
        criminal.crime_details,
        criminal.crime_date,
        criminal.status,
        created_by
      ],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            console.log(`⚠️  ${criminal.name} - Already exists in database`);
          } else {
            console.error(`❌ Error adding ${criminal.name}:`, err.message);
            errors++;
          }
        } else {
          console.log(`✅ Added: ${criminal.name} - ${criminal.crime_type}`);
          inserted++;
        }

        // Close database after all operations
        if (index === criminals.length - 1) {
          console.log(`\n✅ Successfully added ${inserted} criminals`);
          if (errors > 0) {
            console.log(`⚠️  ${errors} errors encountered`);
          }
          db.close();
        }
      }
    );
  });
});

