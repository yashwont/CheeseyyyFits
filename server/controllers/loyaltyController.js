const { getDB } = require('../config/db');

const get = (sql, p = []) => new Promise((res, rej) => getDB().get(sql, p, (e, r) => e ? rej(e) : res(r || null)));
const run = (sql, p = []) => new Promise((res, rej) => getDB().run(sql, p, function(e) { e ? rej(e) : res(this); }));

const TIERS = [
  { name: 'Gold', minSpend: 500, discount: 0.1 },
  { name: 'Silver', minSpend: 200, discount: 0.05 },
  { name: 'Bronze', minSpend: 0, discount: 0 },
];

const POINTS_PER_DOLLAR = 1;
const POINTS_TO_DOLLAR = 100; // 100 points = $1

const computeTier = (totalSpend) =>
  TIERS.find((t) => totalSpend >= t.minSpend)?.name ?? 'Bronze';

const ensureLoyalty = async (userId) => {
  const existing = await get('SELECT * FROM loyalty_points WHERE userId = ?', [userId]);
  if (!existing) {
    await run('INSERT OR IGNORE INTO loyalty_points (userId) VALUES (?)', [userId]);
    return await get('SELECT * FROM loyalty_points WHERE userId = ?', [userId]);
  }
  return existing;
};

exports.getLoyalty = async (req, res) => {
  try {
    const loyalty = await ensureLoyalty(req.user.userId);
    const spendRow = await get(
      `SELECT COALESCE(SUM(total), 0) as totalSpend FROM orders WHERE userId = ? AND status != 'cancelled'`,
      [req.user.userId]
    );
    const totalSpend = spendRow?.totalSpend ?? 0;
    const tier = computeTier(totalSpend);
    const tierInfo = TIERS.find((t) => t.name === tier);
    const nextTier = TIERS[TIERS.findIndex((t) => t.name === tier) - 1];

    if (tier !== loyalty.tier) {
      await run('UPDATE loyalty_points SET tier = ? WHERE userId = ?', [tier, req.user.userId]);
    }

    res.json({
      points: loyalty.points,
      totalEarned: loyalty.totalEarned,
      tier,
      totalSpend,
      discount: tierInfo?.discount ?? 0,
      nextTier: nextTier ? { name: nextTier.name, minSpend: nextTier.minSpend, remaining: nextTier.minSpend - totalSpend } : null,
      dollarValue: Math.floor(loyalty.points / POINTS_TO_DOLLAR),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch loyalty' });
  }
};

exports.awardPoints = async (userId, orderTotal) => {
  await ensureLoyalty(userId);
  const pts = Math.floor(orderTotal * POINTS_PER_DOLLAR);
  await run(
    'UPDATE loyalty_points SET points = points + ?, totalEarned = totalEarned + ? WHERE userId = ?',
    [pts, pts, userId]
  );
};

exports.redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    if (!points || points < POINTS_TO_DOLLAR)
      return res.status(400).json({ message: `Minimum ${POINTS_TO_DOLLAR} points to redeem` });

    const loyalty = await get('SELECT points FROM loyalty_points WHERE userId = ?', [req.user.userId]);
    if (!loyalty || loyalty.points < points)
      return res.status(400).json({ message: 'Insufficient points' });

    const dollarValue = Math.floor(points / POINTS_TO_DOLLAR);
    await run('UPDATE loyalty_points SET points = points - ? WHERE userId = ?', [points, req.user.userId]);
    res.json({ message: 'Points redeemed', discount: dollarValue, pointsUsed: points });
  } catch { res.status(500).json({ message: 'Failed to redeem points' }); }
};

module.exports.POINTS_PER_DOLLAR = POINTS_PER_DOLLAR;
module.exports.POINTS_TO_DOLLAR = POINTS_TO_DOLLAR;
