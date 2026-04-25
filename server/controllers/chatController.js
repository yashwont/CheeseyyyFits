const { getDB } = require('../config/db');

const all = (sql, p = []) => new Promise((res, rej) => getDB().all(sql, p, (e, r) => e ? rej(e) : res(r)));
const get = (sql, p = []) => new Promise((res, rej) => getDB().get(sql, p, (e, r) => e ? rej(e) : res(r || null)));
const run = (sql, p = []) => new Promise((res, rej) => getDB().run(sql, p, function(e) { e ? rej(e) : res(this); }));

// Save a message and return it
const saveMessage = async (roomUserId, senderId, senderUsername, senderRole, message) => {
  const result = await run(
    'INSERT INTO support_messages (roomUserId, senderId, senderUsername, senderRole, message) VALUES (?, ?, ?, ?, ?)',
    [roomUserId, senderId, senderUsername, senderRole, message]
  );
  return get('SELECT * FROM support_messages WHERE id = ?', [result.lastID]);
};

// User: get their own messages
exports.getMyMessages = async (req, res) => {
  try {
    const messages = await all(
      'SELECT * FROM support_messages WHERE roomUserId = ? ORDER BY createdAt ASC',
      [req.user.userId]
    );
    // Mark all support messages as read from user's perspective
    res.json(messages);
  } catch { res.status(500).json({ message: 'Failed to fetch messages' }); }
};

// Support/Admin: get list of all rooms (users who have ever messaged)
exports.getRooms = async (req, res) => {
  try {
    const rooms = await all(
      `SELECT
        u.id as userId, u.username, u.email,
        COUNT(CASE WHEN sm.isRead = 0 AND sm.senderRole = 'client' THEN 1 END) as unreadCount,
        MAX(sm.createdAt) as lastActivity,
        (SELECT message FROM support_messages WHERE roomUserId = u.id ORDER BY createdAt DESC LIMIT 1) as lastMessage
       FROM users u
       INNER JOIN support_messages sm ON sm.roomUserId = u.id
       WHERE u.role = 'client'
       GROUP BY u.id
       ORDER BY lastActivity DESC`
    );
    res.json(rooms);
  } catch { res.status(500).json({ message: 'Failed to fetch rooms' }); }
};

// Support/Admin: get messages for a specific user's room
exports.getRoomMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await all(
      'SELECT * FROM support_messages WHERE roomUserId = ? ORDER BY createdAt ASC',
      [userId]
    );
    // Mark client messages in this room as read
    await run(
      "UPDATE support_messages SET isRead = 1 WHERE roomUserId = ? AND senderRole = 'client'",
      [userId]
    );
    res.json(messages);
  } catch { res.status(500).json({ message: 'Failed to fetch room messages' }); }
};

// Support/Admin: get unread count across all rooms
exports.getUnreadCount = async (req, res) => {
  try {
    const row = await get(
      "SELECT COUNT(*) as count FROM support_messages WHERE isRead = 0 AND senderRole = 'client'"
    );
    res.json({ unread: row?.count ?? 0 });
  } catch { res.status(500).json({ message: 'Failed' }); }
};

module.exports.saveMessage = saveMessage;
