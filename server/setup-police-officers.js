const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Police officers data
const policeOfficers = [
  {
    aadhar_id: '200200200201',
    name: 'Abhinav Negi',
    email: 'abhinav.negi@police.gov.in',
    password: 'police123',
    designation: 'Inspector',
    cases_solved: 45,
    ongoing_cases: 8
  },
  {
    aadhar_id: '200200200202',
    name: 'Jatin Rawat',
    email: 'jatin.rawat@police.gov.in',
    password: 'police123',
    designation: 'Sub-Inspector',
    cases_solved: 32,
    ongoing_cases: 12
  },
  {
    aadhar_id: '200200200203',
    name: 'Mayank Aswal',
    email: 'mayank.aswal@police.gov.in',
    password: 'police123',
    designation: 'Assistant Sub-Inspector',
    cases_solved: 28,
    ongoing_cases: 15
  },
  {
    aadhar_id: '200200200204',
    name: 'Insaaf Man',
    email: 'insaaf.man@police.gov.in',
    password: 'police123',
    designation: 'Head Constable',
    cases_solved: 19,
    ongoing_cases: 6
  }
];

console.log('Setting up police officers table...\n');

// First, add columns if they don't exist
db.serialize(() => {
  // Add police officer specific columns to users table
  db.run(`ALTER TABLE users ADD COLUMN designation TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding designation column:', err.message);
    } else if (!err) {
      console.log('✅ Added designation column');
    }
  });
  
  db.run(`ALTER TABLE users ADD COLUMN cases_solved INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding cases_solved column:', err.message);
    } else if (!err) {
      console.log('✅ Added cases_solved column');
    }
  });
  
  db.run(`ALTER TABLE users ADD COLUMN ongoing_cases INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding ongoing_cases column:', err.message);
    } else if (!err) {
      console.log('✅ Added ongoing_cases column');
    }
  });

  // Wait a bit for columns to be added, then add officers
  setTimeout(() => {
    console.log(`\nAdding ${policeOfficers.length} police officers to the database...\n`);

    let inserted = 0;
    let errors = 0;
    let processed = 0;

    policeOfficers.forEach((officer, index) => {
      bcrypt.hash(officer.password, 10, (err, hashedPassword) => {
        if (err) {
          console.error(`❌ Error hashing password for ${officer.name}:`, err.message);
          errors++;
          processed++;
          if (processed === policeOfficers.length) {
            console.log(`\n✅ Process completed. ${inserted} officers added, ${errors} errors`);
            db.close();
          }
          return;
        }

        db.run(
          `INSERT OR IGNORE INTO users 
           (aadhar_id, name, email, password, role, status, designation, cases_solved, ongoing_cases) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            officer.aadhar_id,
            officer.name,
            officer.email,
            hashedPassword,
            'police',
            'approved',
            officer.designation,
            officer.cases_solved,
            officer.ongoing_cases
          ],
          function(err) {
            processed++;
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                // Try to update existing officer
                db.run(
                  `UPDATE users SET designation = ?, cases_solved = ?, ongoing_cases = ? WHERE aadhar_id = ?`,
                  [officer.designation, officer.cases_solved, officer.ongoing_cases, officer.aadhar_id],
                  function(updateErr) {
                    if (updateErr) {
                      console.error(`❌ Error updating ${officer.name}:`, updateErr.message);
                      errors++;
                    } else {
                      console.log(`✅ Updated: ${officer.name} - ${officer.designation} (Solved: ${officer.cases_solved}, Ongoing: ${officer.ongoing_cases})`);
                      inserted++;
                    }
                    if (processed === policeOfficers.length) {
                      console.log(`\n✅ Successfully processed ${inserted} police officers`);
                      if (errors > 0) {
                        console.log(`⚠️  ${errors} errors encountered`);
                      }
                      db.close();
                    }
                  }
                );
              } else {
                console.error(`❌ Error adding ${officer.name}:`, err.message);
                errors++;
                if (processed === policeOfficers.length) {
                  console.log(`\n✅ Process completed. ${inserted} officers added, ${errors} errors`);
                  db.close();
                }
              }
            } else {
              console.log(`✅ Added: ${officer.name} - ${officer.designation} (Solved: ${officer.cases_solved}, Ongoing: ${officer.ongoing_cases})`);
              inserted++;
              if (processed === policeOfficers.length) {
                console.log(`\n✅ Successfully added ${inserted} police officers`);
                if (errors > 0) {
                  console.log(`⚠️  ${errors} errors encountered`);
                }
                db.close();
              }
            }
          }
        );
      });
    });
  }, 500);
});

