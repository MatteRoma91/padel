import jwt from 'jsonwebtoken';
import db from '../models/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'banana-padel-tour-secret-change-in-production';

/**
 * Verifica JWT e attacca user a req.user
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.get('SELECT id, username, name, nickname, role, category, photo_url, availability_confirmed FROM users WHERE id = ?', [decoded.userId])
      .then((user) => {
        if (!user) {
          return res.status(401).json({ error: 'Utente non trovato' });
        }
        req.user = user;
        next();
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Errore verifica utente' });
      });
  } catch (err) {
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}

/**
 * Solo admin
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accesso negato: richiesto ruolo admin' });
  }
  next();
}

export { JWT_SECRET };
