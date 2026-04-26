import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import type { ChatMessage } from '../context/SocketContext';
import { fetchChatRooms, fetchRoomMessages, fetchChatUnread } from '../api';

type Room = {
  userId: number;
  username: string;
  email: string;
  avatar?: string;
  unreadCount: number;
  lastActivity: string;
  lastMessage: string;
};

const RoomAvatar = ({ room, size = 40 }: { room: Room; size?: number }) =>
  room.avatar
    ? <img src={room.avatar} alt={room.username} className="room-avatar room-avatar-img" style={{ width: size, height: size }} />
    : <div className="room-avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>{room.username[0].toUpperCase()}</div>;

const timeAgo = (date: string) => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function SupportPanel() {
  // ── All hooks first ────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeRoomRef = useRef<Room | null>(null);
  const { newClientMessages, sendSupportMessage, watchUser, unwatchUser } = useSocket();

  // Keep ref in sync for use inside socket callbacks
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // Load rooms list and global unread count
  const loadRooms = useCallback(async () => {
    try {
      const [r, u] = await Promise.all([fetchChatRooms(), fetchChatUnread()]);
      setRooms(r);
      setTotalUnread(u.unread);
    } catch (e) { console.error('loadRooms failed:', e); }
  }, []);

  // Load on mount (so badge shows even before opening panel)
  useEffect(() => { loadRooms(); }, [loadRooms]);

  // Re-load rooms list when panel opens
  useEffect(() => { if (open) loadRooms(); }, [open, loadRooms]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  // Real-time: new message arrived from a client
  useEffect(() => {
    if (!newClientMessages.length) return;
    const latest = newClientMessages[newClientMessages.length - 1];
    const currentRoom = activeRoomRef.current;

    // If this message belongs to the currently open room → append it directly
    if (currentRoom && latest.roomUserId === currentRoom.userId) {
      setRoomMessages((prev) => {
        if (prev.some((m) => m.id === latest.id)) return prev;
        // Replace optimistic duplicate (negative id, same text + role)
        const clean = prev.filter(m =>
          !(m.id < 0 && m.message === latest.message && m.senderRole === latest.senderRole)
        );
        return [...clean, latest];
      });
      // Already reading this room — don't increment unread
    } else {
      // Different room → bump unread
      setTotalUnread((n) => n + 1);
    }

    // Update the rooms sidebar: bump that user's last message + unread count
    setRooms((prev) => {
      const exists = prev.find((r) => r.userId === latest.roomUserId);
      if (!exists) {
        // Brand new user started chatting — refresh list
        loadRooms();
        return prev;
      }
      const isCurrentRoom = currentRoom?.userId === latest.roomUserId;
      return prev
        .map((r) =>
          r.userId === latest.roomUserId
            ? {
                ...r,
                lastMessage: latest.message,
                lastActivity: latest.createdAt,
                unreadCount: isCurrentRoom ? 0 : r.unreadCount + 1,
              }
            : r
        )
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    });
  }, [newClientMessages, loadRooms]);

  // Open a specific customer's conversation
  const openRoom = async (room: Room) => {
    if (activeRoomRef.current) unwatchUser(activeRoomRef.current.userId);
    setActiveRoom(room);
    watchUser(room.userId);
    try {
      const msgs = await fetchRoomMessages(room.userId);
      setRoomMessages(msgs);
      // Mark as read locally
      setRooms((prev) =>
        prev.map((r) => r.userId === room.userId ? { ...r, unreadCount: 0 } : r)
      );
      setTotalUnread((n) => Math.max(0, n - room.unreadCount));
    } catch (e) { console.error('openRoom failed:', e); }
  };

  const sendReply = () => {
    if (!text.trim() || !activeRoom) return;
    const msg = text.trim();
    setText('');

    // Optimistic — show immediately without waiting for socket echo
    const optimistic: ChatMessage = {
      id: -Date.now(),
      roomUserId: activeRoom.userId,
      senderId: 0,
      senderUsername: localStorage.getItem('username') || 'Support',
      senderRole: (localStorage.getItem('role') as ChatMessage['senderRole']) || 'support',
      message: msg,
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    setRoomMessages(prev => [...prev, optimistic]);

    sendSupportMessage(activeRoom.userId, msg);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="support-panel-wrap">
      <AnimatePresence>
        {open && (
          <motion.div
            className="support-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            {/* Panel header */}
            <div className="support-panel-header">
              <div>
                <p className="chat-title">SUPPORT INBOX</p>
                <p className="chat-subtitle">
                  {rooms.length} customer{rooms.length !== 1 ? 's' : ''} · {totalUnread} unread
                </p>
              </div>
              <button className="cart-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="support-panel-body">
              {/* ── Left: customer list ── */}
              <div className="support-rooms">
                {rooms.length === 0 && (
                  <div className="support-no-room" style={{ padding: 24 }}>
                    <span style={{ fontSize: '1.8rem' }}>💬</span>
                    <p>No conversations yet</p>
                    <p style={{ fontSize: '0.72rem', color: '#333', marginTop: 4 }}>
                      Customers will appear here when they message
                    </p>
                  </div>
                )}
                {rooms.map((room) => (
                  <motion.div
                    key={room.userId}
                    className={`support-room-item ${activeRoom?.userId === room.userId ? 'room-active' : ''}`}
                    onClick={() => openRoom(room)}
                    whileHover={{ backgroundColor: 'rgba(255,0,0,0.04)' }}
                  >
                    <RoomAvatar room={room} />
                    <div className="room-info">
                      <div className="room-info-top">
                        <span className="room-name">{room.username}</span>
                        <span className="room-time">{timeAgo(room.lastActivity)}</span>
                      </div>
                      <p className="room-preview">{room.lastMessage}</p>
                      <p className="room-email">{room.email}</p>
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="room-unread-badge">{room.unreadCount}</span>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* ── Right: active conversation ── */}
              <div className="support-chat-area">
                {!activeRoom ? (
                  <div className="support-no-room">
                    <span style={{ fontSize: '2.5rem' }}>←</span>
                    <p>Select a customer to view their conversation</p>
                    <p style={{ fontSize: '0.72rem', color: '#333', marginTop: 4 }}>
                      Each conversation is private — only you and the customer can see it
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Conversation header — clearly shows whose chat this is */}
                    <div className="support-chat-header">
                      <RoomAvatar room={activeRoom} size={32} />
                      <div style={{ flex: 1 }}>
                        <p className="support-chat-customer-name">{activeRoom.username}</p>
                        <p className="support-chat-customer-email">{activeRoom.email}</p>
                      </div>
                      <span className="support-private-tag">🔒 Private</span>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages support-messages">
                      {roomMessages.length === 0 && (
                        <p className="chat-empty" style={{ padding: 20 }}>
                          No messages yet in this conversation.
                        </p>
                      )}
                      {roomMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`chat-msg ${
                            msg.senderRole === 'client'
                              ? 'chat-msg-support-incoming'
                              : 'chat-msg-support-outgoing'
                          }`}
                        >
                          <span className="chat-msg-author">
                            {msg.senderRole === 'client'
                              ? activeRoom.username
                              : `🎧 ${msg.senderUsername}`}
                          </span>
                          <p className="chat-msg-text">{msg.message}</p>
                          <span className="chat-msg-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>

                    {/* Reply input */}
                    <div className="chat-input-row">
                      <input
                        className="chat-input"
                        placeholder={`Reply to ${activeRoom.username}...`}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                        autoFocus
                      />
                      <motion.button
                        className="chat-send"
                        onClick={sendReply}
                        whileTap={{ scale: 0.9 }}
                      >
                        ➤
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support bubble — always visible for support/admin */}
      <motion.button
        className="chat-bubble support-bubble"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Support inbox"
      >
        {open ? '✕' : '🎧'}
        {!open && totalUnread > 0 && (
          <span className="chat-badge-count">{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
      </motion.button>
    </div>
  );
}
