const { connectDB, getDB, disconnectDB } = require('./config/db');

const email = process.argv[2];
if (!email) { console.error('Usage: node make-support.js <email>'); process.exit(1); }

connectDB().then(() => {
  getDB().run("UPDATE users SET role = 'support' WHERE email = ?", [email], function(err) {
    if (err) console.error('Error:', err.message);
    else if (this.changes === 0) console.log(`No user found: ${email}`);
    else console.log(`✓ ${email} is now a support agent`);
    disconnectDB();
  });
}).catch(console.error);
