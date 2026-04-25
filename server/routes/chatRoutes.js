const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const requireSupport = (req, res, next) => {
  if (!['support', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Support access required' });
  }
  next();
};

router.use(authenticate);

// Client routes
router.get('/my', chatController.getMyMessages);

// Support + Admin routes
router.get('/rooms', requireSupport, chatController.getRooms);
router.get('/room/:userId', requireSupport, chatController.getRoomMessages);
router.get('/unread', requireSupport, chatController.getUnreadCount);

module.exports = router;
