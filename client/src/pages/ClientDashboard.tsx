import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  fetchProducts, fetchCart, addToCart, updateCartItem, removeCartItem,
  fetchMyOrders, fetchProfile, updateProfile, changePassword,
  fetchWishlistIds, toggleWishlist, fetchWishlist,
  fetchReviews, submitReview, deleteMyReview,
  fetchRelated, fetchLoyalty, subscribeStockAlert,
  createReturn, fetchMyReturns,
} from '../api';
import { clearAuth } from '../utils/auth';
import { useSocket } from '../context/SocketContext';
import { SkeletonGrid } from '../components/SkeletonCard';
import OrderProgress from '../components/OrderProgress';
import SizeGuideQuiz from '../components/SizeGuideQuiz';

type Product = { id: number; name: string; description: string; price: number; image: string; category: string; size: string; stock: number; badge?: string; unitsSold?: number; avgRating?: number };
type CartItem = { id: number; productId: number; name: string; price: number; quantity: number; size: string; image: string };
type Order = { id: number; total: number; discount: number; couponCode: string; status: string; createdAt: string; items: OrderItem[] };
type OrderItem = { id: number; name: string; price: number; quantity: number; size: string };
type Profile = { id: number; username: string; email: string; role: string; createdAt: string };
type Loyalty = { points: number; tier: string; totalSpend: number; discount: number; dollarValue: number; nextTier: { name: string; minSpend: number; remaining: number } | null };
type ReturnReq = { id: number; orderId: number; reason: string; status: string; createdAt: string };
type Tab = 'shop' | 'wishlist' | 'orders' | 'returns' | 'profile';
type Review = { id: number; userId: number; username: string; rating: number; comment: string; createdAt: string };

