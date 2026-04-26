const { getDB } = require('../config/db');

const all = (sql, p = []) => new Promise((res, rej) => getDB().all(sql, p, (e, r) => e ? rej(e) : res(r)));
const get = (sql, p = []) => new Promise((res, rej) => getDB().get(sql, p, (e, r) => e ? rej(e) : res(r || null)));
const run = (sql, p = []) => new Promise((res, rej) => getDB().run(sql, p, function(e) { e ? rej(e) : res(this); }));

exports.getActive = async (req, res) => {
  try {
    const sales = await all(
      `SELECT fs.*, p.name, p.image, p.price as originalPrice, p.category, p.stock
       FROM flash_sales fs
       JOIN products p ON fs.productId = p.id
       WHERE fs.active = 1
         AND datetime(fs.startsAt) <= datetime('now')
         AND datetime(fs.endsAt) > datetime('now')
       ORDER BY fs.endsAt ASC`
    );
    res.json(sales);
  } catch (e) { console.error('getActive flash sales:', e); res.status(500).json({ message: 'Failed to fetch flash sales' }); }
};

exports.getAll = async (req, res) => {
  try {
    const sales = await all(
      `SELECT fs.*, p.name, p.image, p.price as originalPrice
       FROM flash_sales fs JOIN products p ON fs.productId = p.id
       ORDER BY fs.id DESC`
    );
    res.json(sales);
  } catch (e) { console.error('getAll flash sales:', e); res.status(500).json({ message: 'Failed to fetch flash sales' }); }
};

exports.create = async (req, res) => {
  try {
    const { productId, salePrice, startsAt, endsAt } = req.body;
    if (!productId || !salePrice || !startsAt || !endsAt)
      return res.status(400).json({ message: 'All fields required' });
    await run(
      'INSERT INTO flash_sales (productId, salePrice, startsAt, endsAt) VALUES (?, ?, ?, ?)',
      [productId, salePrice, startsAt, endsAt]
    );
    res.status(201).json({ message: 'Flash sale created' });
  } catch { res.status(500).json({ message: 'Failed to create flash sale' }); }
};

exports.toggle = async (req, res) => {
  try {
    await run('UPDATE flash_sales SET active = NOT active WHERE id = ?', [req.params.id]);
    res.json({ message: 'Flash sale toggled' });
  } catch { res.status(500).json({ message: 'Failed to toggle' }); }
};

exports.remove = async (req, res) => {
  try {
    await run('DELETE FROM flash_sales WHERE id = ?', [req.params.id]);
    res.json({ message: 'Flash sale deleted' });
  } catch { res.status(500).json({ message: 'Failed to delete' }); }
};
