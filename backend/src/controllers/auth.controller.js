const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserModel } = require('../models');

const login = (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = UserModel.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const me = (req, res) => {
  return res.json({
    success: true,
    user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
};

module.exports = { login, me };