const CATEGORIES = ['All', 'T-Shirts', 'Hoodies', 'Accessories', 'Pants', 'Shoes'];
const SIZES = ['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'shop');
  const [cartOpen, setCartOpen] = useState(false);

  // Shop
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [size, setSize] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Wishlist
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Frequently bought together
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Loyalty
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);

  // Returns
  const [myReturns, setMyReturns] = useState<ReturnReq[]>([]);
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');

  // UI
  const [showSizeQuiz, setShowSizeQuiz] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertProductId, setAlertProductId] = useState<number | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // Real-time stock from socket
  const { stockUpdates } = useSocket();

  // Reviews modal
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const username = localStorage.getItem('username') || 'User';
  const userId = parseInt(localStorage.getItem('userId') ?? '0');

  const logout = () => { clearAuth(); navigate('/'); };

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (size !== 'All') params.size = size;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      setProducts(await fetchProducts(params));
    } catch { toast.error('Failed to load products'); }
    finally { setLoadingProducts(false); }
  }, [search, category, size, minPrice, maxPrice]);

  const loadCart = useCallback(async () => {
    try { setCart(await fetchCart()); } catch {}
  }, []);

  const loadWishlistIds = useCallback(async () => {
    try { setWishlistIds(await fetchWishlistIds()); } catch {}
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    loadCart();
    loadWishlistIds();
    // Welcome back banner: show if cart has items and user just logged in
    const lastLogin = localStorage.getItem('lastLogin');
    const now = Date.now();
    if (!lastLogin || now - parseInt(lastLogin) > 60000) {
      fetchCart().then((items) => { if (items.length > 0) setShowWelcomeBanner(true); }).catch(() => {});
    }
    localStorage.setItem('lastLogin', String(now));
  }, [loadCart, loadWishlistIds]);

  useEffect(() => {
    if (tab === 'orders') fetchMyOrders().then(setOrders).catch(() => toast.error('Failed to load orders'));
    if (tab === 'wishlist') fetchWishlist().then(setWishlistItems).catch(() => {});
    if (tab === 'profile') {
      fetchProfile().then((p) => { setProfile(p); setEditUsername(p.username); }).catch(() => {});
      fetchLoyalty().then(setLoyalty).catch(() => {});
    }
    if (tab === 'returns') {
      fetchMyOrders().then(setOrders).catch(() => {});
      fetchMyReturns().then(setMyReturns).catch(() => {});
    }
  }, [tab]);

  const handleAddToCart = async (product: Product, sz?: string) => {
    try {
      await addToCart(product.id, 1, sz);
      await loadCart();
      toast.success(`${product.name} added to cart`);
      setCartOpen(true);
      fetchRelated(product.id).then(setRelatedProducts).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleToggleWishlist = async (productId: number, name: string) => {
    try {
      const result = await toggleWishlist(productId);
      setWishlistIds((prev) => result.wishlisted ? [...prev, productId] : prev.filter((id) => id !== productId));
      toast.success(result.wishlisted ? `${name} added to wishlist` : `${name} removed from wishlist`);
    } catch { toast.error('Failed to update wishlist'); }
  };

  const openReviews = async (product: Product) => {
    setReviewProduct(product);
    setReviewsLoading(true);
    try {
      const data = await fetchReviews(product.id);
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
      setReviewTotal(data.total);
      const mine = data.reviews.find((r: Review) => r.userId === userId);
      setMyRating(mine?.rating ?? 0);
      setMyComment(mine?.comment ?? '');
    } catch { toast.error('Failed to load reviews'); }
    finally { setReviewsLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (!myRating) return toast.error('Select a rating');
    if (!reviewProduct) return;
    try {
      const result = await submitReview(reviewProduct.id, myRating, myComment);
      setAvgRating(result.avgRating);
      setReviewTotal(result.total);
      const data = await fetchReviews(reviewProduct.id);
      setReviews(data.reviews);
      toast.success('Review saved');
    } catch { toast.error('Failed to save review'); }
  };

  const handleDeleteMyReview = async () => {
    if (!reviewProduct) return;
    try {
      await deleteMyReview(reviewProduct.id);
      setMyRating(0); setMyComment('');
      const data = await fetchReviews(reviewProduct.id);
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
      setReviewTotal(data.total);
      toast.success('Review removed');
    } catch { toast.error('Failed to remove review'); }
  };

  const handleUpdateQty = async (id: number, qty: number) => {
    try {
      await updateCartItem(id, qty);
      await loadCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleRemoveItem = async (id: number) => {
    try { await removeCartItem(id); await loadCart(); toast.success('Removed'); } catch { toast.error('Failed to remove'); }
  };

  const handleStockAlert = async () => {
    if (!alertEmail || !alertProductId) return;
    try {
      await subscribeStockAlert(alertEmail, alertProductId);
      toast.success('We\'ll email you when it\'s back!');
      setAlertProductId(null); setAlertEmail('');
    } catch { toast.error('Failed to subscribe'); }
  };

  const handleReturn = async () => {
    if (!returnOrderId || !returnReason) return toast.error('Select an order and reason');
    try {
      await createReturn(parseInt(returnOrderId), returnReason, returnDetails);
      toast.success('Return request submitted');
      setReturnOrderId(''); setReturnReason(''); setReturnDetails('');
      fetchMyReturns().then(setMyReturns).catch(() => {});
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to submit'); }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ username: editUsername });
      localStorage.setItem('username', editUsername);
      toast.success('Profile updated');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) return toast.error('Passwords do not match');
    if (newPwd.length < 6) return toast.error('Min 6 characters');
    try {
      await changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      toast.success('Password changed');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const StarRow = ({ value, onChange, readonly }: { value: number; onChange?: (n: number) => void; readonly?: boolean }) => (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`star ${n <= value ? 'star-filled' : ''} ${!readonly ? 'star-clickable' : ''}`}
          onClick={() => !readonly && onChange?.(n)}>★</span>
      ))}
    </div>
  );

  const ProductCard = ({ p }: { p: Product }) => {
    const wishlisted = wishlistIds.includes(p.id);
    const liveStock = stockUpdates[p.id] ?? p.stock;
    const isBestSeller = (p.unitsSold ?? 0) >= 5;
    const badge = isBestSeller ? 'Best Seller' : p.badge;

    return (
      <motion.div className="product-card"
        variants={{ hidden: { opacity: 0, y: 40, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1 } }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', borderColor: '#2a2a2a' }}>
        <div className="product-img-wrap">
          {p.image ? <img src={p.image} alt={p.name} className="product-img" />
            : <div className="product-img-placeholder">NO IMAGE</div>}
          {liveStock === 0 && <span className="out-of-stock-badge">OUT OF STOCK</span>}
          {liveStock > 0 && liveStock < 5 && <span className="low-stock-badge">Only {liveStock} left!</span>}
          {badge && liveStock > 0 && <span className={`product-badge badge-${badge.toLowerCase().replace(' ', '-')}`}>{badge}</span>}
          <motion.button className={`wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
            onClick={() => handleToggleWishlist(p.id, p.name)}
            whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}>
            {wishlisted ? '♥' : '♡'}
          </motion.button>
        </div>
        <div className="product-info">
          {p.category && <span className="product-category">{p.category}</span>}
          <h3 className="product-name">{p.name}</h3>
          {p.description && <p className="product-desc">{p.description}</p>}
          {p.size && <p className="product-size">Size: {p.size}</p>}
          {p.avgRating !== undefined && p.avgRating > 0 && (
            <p className="product-rating">{'★'.repeat(Math.round(p.avgRating))}{'☆'.repeat(5 - Math.round(p.avgRating))} <span style={{ color: '#555', fontSize: '0.72rem' }}>({p.avgRating.toFixed(1)})</span></p>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button className="review-link" onClick={() => openReviews(p)}>Reviews</button>
            <button className="review-link" onClick={() => setShowSizeQuiz(true)}>Size Guide</button>
          </div>
          <div className="product-footer">
            <span className="product-price">${p.price.toFixed(2)}</span>
            {liveStock === 0 ? (
              <motion.button className="add-cart-btn stock-alert-trigger"
                onClick={() => setAlertProductId(p.id)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                NOTIFY ME
              </motion.button>
            ) : (
              <motion.button className="add-cart-btn"
                onClick={() => handleAddToCart(p, p.size || undefined)}
                whileHover={{ scale: 1.05, boxShadow: '0 0 14px rgba(255,0,0,0.4)' }}
                whileTap={{ scale: 0.96 }}>
                ADD TO CART
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="dashboard">
      {/* NAV */}
      <nav className="dash-nav">
        <span className="logo" onClick={() => navigate('/')}>CHEEZEYY</span>
        <div className="dash-tabs">
          {(['shop', 'wishlist', 'orders', 'returns', 'profile'] as Tab[]).map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.toUpperCase()}
              {t === 'wishlist' && wishlistIds.length > 0 && <span className="tab-badge">{wishlistIds.length}</span>}
            </button>
          ))}
        </div>
        <div className="dash-nav-right">
          <motion.button className="cart-btn" onClick={() => setCartOpen(true)} whileHover={{ scale: 1.1 }}>
            🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </motion.button>
          <span className="welcome-text">Hi, {username}</span>
          <button className="logout-btn" onClick={logout}>LOGOUT</button>
        </div>
      </nav>

      {/* WELCOME BACK BANNER */}
      <AnimatePresence>
        {showWelcomeBanner && (
          <motion.div className="welcome-banner"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <span>👋 Welcome back, {username}! Your cart items are still waiting for you.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="welcome-banner-btn" onClick={() => { setShowWelcomeBanner(false); setCartOpen(true); }}>View Cart</button>
              <button className="welcome-banner-close" onClick={() => setShowWelcomeBanner(false)}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHOP TAB */}
      {tab === 'shop' && (
        <div className="shop-tab">
          <div className="shop-filters">
            <input className="search-input" placeholder="Search products..." value={search}
              onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadProducts()} />
            <div className="filter-row">
              <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select className="filter-select" value={size} onChange={(e) => setSize(e.target.value)}>
                {SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input className="price-input" placeholder="Min $" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <input className="price-input" placeholder="Max $" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              <button className="filter-btn" onClick={loadProducts}>FILTER</button>
              <button className="filter-clear" onClick={() => { setSearch(''); setCategory('All'); setSize('All'); setMinPrice(''); setMaxPrice(''); }}>CLEAR</button>
            </div>
          </div>
          {loadingProducts ? <SkeletonGrid count={8} />
            : products.length === 0 ? <p className="empty-text">No products found.</p>
            : (
              <motion.div className="product-grid" initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
                {products.map((p) => <ProductCard key={p.id} p={p} />)}
              </motion.div>
            )}
        </div>
      )}

      {/* WISHLIST TAB */}
      {tab === 'wishlist' && (
        <div className="shop-tab">
          <h2 className="tab-title">WISHLIST</h2>
          {wishlistItems.length === 0 ? (
            <p className="empty-text">No saved items. Heart a product to save it here.</p>
          ) : (
            <motion.div className="product-grid" initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
              {wishlistItems.map((p) => <ProductCard key={p.id} p={p} />)}
            </motion.div>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="orders-tab">
          <h2 className="tab-title">MY ORDERS</h2>
          {orders.length === 0 ? (
            <p className="empty-text">No orders yet. <button className="link-btn" onClick={() => setTab('shop')}>Start shopping</button></p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <motion.div key={order.id} className="order-card"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="order-header">
                    <span className="order-id">Order #{order.id}</span>
                    <span className={`order-status status-${order.status}`}>
                      {order.status === 'confirmed' ? 'ORDER RECEIVED' : order.status.toUpperCase()}
                    </span>
                    <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      {order.discount > 0 && <p style={{ color: '#33cc33', fontSize: '0.75rem' }}>-${order.discount.toFixed(2)} {order.couponCode && `(${order.couponCode})`}</p>}
                      <span className="order-total">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <OrderProgress status={order.status} />
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RETURNS TAB */}
      {tab === 'returns' && (
        <div className="orders-tab">
          <h2 className="tab-title">RETURNS</h2>
          <div className="return-form">
            <h3 className="return-form-title">REQUEST A RETURN</h3>
            <select className="filter-select" style={{ width: '100%', marginBottom: 10 }}
              value={returnOrderId} onChange={(e) => setReturnOrderId(e.target.value)}>
              <option value="">Select an order</option>
              {orders.filter((o) => ['delivered', 'shipped'].includes(o.status)).map((o) => (
                <option key={o.id} value={o.id}>Order #{o.id} — ${o.total.toFixed(2)} ({o.status})</option>
              ))}
            </select>
            <select className="filter-select" style={{ width: '100%', marginBottom: 10 }}
              value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
              <option value="">Select a reason</option>
              {['Wrong size', 'Item damaged', 'Not as described', 'Changed my mind', 'Late delivery', 'Other'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <textarea className="review-textarea" placeholder="Additional details (optional)"
              value={returnDetails} onChange={(e) => setReturnDetails(e.target.value)} />
            <motion.button className="profile-save-btn" onClick={handleReturn}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              SUBMIT RETURN REQUEST
            </motion.button>
          </div>

          {myReturns.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: 'red', fontSize: '0.8rem', letterSpacing: 2, marginBottom: 16 }}>MY RETURN REQUESTS</h3>
              {myReturns.map((r) => (
                <div key={r.id} className="order-card" style={{ marginBottom: 12 }}>
                  <div className="order-header">
                    <span className="order-id">Return #{r.id}</span>
                    <span className="order-id" style={{ color: '#aaa' }}>Order #{r.orderId}</span>
                    <span style={{ color: '#777', fontSize: '0.8rem' }}>{r.reason}</span>
                    <span className={`order-status status-${r.status}`}>{r.status.toUpperCase()}</span>
                    <span className="order-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === 'profile' && profile && (
        <div className="profile-tab">
          <h2 className="tab-title">MY PROFILE</h2>
          <div className="profile-sections">
            <div className="profile-section">
              <h3>Account Info</h3>
              <div className="profile-field"><label>Email</label><p>{profile.email}</p></div>
              <div className="profile-field"><label>Role</label><p>{profile.role}</p></div>
              <div className="profile-field"><label>Member since</label><p>{new Date(profile.createdAt).toLocaleDateString()}</p></div>
            </div>
            <div className="profile-section">
              <h3>Edit Profile</h3>
              <div className="profile-field"><label>Username</label>
                <input className="profile-input" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
              </div>
              <button className="profile-save-btn" onClick={handleUpdateProfile}>SAVE CHANGES</button>
            </div>
            <div className="profile-section">
              <h3>Change Password</h3>
              <input className="profile-input" type="password" placeholder="Current password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
              <input className="profile-input" type="password" placeholder="New password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              <input className="profile-input" type="password" placeholder="Confirm new password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
              <button className="profile-save-btn" onClick={handleChangePassword}>CHANGE PASSWORD</button>
            </div>

            {loyalty && (
              <div className="profile-section">
                <h3>Loyalty & Rewards</h3>
                <div className={`tier-badge tier-${loyalty.tier.toLowerCase()}`}>{loyalty.tier}</div>
                <div style={{ display: 'flex', gap: 24, margin: '16px 0', flexWrap: 'wrap' }}>
                  <div><p style={{ color: '#555', fontSize: '0.7rem', letterSpacing: 1 }}>POINTS</p><p style={{ color: 'red', fontSize: '1.4rem', fontWeight: 900 }}>{loyalty.points}</p></div>
                  <div><p style={{ color: '#555', fontSize: '0.7rem', letterSpacing: 1 }}>VALUE</p><p style={{ color: '#33cc33', fontSize: '1.4rem', fontWeight: 900 }}>${loyalty.dollarValue}</p></div>
                  <div><p style={{ color: '#555', fontSize: '0.7rem', letterSpacing: 1 }}>TOTAL SPENT</p><p style={{ color: '#ccc', fontSize: '1.4rem', fontWeight: 900 }}>${loyalty.totalSpend.toFixed(0)}</p></div>
                </div>
                {loyalty.discount > 0 && <p style={{ color: '#33cc33', fontSize: '0.85rem', marginBottom: 10 }}>✓ {loyalty.tier} discount: {loyalty.discount * 100}% off all orders</p>}
                {loyalty.nextTier && <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: 12 }}>Spend ${loyalty.nextTier.remaining.toFixed(0)} more to reach {loyalty.nextTier.name}</p>}
                <p style={{ color: '#444', fontSize: '0.75rem' }}>1 point earned per $1 spent · 100 points = $1 credit</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CART SIDEBAR */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={() => setCartOpen(false)}>
            <motion.div className="cart-sidebar" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }} onClick={(e) => e.stopPropagation()}>
              <div className="cart-header">
                <h3>YOUR CART</h3>
                <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
              </div>
              {cart.length === 0 ? <p className="cart-empty">Your cart is empty.</p> : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item.id} className="cart-item">
                        {item.image && <img src={item.image} alt={item.name} className="cart-item-img" />}
                        <div className="cart-item-info">
                          <p className="cart-item-name">{item.name}</p>
                          {item.size && <p className="cart-item-size">{item.size}</p>}
                          <p className="cart-item-price">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="cart-item-qty">
                          <button onClick={() => item.quantity > 1 ? handleUpdateQty(item.id, item.quantity - 1) : handleRemoveItem(item.id)}>−</button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (stockUpdates[item.productId] ?? item.stock ?? 99)}
                            title={item.quantity >= (stockUpdates[item.productId] ?? item.stock ?? 99) ? 'Max stock reached' : ''}
                          >+</button>
                        </div>
                        <button className="cart-remove" onClick={() => handleRemoveItem(item.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                  {relatedProducts.length > 0 && (
                    <div className="cart-related">
                      <p className="cart-related-title">FREQUENTLY BOUGHT TOGETHER</p>
                      {relatedProducts.slice(0, 3).map((p) => (
                        <div key={p.id} className="cart-related-item">
                          {p.image && <img src={p.image} alt={p.name} className="cart-related-img" />}
                          <div className="cart-related-info">
                            <p className="cart-related-name">{p.name}</p>
                            <p className="cart-related-price">${p.price.toFixed(2)}</p>
                          </div>
                          <motion.button className="cart-related-add"
                            onClick={() => handleAddToCart(p, p.size || undefined)}
                            disabled={p.stock === 0}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            +
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="cart-footer">
                    <div className="cart-total"><span>TOTAL</span><span>${cartTotal.toFixed(2)}</span></div>
                    <motion.button className="checkout-btn" onClick={() => { setCartOpen(false); navigate('/checkout'); }}
                      whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(255,0,0,0.4)' }} whileTap={{ scale: 0.98 }}>
                      CHECKOUT
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIZE GUIDE QUIZ */}
      {showSizeQuiz && <SizeGuideQuiz onClose={() => setShowSizeQuiz(false)} />}

      {/* STOCK ALERT MODAL */}
      <AnimatePresence>
        {alertProductId && (
          <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAlertProductId(null)}>
            <motion.div className="reviews-modal" style={{ maxHeight: 'auto' }}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="reviews-modal-header">
                <h3>BACK IN STOCK ALERT</h3>
                <button className="cart-close" onClick={() => setAlertProductId(null)}>✕</button>
              </div>
              <div style={{ padding: 24 }}>
                <p style={{ color: '#777', marginBottom: 16, fontSize: '0.85rem' }}>Enter your email and we'll notify you the moment this item is back in stock.</p>
                <input className="profile-input" type="email" placeholder="your@email.com"
                  value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStockAlert()} />
                <motion.button className="profile-save-btn" style={{ width: '100%', marginTop: 8 }}
                  onClick={handleStockAlert} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  NOTIFY ME
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVIEWS MODAL */}
      <AnimatePresence>
        {reviewProduct && (
          <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setReviewProduct(null)}>
            <motion.div className="reviews-modal" initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }} onClick={(e) => e.stopPropagation()}>
              <div className="reviews-modal-header">
                <div>
                  <h3>{reviewProduct.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ color: '#f5a623', fontSize: '1rem' }}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                    <span style={{ color: '#555', fontSize: '0.8rem' }}>{avgRating} ({reviewTotal} reviews)</span>
                  </div>
                </div>
                <button className="cart-close" onClick={() => setReviewProduct(null)}>✕</button>
              </div>

              {/* Write review */}
              <div className="review-write">
                <p className="review-write-label">YOUR REVIEW</p>
                <StarRow value={myRating} onChange={setMyRating} />
                <textarea className="review-textarea" placeholder="Write something... (optional)" value={myComment}
                  onChange={(e) => setMyComment(e.target.value)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button className="filter-btn" style={{ flex: 1 }} onClick={handleSubmitReview}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    {reviews.find((r) => r.userId === userId) ? 'UPDATE' : 'SUBMIT'}
                  </motion.button>
                  {reviews.find((r) => r.userId === userId) && (
                    <motion.button className="filter-clear" onClick={handleDeleteMyReview}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      REMOVE
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Reviews list */}
              <div className="reviews-list">
                {reviewsLoading ? <p className="loading-text" style={{ padding: 20 }}>Loading...</p>
                  : reviews.length === 0 ? <p className="empty-text" style={{ padding: 20 }}>No reviews yet. Be the first!</p>
                  : reviews.map((r) => (
                    <div key={r.id} className="review-item">
                      <div className="review-item-header">
                        <span className="review-author">{r.username}</span>
                        <span style={{ color: '#f5a623', fontSize: '0.85rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.comment && <p className="review-comment">{r.comment}</p>}
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
