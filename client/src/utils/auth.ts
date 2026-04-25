export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getRole = () => localStorage.getItem('role') ?? '';
export const getUsername = () => localStorage.getItem('username') ?? '';

export const clearAuth = () => {
  ['token', 'role', 'email', 'userId', 'username'].forEach((k) => localStorage.removeItem(k));
};
