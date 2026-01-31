import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/database.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password richiesti' });
    }

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        nickname: user.nickname,
        role: user.role,
        category: user.category,
        photo_url: user.photo_url,
        availability_confirmed: !!user.availability_confirmed,
      },
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

// GET /api/auth/me - verifica sessione
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(
      'SELECT id, username, name, nickname, role, category, photo_url, availability_confirmed FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (!user) {
      return res.status(401).json({ error: 'Utente non trovato' });
    }
    res.json({
      ...user,
      availability_confirmed: !!user.availability_confirmed,
    });
  } catch {
    return res.status(401).json({ error: 'Token non valido' });
  }
});

// POST /api/auth/logout (client-side: rimuovi token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout effettuato' });
});

export default router;
