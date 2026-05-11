import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import type { ChatMessage } from '../context/SocketContext';
import { fetchMyMessages } from '../api';
import { isAuthenticated, getRole, getUsername } from '../utils/auth';

export default function LiveChat() {
  // ── All hooks must be called before any early returns ──────────────────────
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(false);
  const { connected, myMessages, sendClientMessage } = useSocket();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation history when panel opens
  useEffect(() => {
    if (!open || !isAuthenticated()) return;
    setLoading(true);
    fetchMyMessages()
      .then((msgs) => setMessages(msgs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Merge incoming real-time messages
  useEffect(() => {
    if (!myMessages.length) return;
    setMessages((prev) => {
      const ids = new Set(prev.filter(m => m.id > 0).map((m) => m.id));
      const fresh = myMessages.filter((m) => !ids.has(m.id));
      if (!fresh.length) return prev;
      if (!open) setHasUnread(true);
      // Replace any optimistic duplicates then append real messages
      let updated = prev;
      for (const msg of fresh) {
        updated = updated.filter(m =>
          !(m.id < 0 && m.message === msg.message && m.senderRole === msg.senderRole)
        );
        updated = [...updated, msg];
      }
      return updated;
    });
  }, [myMessages, open]);

  // Scroll to bottom + clear unread when panel opens
  useEffect(() => {
    if (open) setHasUnread(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // ── Early returns AFTER all hooks ──────────────────────────────────────────
  // Not logged in → hide completely (no bubble, nothing)
  if (!isAuthenticated()) return null;

  // Support / Admin → they use the SupportPanel instead
  if (['support', 'admin'].includes(getRole())) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  const send = () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');

    // Optimistic — show immediately without waiting for socket echo
    const optimistic: ChatMessage = {
      id: -Date.now(),
      roomUserId: 0,
      senderId: 0,
      senderUsername: getUsername(),
      senderRole: 'client',
      message: msg,
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    sendClientMessage(msg);
  };

  const username = getUsername();

  return (
    <div className="live-chat-wrap">
      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-window"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div>
                <p className="chat-title">SUPPORT</p>
                <p className="chat-subtitle">
                  <span className={`chat-status-dot ${connected ? 'online' : 'offline'}`} />
                  {connected ? 'Support online' : 'Reconnecting...'}
                </p>
              </div>
              <button className="cart-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Your identity tag — makes it clear this is YOUR private chat */}
            <div className="chat-identity-bar">
              <span>🔒 Private conversation</span>
              <span className="chat-identity-user">{username}</span>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loading && <p className="chat-empty" style={{ padding: 20 }}>Loading...</p>}

              {!loading && messages.length === 0 && (
                <div className="chat-empty-state">
                  <span style={{ fontSize: '2rem' }}>👋</span>
                  <p>Hi {username}! How can we help?</p>
                  <p style={{ fontSize: '0.75rem', color: '#444', marginTop: 4 }}>
                    Only you and our support team can see this conversation.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-msg ${msg.senderRole === 'client' ? 'chat-msg-user' : 'chat-msg-support'}`}
                >
                  <span className="chat-msg-author">
                    {msg.senderRole === 'client' ? 'You' : `🎧 Support`}
                  </span>
                  <p className="chat-msg-text">{msg.message}</p>
                  <span className="chat-msg-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chat-input-row">
              <input
                className="chat-input"
                placeholder="Message support..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                autoFocus
              />
              <motion.button className="chat-send" onClick={send} whileTap={{ scale: 0.9 }}>
                ➤
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble */}
      <motion.button
        className="chat-bubble"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Chat with support"
      >
        {open ? '✕' : '💬'}
        {!open && hasUnread && <span className="chat-unread-dot" />}
      </motion.button>
    </div>
  );
}
