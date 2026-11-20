const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// CREATE - Add a new user
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone || null]
    );
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json(user[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// READ ALL - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE - Get a single user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Update a user by ID
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    await db.query(
      'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
      [
        name || existing[0].name,
        email || existing[0].email,
        phone !== undefined ? phone : existing[0].phone,
        req.params.id
      ]
    );
    const [updated] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Delete a user by ID
app.delete('/api/users/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
