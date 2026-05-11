import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { API } from '../api';

const FAQS = [
  { q: 'How long does shipping take?', a: 'Standard shipping takes 5–10 business days worldwide. Express options (2–4 days) are available at checkout.' },
  { q: 'What is your return policy?', a: 'We accept returns within 30 days of delivery. Items must be unworn with tags attached. Use the Returns portal in your dashboard.' },
  { q: 'How do I track my order?', a: 'Once shipped, you\'ll receive an email with tracking info. You can also view order status in your account under My Orders.' },
  { q: 'Do you restock sold-out items?', a: 'Some items restock, some don\'t — we operate on limited drops. Click "Notify Me" on any sold-out product to get an instant email when it\'s back.' },
  { q: 'Can I change my order after placing it?', a: 'Orders can be modified within 1 hour of placement. After that, the item may already be packed. Contact us immediately if you need changes.' },
  { q: 'What sizes do you carry?', a: 'We carry XS through XXL. Use the Fit Finder on any product page to get your perfect size recommendation.' },
];

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message)
      return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const res = await API.post('/contact', form);
      toast.success(res.data.message);
      setForm({ name: '', email: '', subject: '', message: '' });
      setSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      {/* ── Mini header ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 56,
        background: 'var(--ink)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        zIndex: 100,
      }}>
        <motion.span
          style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--red)', cursor: 'pointer', letterSpacing: '0.06em' }}
          onClick={() => navigate('/')}
          whileHover={{ opacity: 0.8 }}
        >
          CHEEZEYY FITS
        </motion.span>
        <motion.button
          className="auth-back-btn"
          onClick={() => navigate('/')}
          style={{ position: 'static' }}
          whileHover={{ x: -3 }}
        >
          ← Back to Home
        </motion.button>
      </div>

      {/* ── Page content (offset for fixed header) ── */}
      <div style={{ paddingTop: 56 }}>
        <div className="contact-page-layout">
          {/* ── Left — info + form ── */}
          <motion.div
            className="contact-form-side"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="section-label">GET IN TOUCH</div>
            <h1 className="contact-page-title">CONTACT<br />US</h1>
            <p className="contact-page-sub">
              We read every message. Expect a reply within 24 hours.
            </p>

            {/* Info pills */}
            <div className="contact-info-row">
              {[
                { icon: '✉️', text: 'support@cheezeyyfits.com' },
                { icon: '📸', text: '@cheezeyyfits' },
                { icon: '🕐', text: 'Mon–Sat, 9am–6pm' },
              ].map(({ icon, text }) => (
                <div key={text} className="contact-info-pill">
                  <span>{icon}</span> {text}
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="contact-form-card">
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '40px 20px' }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--t1)', marginBottom: 8 }}>
                      MESSAGE SENT
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 24 }}>
                      We'll get back to you within 24 hours.
                    </p>
                    <button className="profile-save-btn" onClick={() => setSent(false)}>
                      Send Another
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="contact-form-row">
                      <div className="contact-field">
                        <label>Name</label>
                        <input
                          className="profile-input" placeholder="Your name"
                          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div className="contact-field">
                        <label>Email</label>
                        <input
                          className="profile-input" type="email" placeholder="your@email.com"
                          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="contact-field">
                      <label>Subject</label>
                      <select
                        className="profile-input"
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                      >
                        <option value="">Select a subject</option>
                        <option>Order Issue</option>
                        <option>Return / Refund</option>
                        <option>Product Question</option>
                        <option>Collaboration / Press</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="contact-field">
                      <label>Message</label>
                      <textarea
                        className="review-textarea"
                        style={{ minHeight: 140 }}
                        placeholder="Tell us everything..."
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                      />
                    </div>
                    <motion.button
                      className="profile-save-btn"
                      style={{ width: '100%', padding: '14px' }}
                      onClick={handleSubmit}
                      disabled={loading}
                      whileHover={!loading ? { scale: 1.015, boxShadow: '0 0 20px rgba(232,0,13,0.35)' } : {}}
                      whileTap={!loading ? { scale: 0.985 } : {}}
                    >
                      {loading ? 'Sending...' : 'SEND MESSAGE'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Right — FAQ ── */}
          <motion.div
            className="contact-faq-side"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <div className="section-label">QUICK ANSWERS</div>
            <h2 className="contact-faq-title">FAQ</h2>

            <div className="faq-list">
              {FAQS.map((faq, i) => (
                <motion.div key={i} className="faq-item" layout>
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <motion.span
                      className="faq-chevron"
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      ▾
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        className="faq-answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Social links */}
            <div className="contact-socials" style={{ marginTop: 40 }}>
              <p className="contact-follow-label">FOLLOW US</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Instagram', 'TikTok', 'Twitter'].map(s => (
                  <motion.span
                    key={s}
                    className="social-pill"
                    whileHover={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
