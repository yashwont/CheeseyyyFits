const API_BASE_URL = 'http://localhost:5000/api/auth'; // Updated to include /api/auth prefix

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
};

export const registerUser = async (username, email, password) => {
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
};

export const verifyUser = async (email, otp) => {
  const res = await fetch(`${API_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: otp }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Invalid code');
  }
  return data;
};
