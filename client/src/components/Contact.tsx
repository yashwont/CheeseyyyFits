import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function Contact() {
  const navigate = useNavigate();
  return (
    <section id="contact" className="section landing-section">
      <motion.div className="section-label"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        GET IN TOUCH
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        CONTACT US
      </motion.h2>

      <motion.p style={{ color: '#777', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7, fontSize: '0.95rem' }}
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: 0.15 }}>
        Questions about your order? Collab enquiry? Just want to talk fits?
        We read every message.
      </motion.p>

      <div className="contact-grid">
        {[
          { icon: '✉️', label: 'Email', value: 'support@cheezeyyfits.com' },
          { icon: '📸', label: 'Instagram', value: '@cheezeyyfits' },
          { icon: '💬', label: 'Response time', value: 'Within 24 hours' },
        ].map(({ icon, label, value }) => (
          <motion.div key={label} className="contact-card"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1 }}
            whileHover={{ y: -6, borderColor: 'red', boxShadow: '0 0 20px rgba(255,0,0,0.2)' }}>
            <span style={{ fontSize: '1.6rem' }}>{icon}</span>
            <p className="contact-label">{label}</p>
            <p className="contact-value">{value}</p>
          </motion.div>
        ))}
      </div>

      <motion.button className="shop-btn" style={{ marginTop: 40 }}
        onClick={() => navigate('/contact')}
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 28px rgba(255,0,0,0.5)' }} whileTap={{ scale: 0.97 }}>
        Send Us a Message
      </motion.button>
    </section>
  );
}

export default Contact;
