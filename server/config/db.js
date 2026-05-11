const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.db');

let db = null;

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const connectDB = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        return reject(err);
      }

      try {
        await runAsync('PRAGMA foreign_keys = ON');

        await runAsync(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'client',
          isVerified BOOLEAN DEFAULT 0,
          otp TEXT,
          otpExpiry DATETIME,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await runAsync(`ALTER TABLE users ADD COLUMN otp TEXT`).catch(() => {});
        await runAsync(`ALTER TABLE users ADD COLUMN otpExpiry DATETIME`).catch(() => {});

        await runAsync(`CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          image TEXT,
          category TEXT,
          size TEXT,
          stock INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          productId INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          size TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(userId, productId, size)
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          total REAL NOT NULL,
          discount REAL DEFAULT 0,
          couponCode TEXT,
          status TEXT DEFAULT 'confirmed',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`);

        await runAsync(`ALTER TABLE orders ADD COLUMN discount REAL DEFAULT 0`).catch(() => {});
        await runAsync(`ALTER TABLE orders ADD COLUMN couponCode TEXT`).catch(() => {});
        await runAsync(`ALTER TABLE orders ADD COLUMN stripePaymentIntentId TEXT`).catch(() => {});
        await runAsync(`ALTER TABLE orders ADD COLUMN paymentMethod TEXT DEFAULT 'stripe'`).catch(() => {});
        await runAsync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(stripePaymentIntentId) WHERE stripePaymentIntentId IS NOT NULL`).catch(() => {});

        await runAsync(`CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          orderId INTEGER NOT NULL,
          productId INTEGER NOT NULL,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          quantity INTEGER NOT NULL,
          size TEXT,
          FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (productId) REFERENCES products(id)
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS wishlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          productId INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(userId, productId)
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          productId INTEGER NOT NULL,
          rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
          comment TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(userId, productId)
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS coupons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL UNIQUE,
          discountType TEXT NOT NULL DEFAULT 'percentage',
          discountValue REAL NOT NULL,
          minOrder REAL DEFAULT 0,
          maxUses INTEGER DEFAULT NULL,
          usesCount INTEGER DEFAULT 0,
          expiresAt DATETIME DEFAULT NULL,
          active BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS flash_sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          productId INTEGER NOT NULL,
          salePrice REAL NOT NULL,
          startsAt DATETIME NOT NULL,
          endsAt DATETIME NOT NULL,
          active BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
        )`);
        await runAsync(`ALTER TABLE flash_sales ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`).catch(() => {});

        await runAsync(`CREATE TABLE IF NOT EXISTS stock_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          productId INTEGER NOT NULL,
          notified BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(email, productId)
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS loyalty_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL UNIQUE,
          points INTEGER DEFAULT 0,
          totalEarned INTEGER DEFAULT 0,
          tier TEXT DEFAULT 'Bronze',
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS returns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          orderId INTEGER NOT NULL,
          reason TEXT NOT NULL,
          details TEXT,
          status TEXT DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
        )`);

        await runAsync(`ALTER TABLE returns ADD COLUMN stripeRefundId TEXT`).catch(() => {});

        // Drop old broadcast chat table, replace with room-based support messages
        await runAsync(`DROP TABLE IF EXISTS chat_messages`).catch(() => {});

        await runAsync(`CREATE TABLE IF NOT EXISTS support_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          roomUserId INTEGER NOT NULL,
          senderId INTEGER NOT NULL,
          senderUsername TEXT NOT NULL,
          senderRole TEXT NOT NULL DEFAULT 'client',
          message TEXT NOT NULL,
          isRead BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (roomUserId) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Allow support role in users table
        await runAsync(`ALTER TABLE users ADD COLUMN isSupport BOOLEAN DEFAULT 0`).catch(() => {});

        // Profile avatar
        await runAsync(`ALTER TABLE users ADD COLUMN avatar TEXT`).catch(() => {});

        // model3dUrl for AR/3D viewer
        await runAsync(`ALTER TABLE products ADD COLUMN model3dUrl TEXT`).catch(() => {});
        await runAsync(`ALTER TABLE products ADD COLUMN lastRestockedAt DATETIME`).catch(() => {});
        await runAsync(`ALTER TABLE products ADD COLUMN images TEXT`).catch(() => {});

        // Save-for-later inside cart
        await runAsync(`ALTER TABLE cart_items ADD COLUMN savedForLater INTEGER DEFAULT 0`).catch(() => {});

        // Price drop alerts (mirrors stock_alerts shape)
        await runAsync(`CREATE TABLE IF NOT EXISTS price_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          productId INTEGER NOT NULL,
          thresholdPrice REAL NOT NULL,
          notified INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(email, productId)
        )`).catch(() => {});

        // Trending search tracking
        await runAsync(`CREATE TABLE IF NOT EXISTS trending_searches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT NOT NULL UNIQUE,
          count INTEGER DEFAULT 1,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`).catch(() => {});

        // Performance indexes
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`).catch(() => {});
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)`).catch(() => {});
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`).catch(() => {});
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_order_items_productId ON order_items(productId)`).catch(() => {});
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId)`).catch(() => {});

        console.log('All tables ready.');
        resolve();
      } catch (e) {
        console.error('DB setup error:', e.message);
        reject(e);
      }
    });
  });
};

const disconnectDB = () => {
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database:', err.message);
      else console.log('Database connection closed.');
    });
    db = null;
  }
};

const getDB = () => {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
};

module.exports = { connectDB, disconnectDB, getDB };
