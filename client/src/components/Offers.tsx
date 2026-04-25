import { motion } from 'framer-motion';

function Offers() {
  return (
    <section id="offers" className="section dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="offer-banner"
      >
        <motion.span
          className="offer-percent"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          40%
        </motion.span>
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            OFFERS
          </motion.h2>
          <motion.p
            style={{ color: '#aaa', marginTop: 8 }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            Get up to 40% off on selected items. Limited time only.
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}

export default Offers;
