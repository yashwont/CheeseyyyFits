const { getDB } = require('../config/db');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

const getUser = (id) =>
  new Promise((resolve, reject) => {
    getDB().get('SELECT id, username, email, role, isVerified, avatar, createdAt FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });

const getAllUsers = () =>
  new Promise((resolve, reject) => {
    getDB().all('SELECT id, username, email, role, isVerified, avatar, createdAt FROM users ORDER BY createdAt DESC', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

exports.getProfile = async (req, res) => {
  try {
    const user = await getUser(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });
    await run('UPDATE users SET username = ? WHERE id = ?', [username, req.user.userId]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const avatarUrl = req.file.path;
    await run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.userId]);
    res.json({ avatar: avatarUrl });
  } catch {
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }

    const user = await new Promise((resolve, reject) => {
      getDB().get('SELECT * FROM users WHERE id = ?', [req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.userId]);
    res.json({ message: 'Password changed successfully' });
  } catch {
    res.status(500).json({ message: 'Failed to change password' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['client', 'support', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'User role updated' });
  } catch {
    res.status(500).json({ message: 'Failed to update role' });
  }
};
