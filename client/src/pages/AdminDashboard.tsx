import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
  fetchAllUsers, updateUserRole, fetchAllOrders, updateOrderStatus,
  fetchCoupons, createCoupon, toggleCoupon, deleteCoupon,
} from '../api';
import { clearAuth } from '../utils/auth';
import AnalyticsTab from '../components/AnalyticsTab';
import ImageUploader from '../components/ImageUploader';
import { bulkProductAction, exportOrdersCSV, exportProductsCSV,
  fetchAllFlashSales, createFlashSale, toggleFlashSale, deleteFlashSale,
  fetchAllReturns, updateReturnStatus, sendMarketingBlast, fetchProducts as apiFetchProducts } from '../api';

type Product = { id: number; name: string; description: string; price: number; image: string; category: string; size: string; stock: number };
type User = { id: number; username: string; email: string; role: string; isVerified: boolean; createdAt: string };
type Order = { id: number; userId: number; username: string; email: string; total: number; discount: number; status: string; createdAt: string; items: OrderItem[] };
type OrderItem = { id: number; name: string; price: number; quantity: number; size: string };
type Coupon = { id: number; code: string; discountType: string; discountValue: number; minOrder: number; maxUses: number | null; usesCount: number; expiresAt: string | null; active: boolean };

type FlashSale = { id: number; productId: number; name: string; salePrice: number; originalPrice: number; startsAt: string; endsAt: string; active: boolean };
type ReturnReq = { id: number; orderId: number; username: string; email: string; reason: string; details: string; status: string; createdAt: string; total: number };
type Tab = 'analytics' | 'products' | 'users' | 'orders' | 'coupons' | 'flash-sales' | 'returns' | 'marketing';

