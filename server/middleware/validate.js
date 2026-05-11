const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Min 8 chars, at least one uppercase letter and one digit
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

function stripHtml(str) {
  return String(str).replace(/<[^>]*>/g, '').trim();
}

exports.validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: 'username, email, and password are required' });

  const cleanUsername = stripHtml(username);
  if (cleanUsername.length < 2 || cleanUsername.length > 50)
    return res.status(400).json({ message: 'Username must be 2–50 characters' });

  const cleanEmail = String(email).trim().toLowerCase();
  if (!emailRegex.test(cleanEmail))
    return res.status(400).json({ message: 'Invalid email address' });

  if (!passwordRegex.test(password))
    return res.status(400).json({
      message: 'Password must be at least 8 characters with at least one uppercase letter and one number',
    });

  req.body.username = cleanUsername;
  req.body.email = cleanEmail;
  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'email and password are required' });
  req.body.email = String(email).trim().toLowerCase();
  next();
};

exports.validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'email is required' });
  const cleanEmail = String(email).trim().toLowerCase();
  if (!emailRegex.test(cleanEmail))
    return res.status(400).json({ message: 'Invalid email address' });
  req.body.email = cleanEmail;
  next();
};

exports.validateResetPassword = (req, res, next) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res.status(400).json({ message: 'email, code, and newPassword are required' });
  if (!passwordRegex.test(newPassword))
    return res.status(400).json({
      message: 'Password must be at least 8 characters with at least one uppercase letter and one number',
    });
  req.body.email = String(email).trim().toLowerCase();
  next();
};

exports.validateProduct = (req, res, next) => {
  const { name, price, description } = req.body;

  if (name !== undefined) {
    const cleanName = stripHtml(name);
    if (cleanName.length === 0 || cleanName.length > 200)
      return res.status(400).json({ message: 'Product name must be 1–200 characters' });
    req.body.name = cleanName;
  }

  if (price !== undefined) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0)
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    req.body.price = numPrice;
  }

  if (description !== undefined) {
    req.body.description = stripHtml(description).slice(0, 2000);
  }

  next();
};
