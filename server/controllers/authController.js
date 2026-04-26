const userModel = require('../models/userModel');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, email, and password' });
  }

  try {
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user = existingUser;
    if (!user) {
      user = await userModel.createUser({ username, email, password: hashedPassword });
    } else {
      await userModel.updatePassword(email, hashedPassword);
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await userModel.saveOTP(email, verificationCode, otpExpiry);

    const mailOptions = {
      from: `"CHEEZEYY FITS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <p>Hello ${username},</p>
        <p>Thank you for registering! Please use the following code to verify your email address:</p>
        <p style="font-size: 24px; font-weight: bold;">${verificationCode}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not register, please ignore this email.</p>
      `,
    };

    console.log(`Sending OTP ${verificationCode} to ${email}...`);
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`OTP email FAILED for ${email}:`, error.message);
        return res.status(201).json({
          message: 'User registered successfully, but failed to send verification email.',
          userId: user.id,
          email: user.email,
        });
      }
      console.log(`OTP email sent OK to ${email} — Message ID: ${info.messageId}`);
      res.status(201).json({
        message: 'User registered successfully. Please check your email for the verification code.',
        userId: user.id,
        email: user.email,
      });
    });

  } catch (error) {
    console.error('Registration error:', error.message || error);
    res.status(500).json({ message: 'Failed to register user' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please check your email for the verification code.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message || error);
    res.status(500).json({ message: 'Failed to login' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await userModel.findUserByEmail(email);
    // Always respond the same way to prevent email enumeration
    if (!user || !user.isVerified) {
      return res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await userModel.saveOTP(email, otp, otpExpiry);

    transporter.sendMail({
      from: `"CHEEZEYY FITS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Code',
      html: `
        <p>Hi ${user.username},</p>
        <p>Use this code to reset your password. It expires in 10 minutes.</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${otp}</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    }, (err) => {
      if (err) console.error('Reset email failed:', err.message);
    });

    res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Failed to process request' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res.status(400).json({ message: 'Email, code, and new password are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user || !user.otp) return res.status(400).json({ message: 'Invalid or expired code' });
    if (new Date() > new Date(user.otpExpiry)) return res.status(400).json({ message: 'Code has expired' });
    if (user.otp !== code) return res.status(400).json({ message: 'Invalid code' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(email, hashed);
    await userModel.clearOTP(email);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

exports.verifyUser = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Please provide email and verification code' });
  }

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user || !user.otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'Verification code has expired. Please register again.' });
    }

    if (user.otp !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const updateSuccess = await userModel.updateUserVerification(email, 'verified');
    if (updateSuccess) {
      await userModel.clearOTP(email);
      res.status(200).json({ message: 'Email verified successfully' });
    } else {
      res.status(404).json({ message: 'User not found for verification' });
    }
  } catch (error) {
    console.error('Verification error:', error.message || error);
    res.status(500).json({ message: 'Failed to verify email' });
  }
};