const BLANK_PRODUCT = { name: '', description: '', price: '', image: '', category: '', size: '', stock: '' };
const BLANK_COUPON = { code: '', discountType: 'percentage', discountValue: '', minOrder: '', maxUses: '', expiresAt: '' };
const CATEGORIES = ['T-Shirts', 'Hoodies', 'Accessories', 'Pants', 'Shoes'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('analytics');

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(BLANK_PRODUCT);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('discount');
  const [bulkValue, setBulkValue] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState(BLANK_COUPON);
  const [showCouponForm, setShowCouponForm] = useState(false);

  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [flashForm, setFlashForm] = useState({ productId: '', salePrice: '', startsAt: '', endsAt: '' });
  const [showFlashForm, setShowFlashForm] = useState(false);
  const [returns, setReturns] = useState<ReturnReq[]>([]);
  const [blastSubject, setBlastSubject] = useState('');
  const [blastBody, setBlastBody] = useState('');
  const [blastSegment, setBlastSegment] = useState('all');
  const [blastSending, setBlastSending] = useState(false);

  const logout = () => { clearAuth(); navigate('/'); };

  useEffect(() => {
    if (tab === 'products') loadProducts();
    if (tab === 'users') fetchAllUsers().then(setUsers).catch(() => toast.error('Failed to load users'));
    if (tab === 'orders') fetchAllOrders().then(setOrders).catch(() => toast.error('Failed to load orders'));
    if (tab === 'coupons') loadCoupons();
    if (tab === 'flash-sales') { fetchAllFlashSales().then(setFlashSales).catch(() => {}); loadProducts(); }
    if (tab === 'returns') fetchAllReturns().then(setReturns).catch(() => {});
    if (tab === 'marketing') loadProducts();
  }, [tab]);

  const loadProducts = () => fetchProducts().then(setProducts).catch(() => toast.error('Failed to load products'));
  const loadCoupons = () => fetchCoupons().then(setCoupons).catch(() => toast.error('Failed to load coupons'));

  const downloadCSV = async (fetchFn: () => Promise<Blob>, filename: string) => {
    try {
      const blob = await fetchFn();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const handleBulkAction = async () => {
    if (!selectedIds.length) return toast.error('Select at least one product');
    if ((bulkAction === 'discount' || bulkAction === 'category') && !bulkValue)
      return toast.error('Enter a value');
    try {
      const result = await bulkProductAction(selectedIds, bulkAction, bulkValue);
      toast.success(result.message);
      setSelectedIds([]); setBulkValue('');
      loadProducts();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Bulk action failed'); }
  };

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === products.length ? [] : products.map((p) => p.id));

  const openCreate = () => { setForm(BLANK_PRODUCT); setEditingId(null); setShowForm(true); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description || '', price: String(p.price), image: p.image || '', category: p.category || '', size: p.size || '', stock: String(p.stock) });
    setEditingId(p.id); setShowForm(true);
  };

  const handleSubmitProduct = async () => {
    if (!form.name || !form.price) return toast.error('Name and price are required');
    const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };
    try {
      if (editingId !== null) { await updateProduct(editingId, data); toast.success('Product updated'); }
      else { await createProduct(data); toast.success('Product created'); }
      setShowForm(false); setForm(BLANK_PRODUCT); setEditingId(null); loadProducts();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); toast.success('Deleted'); loadProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try { await updateUserRole(userId, role); setUsers((u) => u.map((x) => x.id === userId ? { ...x, role } : x)); toast.success('Role updated'); }
    catch { toast.error('Failed'); }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try { await updateOrderStatus(orderId, status); setOrders((o) => o.map((x) => x.id === orderId ? { ...x, status } : x)); toast.success('Status updated'); }
    catch { toast.error('Failed'); }
  };

  const handleCreateCoupon = async () => {
    if (!couponForm.code || !couponForm.discountValue) return toast.error('Code and value required');
    try {
      await createCoupon({
        code: couponForm.code, discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue),
        minOrder: couponForm.minOrder ? parseFloat(couponForm.minOrder) : 0,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : null,
        expiresAt: couponForm.expiresAt || null,
      });
      toast.success('Coupon created'); setCouponForm(BLANK_COUPON); setShowCouponForm(false); loadCoupons();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggleCoupon = async (id: number) => {
    try { await toggleCoupon(id); loadCoupons(); }
    catch { toast.error('Failed'); }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    try { await deleteCoupon(id); loadCoupons(); toast.success('Coupon deleted'); }
    catch { toast.error('Failed'); }
  };

  const handleCreateFlashSale = async () => {
    if (!flashForm.productId || !flashForm.salePrice || !flashForm.endsAt)
      return toast.error('Product, sale price and end date are required');
    try {
      await createFlashSale({ ...flashForm, productId: parseInt(flashForm.productId), salePrice: parseFloat(flashForm.salePrice), startsAt: flashForm.startsAt || new Date().toISOString() });
      toast.success('Flash sale created'); setShowFlashForm(false);
      fetchAllFlashSales().then(setFlashSales).catch(() => {});
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReturnStatus = async (id: number, status: string) => {
    try { await updateReturnStatus(id, status); setReturns((r) => r.map((x) => x.id === id ? { ...x, status } : x)); toast.success('Updated'); }
    catch { toast.error('Failed'); }
  };

  const handleBlast = async () => {
    if (!blastSubject || !blastBody) return toast.error('Subject and body required');
    if (!confirm(`Send email to all ${blastSegment} users?`)) return;
    setBlastSending(true);
    try {
      const result = await sendMarketingBlast({ subject: blastSubject, body: blastBody, segment: blastSegment });
      toast.success(result.message);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setBlastSending(false); }
  };

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <span className="logo" onClick={() => navigate('/')}>CHEEZEYY ADMIN</span>
        <div className="dash-tabs" style={{ flexWrap: 'wrap' }}>
          {(['analytics', 'products', 'users', 'orders', 'coupons', 'flash-sales', 'returns', 'marketing'] as Tab[]).map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="logout-btn" onClick={logout}>LOGOUT</button>
      </nav>

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        <div className="admin-tab">
          <h2 className="tab-title">ANALYTICS</h2>
          <AnalyticsTab />
        </div>
      )}

      {/* PRODUCTS */}
      {tab === 'products' && (
        <div className="admin-tab">
          <div className="admin-tab-header">
            <h2 className="tab-title">PRODUCTS</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="table-edit-btn" onClick={() => downloadCSV(exportProductsCSV, 'products.csv')}>⬇ CSV</button>
              <button className="add-btn" onClick={openCreate}>+ ADD PRODUCT</button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <motion.div className="bulk-bar" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <span className="bulk-count">{selectedIds.length} selected</span>
              <select className="role-select" value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                <option value="discount">Apply % Discount</option>
                <option value="category">Change Category</option>
                <option value="delete">Delete</option>
              </select>
              {bulkAction !== 'delete' && (
                <input className="bulk-input" placeholder={bulkAction === 'discount' ? 'e.g. 20' : 'Category name'}
                  value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} />
              )}
              <button className="add-btn" onClick={handleBulkAction}>APPLY</button>
              <button className="filter-clear" onClick={() => setSelectedIds([])}>Clear</button>
            </motion.div>
          )}

          {showForm && (
            <div className="product-form-overlay" onClick={() => setShowForm(false)}>
              <motion.div className="product-form" onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <h3>{editingId ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</h3>
                <input className="form-input" placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <textarea className="form-input form-textarea" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <input className="form-input" placeholder="Price *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <ImageUploader value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
                <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select className="form-input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                  <option value="">Select size</option>
                  {SIZES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <input className="form-input" placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                <div className="form-actions">
                  <button className="form-cancel" onClick={() => setShowForm(false)}>CANCEL</button>
                  <button className="form-submit" onClick={handleSubmitProduct}>{editingId ? 'UPDATE' : 'CREATE'}</button>
                </div>
              </motion.div>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>
                <th><input type="checkbox" checked={selectedIds.length === products.length && products.length > 0}
                  onChange={toggleSelectAll} className="bulk-checkbox" /></th>
                <th>Name</th><th>Category</th><th>Size</th><th>Price</th><th>Stock</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={selectedIds.includes(p.id) ? 'row-selected' : ''}>
                    <td><input type="checkbox" checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)} className="bulk-checkbox" /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.image && <img src={p.image} alt={p.name} style={{ width: 36, height: 36, objectFit: 'cover' }} />}
                        {p.name}
                      </div>
                    </td>
                    <td>{p.category || '—'}</td><td>{p.size || '—'}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td><span style={{ color: p.stock === 0 ? '#ff4444' : p.stock < 5 ? 'orange' : '#ccc' }}>{p.stock}</span></td>
                    <td>
                      <button className="table-edit-btn" onClick={() => openEdit(p)}>EDIT</button>
                      <button className="table-delete-btn" onClick={() => handleDelete(p.id)}>DELETE</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <p className="empty-text">No products yet.</p>}
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="admin-tab">
          <h2 className="tab-title">USERS</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td>{u.username}</td><td>{u.email}</td>
                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                    <td>{u.isVerified ? '✓' : '✗'}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select className="role-select" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                        <option value="client">client</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div className="admin-tab">
          <div className="admin-tab-header">
            <h2 className="tab-title">ORDERS</h2>
            <button className="table-edit-btn" onClick={() => downloadCSV(exportOrdersCSV, 'orders.csv')}>⬇ Export CSV</button>
          </div>
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Order #{order.id}</span>
                  <span className="order-user">{order.username} ({order.email})</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    {order.discount > 0 && <p style={{ color: '#33cc33', fontSize: '0.75rem' }}>-${order.discount.toFixed(2)}</p>}
                    <span className="order-total">${order.total.toFixed(2)}</span>
                  </div>
                  <select className="status-select" value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}>
                    {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <span className="oi-name">{item.name}</span>
                      {item.size && <span className="oi-size">({item.size})</span>}
                      <span className="oi-qty">x{item.quantity}</span>
                      <span className="oi-price">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="empty-text">No orders yet.</p>}
          </div>
        </div>
      )}

      {/* COUPONS */}
      {tab === 'coupons' && (
        <div className="admin-tab">
          <div className="admin-tab-header">
            <h2 className="tab-title">COUPONS</h2>
            <button className="add-btn" onClick={() => setShowCouponForm(true)}>+ CREATE COUPON</button>
          </div>

          {showCouponForm && (
            <div className="product-form-overlay" onClick={() => setShowCouponForm(false)}>
              <motion.div className="product-form" onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <h3>CREATE COUPON</h3>
                <input className="form-input" placeholder="Code (e.g. SAVE20)" value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} />
                <select className="form-input" value={couponForm.discountType}
                  onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
                <input className="form-input" placeholder={couponForm.discountType === 'percentage' ? 'Discount % (e.g. 20)' : 'Discount $ (e.g. 10)'}
                  type="number" value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
                <input className="form-input" placeholder="Min order $ (optional)" type="number" value={couponForm.minOrder}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })} />
                <input className="form-input" placeholder="Max uses (optional, blank = unlimited)" type="number" value={couponForm.maxUses}
                  onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })} />
                <input className="form-input" placeholder="Expiry date (optional)" type="date" value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} />
                <div className="form-actions">
                  <button className="form-cancel" onClick={() => setShowCouponForm(false)}>CANCEL</button>
                  <button className="form-submit" onClick={handleCreateCoupon}>CREATE</button>
                </div>
              </motion.div>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td><code style={{ color: '#ff0000', background: 'rgba(255,0,0,0.08)', padding: '2px 8px' }}>{c.code}</code></td>
                    <td>{c.discountType}</td>
                    <td>{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                    <td>{c.minOrder > 0 ? `$${c.minOrder}` : '—'}</td>
                    <td>{c.usesCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                    <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                    <td><span style={{ color: c.active ? '#33cc33' : '#555' }}>{c.active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className="table-edit-btn" onClick={() => handleToggleCoupon(c.id)}>{c.active ? 'DISABLE' : 'ENABLE'}</button>
                      <button className="table-delete-btn" onClick={() => handleDeleteCoupon(c.id)}>DELETE</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {coupons.length === 0 && <p className="empty-text">No coupons yet.</p>}
          </div>
        </div>
      )}

      {/* FLASH SALES */}
      {tab === 'flash-sales' && (
        <div className="admin-tab">
          <div className="admin-tab-header">
            <h2 className="tab-title">FLASH SALES</h2>
            <button className="add-btn" onClick={() => setShowFlashForm(true)}>+ CREATE FLASH SALE</button>
          </div>

          {showFlashForm && (
            <div className="product-form-overlay" onClick={() => setShowFlashForm(false)}>
              <motion.div className="product-form" onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <h3>CREATE FLASH SALE</h3>
                <select className="form-input" value={flashForm.productId}
                  onChange={(e) => setFlashForm({ ...flashForm, productId: e.target.value })}>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                </select>
                <input className="form-input" type="number" placeholder="Sale price ($)" value={flashForm.salePrice}
                  onChange={(e) => setFlashForm({ ...flashForm, salePrice: e.target.value })} />
                <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>Start time (blank = now)</label>
                <input className="form-input" type="datetime-local" value={flashForm.startsAt}
                  onChange={(e) => setFlashForm({ ...flashForm, startsAt: e.target.value })} />
                <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>End time *</label>
                <input className="form-input" type="datetime-local" value={flashForm.endsAt}
                  onChange={(e) => setFlashForm({ ...flashForm, endsAt: e.target.value })} />
                <div className="form-actions">
                  <button className="form-cancel" onClick={() => setShowFlashForm(false)}>CANCEL</button>
                  <button className="form-submit" onClick={handleCreateFlashSale}>CREATE</button>
                </div>
              </motion.div>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Original</th><th>Sale Price</th><th>Starts</th><th>Ends</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {flashSales.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>${s.originalPrice.toFixed(2)}</td>
                    <td style={{ color: 'red' }}>${s.salePrice.toFixed(2)}</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(s.startsAt).toLocaleString()}</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(s.endsAt).toLocaleString()}</td>
                    <td><span style={{ color: s.active ? '#33cc33' : '#555' }}>{s.active ? 'Active' : 'Paused'}</span></td>
                    <td>
                      <button className="table-edit-btn" onClick={() => toggleFlashSale(s.id).then(() => fetchAllFlashSales().then(setFlashSales))}>{s.active ? 'PAUSE' : 'RESUME'}</button>
                      <button className="table-delete-btn" onClick={() => deleteFlashSale(s.id).then(() => fetchAllFlashSales().then(setFlashSales))}>DELETE</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {flashSales.length === 0 && <p className="empty-text">No flash sales yet.</p>}
          </div>
        </div>
      )}

      {/* RETURNS */}
      {tab === 'returns' && (
        <div className="admin-tab">
          <h2 className="tab-title">RETURN REQUESTS</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Customer</th><th>Order</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.username}<br /><span style={{ color: '#555', fontSize: '0.75rem' }}>{r.email}</span></td>
                    <td>#{r.orderId}</td>
                    <td>{r.reason}</td>
                    <td><span className={`order-status status-${r.status}`}>{r.status}</span></td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select className="role-select" value={r.status} onChange={(e) => handleReturnStatus(r.id, e.target.value)}>
                        {['pending', 'approved', 'rejected', 'completed'].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {returns.length === 0 && <p className="empty-text">No return requests.</p>}
          </div>
        </div>
      )}

      {/* MARKETING */}
      {tab === 'marketing' && (
        <div className="admin-tab">
          <h2 className="tab-title">MARKETING SUITE</h2>
          <div className="marketing-form">
            <div className="profile-section">
              <h3>Send Email Blast</h3>
              <div className="profile-field">
                <label>Audience</label>
                <select className="filter-select" value={blastSegment} onChange={(e) => setBlastSegment(e.target.value)}>
                  <option value="all">All verified users</option>
                  <option value="buyers">Customers (placed orders)</option>
                  <option value="non-buyers">Non-buyers (registered, never ordered)</option>
                </select>
              </div>
              <div className="profile-field">
                <label>Subject</label>
                <input className="profile-input" placeholder="Email subject line" value={blastSubject} onChange={(e) => setBlastSubject(e.target.value)} />
              </div>
              <label style={{ color: '#555', fontSize: '0.75rem', letterSpacing: 1, display: 'block', marginBottom: 6 }}>BODY</label>
              <textarea className="review-textarea" style={{ minHeight: 140 }}
                placeholder="Write your announcement here... (plain text, line breaks are preserved)"
                value={blastBody} onChange={(e) => setBlastBody(e.target.value)} />
              <motion.button className="profile-save-btn" onClick={handleBlast} disabled={blastSending}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ marginTop: 12 }}>
                {blastSending ? 'Sending...' : 'SEND EMAIL BLAST'}
              </motion.button>
              <p style={{ color: '#444', fontSize: '0.75rem', marginTop: 12 }}>
                ⚠ This sends a real email to all matching users. Double-check before sending.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
