const { getDB } = require('../config/db');

const userModel = {
  createUser: async (userData) => {
    const db = getDB();
    const { username, email, password, role = 'client', isVerified = false } = userData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?)',
        [username, email, password, role, isVerified],
        function(err) {
          if (err) {
            console.error('DB Error during createUser:', err.message); // More specific logging
            return reject(err);
          }
          console.log(`User created with ID: ${this.lastID}`);
          resolve({ id: this.lastID, username, email, password, role, isVerified, createdAt: new Date() });
        }
      );
    });
  },

  findUserByEmail: async (email) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          console.error('DB Error during findUserByEmail:', err.message); // More specific logging
          return reject(err);
        }
        resolve(row || null);
      });
    });
  },

  updatePassword: async (email, hashedPassword) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  },

  saveOTP: async (email, otp, otpExpiry) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET otp = ?, otpExpiry = ? WHERE email = ?',
        [otp, otpExpiry, email],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  },

  clearOTP: async (email) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET otp = NULL, otpExpiry = NULL WHERE email = ?',
        [email],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  },

  updateUserVerification: async (email, verificationStatus) => {
    const db = getDB();
    const isVerified = verificationStatus === 'verified';
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET isVerified = ? WHERE email = ?',
        [isVerified ? 1 : 0, email],
        function(err) {
          if (err) {
            console.error('DB Error during updateUserVerification:', err.message); // More specific logging
            return reject(err);
          }
          console.log(`User ${email} verification status updated to ${isVerified}. Rows affected: ${this.changes}`);
          resolve(this.changes > 0);
        }
      );
    });
  }
};

module.exports = userModel;
