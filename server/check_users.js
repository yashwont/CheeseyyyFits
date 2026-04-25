const { connectDB, getDB, disconnectDB } = require('./config/db');

async function checkUsers() {
  try {
    await connectDB();
    const db = getDB();
    db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
        console.error(err);
      } else {
        console.log(JSON.stringify(rows, null, 2));
      }
      disconnectDB();
    });
  } catch (err) {
    console.error(err);
  }
}

checkUsers();
