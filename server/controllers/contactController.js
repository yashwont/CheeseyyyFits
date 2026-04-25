const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT == 465,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

exports.sendMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    // Email to store owner
    await transporter.sendMail({
      from: `"CHEEZEYY Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="background:#0a0a0a;color:white;padding:32px;font-family:Arial,sans-serif;max-width:520px">
          <h2 style="color:#ff0000;letter-spacing:3px;margin-bottom:20px">NEW MESSAGE</h2>
          <p><strong style="color:#aaa">From:</strong> ${name} (${email})</p>
          <p><strong style="color:#aaa">Subject:</strong> ${subject}</p>
          <div style="margin-top:16px;padding:16px;background:#111;border-left:3px solid red">
            <p style="color:#ccc;white-space:pre-line">${message}</p>
          </div>
        </div>`,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"CHEEZEYY FITS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'We got your message — CHEEZEYY FITS',
      html: `
        <div style="background:#0a0a0a;color:white;padding:40px;font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
          <h1 style="color:#ff0000;letter-spacing:4px">CHEEZEYY FITS</h1>
          <h2 style="color:white;margin:20px 0 10px;font-size:1.1rem">Hey ${name}, we got it.</h2>
          <p style="color:#888;line-height:1.7">Your message has been received. Our team usually responds within 24 hours.</p>
          <div style="margin:24px 0;padding:16px;background:#111;border-left:3px solid #333">
            <p style="color:#666;font-size:0.85rem">Your message: "${message.slice(0, 120)}${message.length > 120 ? '...' : ''}"</p>
          </div>
          <p style="color:#444;font-size:0.75rem;margin-top:32px">CHEEZEYY FITS — support@cheezeyyfits.com</p>
        </div>`,
    });

    res.json({ message: 'Message sent! We\'ll get back to you within 24 hours.' });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ message: 'Failed to send message. Try emailing us directly.' });
  }
};
