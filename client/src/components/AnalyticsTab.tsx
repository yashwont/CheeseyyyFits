import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { fetchAnalytics } from '../api';
import toast from 'react-hot-toast';

type Summary = {
  revenue: { total: number; totalDiscount: number };
  orders: { total: number; confirmed: number; processing: number; shipped: number; delivered: number; cancelled: number };
  users: { total: number; verified: number };
  topProducts: { name: string; unitsSold: number; revenue: number; image: string }[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  statusBreakdown: { status: string; count: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#33bbff', processing: '#4d94ff', shipped: '#cc66ff',
  delivered: '#33cc33', cancelled: '#ff4444',
};

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -3, borderColor: '#2a2a2a' }}>
    <p className="stat-card-label">{label}</p>
    <p className="stat-card-value">{value}</p>
    {sub && <p className="stat-card-sub">{sub}</p>}
  </motion.div>
);

export default function AnalyticsTab() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading-text">Loading analytics...</p>;
  if (!data) return <p className="empty-text">No data available.</p>;

  const { revenue, orders, users, topProducts, dailyRevenue } = data;

  return (
    <div className="analytics-tab">
      {/* Stat Cards */}
      <div className="analytics-stats">
        <StatCard label="Total Revenue" value={`$${revenue.total.toFixed(2)}`} sub={`$${revenue.totalDiscount.toFixed(2)} discounted`} />
        <StatCard label="Total Orders" value={orders.total} sub={`${orders.delivered} delivered`} />
        <StatCard label="Customers" value={users.total} sub={`${users.verified} verified`} />
        <StatCard label="Avg Order Value" value={orders.total ? `$${(revenue.total / orders.total).toFixed(2)}` : '$0'} />
      </div>

      {/* Daily Revenue Chart */}
      <div className="analytics-chart-card">
        <h3 className="chart-title">REVENUE — LAST 30 DAYS</h3>
        {dailyRevenue.length === 0 ? (
          <p className="empty-text" style={{ padding: '30px 0' }}>No revenue data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 11 }}
                tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: '#555', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 0 }}
                labelStyle={{ color: '#aaa' }} itemStyle={{ color: '#ff0000' }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#ff0000" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: '#ff0000' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products */}
      <div className="analytics-chart-card">
        <h3 className="chart-title">TOP PRODUCTS BY REVENUE</h3>
        {topProducts.length === 0 ? (
          <p className="empty-text" style={{ padding: '30px 0' }}>No sales yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#555', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 0 }}
                labelStyle={{ color: '#aaa' }} itemStyle={{ color: '#ff0000' }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#ff0000" radius={[2, 2, 0, 0]}>
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={`rgba(255,0,0,${1 - i * 0.15})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Order Status Breakdown */}
      <div className="analytics-chart-card">
        <h3 className="chart-title">ORDER STATUS BREAKDOWN</h3>
        <div className="status-breakdown">
          {(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((s) => {
            const count = (orders as any)[s] ?? 0;
            const pct = orders.total ? Math.round((count / orders.total) * 100) : 0;
            return (
              <div key={s} className="status-bar-row">
                <span className="status-bar-label">{s}</span>
                <div className="status-bar-track">
                  <motion.div className="status-bar-fill"
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ background: STATUS_COLORS[s] }} />
                </div>
                <span className="status-bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
