const { connectDB, getDB, disconnectDB } = require('./config/db');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node make-admin.js <email>');
  process.exit(1);
}

async function run() {
  await connectDB();
  const db = getDB();
  db.run('UPDATE users SET role = ? WHERE email = ?', ['admin', email], function (err) {
    if (err) {
      console.error('Error:', err.message);
    } else if (this.changes === 0) {
      console.log(`No user found with email: ${email}`);
    } else {
      console.log(`✓ ${email} is now an admin`);
    }
    disconnectDB();
  });
}

run().catch(console.error);
