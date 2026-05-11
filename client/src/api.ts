import axios from 'axios';

export const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Products
export const fetchProducts = (params?: Record<string, string>) =>
  API.get('/products', { params }).then((r) => r.data);

export const fetchProduct = (id: number) =>
  API.get(`/products/${id}`).then((r) => r.data);

export const createProduct = (data: object) =>
  API.post('/products', data).then((r) => r.data);

export const updateProduct = (id: number, data: object) =>
  API.put(`/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id: number) =>
  API.delete(`/products/${id}`).then((r) => r.data);

// Cart
export const fetchCart = () => API.get('/cart').then((r) => r.data);

export const addToCart = (productId: number, quantity: number, size?: string) =>
  API.post('/cart', { productId, quantity, size }).then((r) => r.data);

export const updateCartItem = (id: number, quantity: number) =>
  API.patch(`/cart/${id}`, { quantity }).then((r) => r.data);

export const removeCartItem = (id: number) =>
  API.delete(`/cart/${id}`).then((r) => r.data);

// Payment
export const createPaymentIntent = (couponCode?: string) =>
  API.post('/payment/create-intent', { couponCode }).then((r) => r.data);

export const confirmOrder = (paymentIntentId: string) =>
  API.post('/payment/confirm', { paymentIntentId }).then((r) => r.data);

// Orders
export const checkout = () => API.post('/orders/checkout').then((r) => r.data);

export const fetchMyOrders = () => API.get('/orders/my').then((r) => r.data);

export const fetchAllOrders = () => API.get('/orders').then((r) => r.data);

export const updateOrderStatus = (id: number, status: string) =>
  API.patch(`/orders/${id}/status`, { status }).then((r) => r.data);

// Profile
export const fetchProfile = () => API.get('/profile/me').then((r) => r.data);

export const updateProfile = (data: object) =>
  API.patch('/profile/me', data).then((r) => r.data);

export const changePassword = (data: object) =>
  API.patch('/profile/me/password', data).then((r) => r.data);

export const uploadAvatar = (file: File) => {
  const form = new FormData();
  form.append('avatar', file);
  return API.post('/profile/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

// Admin - users
export const fetchAllUsers = () => API.get('/profile/users').then((r) => r.data);

export const updateUserRole = (id: number, role: string) =>
  API.patch(`/profile/users/${id}/role`, { role }).then((r) => r.data);

// Wishlist
export const fetchWishlist = () => API.get('/wishlist').then((r) => r.data);
export const fetchWishlistIds = () => API.get('/wishlist/ids').then((r) => r.data);
export const toggleWishlist = (productId: number) =>
  API.post(`/wishlist/${productId}`).then((r) => r.data);

// Reviews
export const fetchReviews = (productId: number) =>
  API.get(`/products/${productId}/reviews`).then((r) => r.data);
export const submitReview = (productId: number, rating: number, comment: string) =>
  API.post(`/products/${productId}/reviews`, { rating, comment }).then((r) => r.data);
export const deleteMyReview = (productId: number) =>
  API.delete(`/products/${productId}/reviews/mine`).then((r) => r.data);

// Coupons
export const validateCoupon = (code: string, orderTotal: number) =>
  API.post('/coupons/validate', { code, orderTotal }).then((r) => r.data);
export const fetchCoupons = () => API.get('/coupons').then((r) => r.data);
export const createCoupon = (data: object) => API.post('/coupons', data).then((r) => r.data);
export const toggleCoupon = (id: number) => API.patch(`/coupons/${id}/toggle`).then((r) => r.data);
export const deleteCoupon = (id: number) => API.delete(`/coupons/${id}`).then((r) => r.data);

// Analytics
export const fetchAnalytics = () => API.get('/analytics/summary').then((r) => r.data);

// Upload
export const uploadImage = (file: File) => {
  const form = new FormData();
  form.append('image', file);
  return API.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

export const uploadMultipleImages = (files: File[]) => {
  const form = new FormData();
  files.forEach(f => form.append('images', f));
  return API.post('/upload/multiple', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

// Frequently bought together
export const fetchRelated = (productId: number) =>
  API.get(`/products/${productId}/related`).then((r) => r.data);

// Bulk actions
export const bulkProductAction = (ids: number[], action: string, value?: string) =>
  API.post('/products/bulk', { ids, action, value }).then((r) => r.data);

// CSV exports
export const exportOrdersCSV = () =>
  API.get('/orders/export', { responseType: 'blob' }).then((r) => r.data);
export const exportProductsCSV = () =>
  API.get('/products/export', { responseType: 'blob' }).then((r) => r.data);

// Flash Sales
export const fetchActiveSales = () => API.get('/flash-sales/active').then((r) => r.data);
export const fetchAllFlashSales = () => API.get('/flash-sales').then((r) => r.data);
export const createFlashSale = (data: object) => API.post('/flash-sales', data).then((r) => r.data);
export const toggleFlashSale = (id: number) => API.patch(`/flash-sales/${id}/toggle`).then((r) => r.data);
export const deleteFlashSale = (id: number) => API.delete(`/flash-sales/${id}`).then((r) => r.data);

// Loyalty
export const fetchLoyalty = () => API.get('/loyalty').then((r) => r.data);
export const redeemPoints = (points: number) => API.post('/loyalty/redeem', { points }).then((r) => r.data);

// Stock Alerts
export const subscribeStockAlert = (email: string, productId: number) =>
  API.post('/stock-alerts/subscribe', { email, productId }).then((r) => r.data);

// Returns
export const createReturn = (orderId: number, reason: string, details?: string) =>
  API.post('/returns', { orderId, reason, details }).then((r) => r.data);
export const fetchMyReturns = () => API.get('/returns/my').then((r) => r.data);
export const fetchAllReturns = () => API.get('/returns').then((r) => r.data);
export const updateReturnStatus = (id: number, status: string) =>
  API.patch(`/returns/${id}/status`, { status }).then((r) => r.data);

// Marketing
export const fetchSocialProof = () => API.get('/marketing/social-proof').then((r) => r.data);
export const sendMarketingBlast = (data: object) => API.post('/marketing/blast', data).then((r) => r.data);

// Chat
export const fetchMyMessages = () => API.get('/chat/my').then((r) => r.data);
export const fetchChatRooms = () => API.get('/chat/rooms').then((r) => r.data);
export const fetchRoomMessages = (userId: number) => API.get(`/chat/room/${userId}`).then((r) => r.data);
export const fetchChatUnread = () => API.get('/chat/unread').then((r) => r.data);

// Auth - password reset
export const forgotPassword = (email: string) =>
  API.post('/auth/forgot-password', { email }).then((r) => r.data);
export const resetPassword = (email: string, code: string, newPassword: string) =>
  API.post('/auth/reset-password', { email, code, newPassword }).then((r) => r.data);

// Predictive search
export const fetchAutocomplete = (q: string) =>
  API.get('/products/autocomplete', { params: { q } }).then((r) => r.data);
export const trackSearch = (q: string) =>
  API.post('/products/search-track', { q }).then((r) => r.data).catch(() => {});

// Saved-for-later
export const fetchSavedItems = () => API.get('/cart/saved').then((r) => r.data);
export const toggleSavedItem = (id: number) =>
  API.patch(`/cart/${id}/save`).then((r) => r.data);

// Restocked
export const fetchRestockedProducts = () =>
  API.get('/products/restocked').then((r) => r.data);

// Price drop alerts
export const subscribePriceAlert = (email: string, productId: number, thresholdPrice: number) =>
  API.post('/price-alerts/subscribe', { email, productId, thresholdPrice }).then((r) => r.data);

// Search analytics (admin)
export const fetchSearchAnalytics = () =>
  API.get('/analytics/search').then((r) => r.data);
