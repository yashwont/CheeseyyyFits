const { getDB } = require('../config/db');

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().run(sql, params, function (err) { if (err) reject(err); else resolve(this); });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().get(sql, params, (err, row) => { if (err) reject(err); else resolve(row || null); });
  });

const couponModel = {
  findByCode: (code) =>
    get('SELECT * FROM coupons WHERE code = ? COLLATE NOCASE', [code]),

  getAll: () =>
    all('SELECT * FROM coupons ORDER BY createdAt DESC'),

  create: (data) => {
    const { code, discountType, discountValue, minOrder, maxUses, expiresAt } = data;
    return run(
      'INSERT INTO coupons (code, discountType, discountValue, minOrder, maxUses, expiresAt) VALUES (?, ?, ?, ?, ?, ?)',
      [code.toUpperCase(), discountType, discountValue, minOrder ?? 0, maxUses ?? null, expiresAt ?? null]
    );
  },

  incrementUse: (code) =>
    run('UPDATE coupons SET usesCount = usesCount + 1 WHERE code = ? COLLATE NOCASE', [code]),

  toggle: (id) =>
    run('UPDATE coupons SET active = NOT active WHERE id = ?', [id]),

  delete: (id) =>
    run('DELETE FROM coupons WHERE id = ?', [id]),
};

module.exports = couponModel;
