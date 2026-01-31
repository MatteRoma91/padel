import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import db from '../models/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { CATEGORIES, ROLES } from '../models/database.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    cb(null, 'user-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo immagini permesse'));
    }
  },
});

// Genera username univoco
function generateUsername(name) {
  const base = (name || 'user').toLowerCase().replace(/\s+/g, '');
  return base + Date.now().toString(36).slice(-6);
}

// Genera password casuale
function generatePassword() {
  return Math.random().toString(36).slice(-10) + 'A1!';
}

// GET /api/users - Lista utenti (Admin: tutti, Player: solo se stessi per profilo)
router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const users = await db.all(`
        SELECT u.id, u.username, u.name, u.nickname, u.role, u.category, u.photo_url, u.availability_confirmed, u.created_at,
               COALESCE(ps.matches_played, 0) as matches_played,
               COALESCE(ps.wins, 0) as wins,
               COALESCE(ps.losses, 0) as losses,
               COALESCE(ps.win_percentage, 0) as win_percentage,
               COALESCE(ps.total_tour_points, 0) as total_tour_points
        FROM users u
        LEFT JOIN player_stats ps ON u.id = ps.user_id
        ORDER BY u.name
      `);
      return res.json(users.map((u) => ({ ...u, availability_confirmed: !!u.availability_confirmed })));
    }
    // Player vede solo se stesso in lista limitata
    const me = await db.get(
      `SELECT u.*, COALESCE(ps.matches_played,0) as matches_played, COALESCE(ps.wins,0) as wins, COALESCE(ps.losses,0) as losses, COALESCE(ps.win_percentage,0) as win_percentage
       FROM users u LEFT JOIN player_stats ps ON u.id = ps.user_id WHERE u.id = ?`,
      [req.user.id]
    );
    return res.json(me ? [{ ...me, availability_confirmed: !!me.availability_confirmed }] : []);
  } catch (error) {
    console.error('Errore GET users:', error);
    res.status(500).json({ error: 'Errore nel recupero utenti' });
  }
});

// GET /api/users/players - Lista solo giocatori (per Profili, compatibilità con vecchia API players)
router.get('/players', requireAuth, async (req, res) => {
  try {
    const users = await db.all(`
      SELECT u.id, u.username, u.name, u.nickname, u.role, u.category, u.photo_url, u.availability_confirmed,
             COALESCE(ps.matches_played, 0) as matches_played,
             COALESCE(ps.wins, 0) as wins,
             COALESCE(ps.losses, 0) as losses,
             COALESCE(ps.win_percentage, 0) as win_percentage
      FROM users u
      LEFT JOIN player_stats ps ON u.id = ps.user_id
      WHERE u.role = 'player'
      ORDER BY u.name
    `);
    res.json(users.map((u) => ({ ...u, availability_confirmed: !!u.availability_confirmed })));
  } catch (error) {
    console.error('Errore GET players:', error);
    res.status(500).json({ error: 'Errore nel recupero giocatori' });
  }
});

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await db.get(
      `SELECT u.id, u.username, u.name, u.nickname, u.role, u.category, u.photo_url, u.availability_confirmed,
              COALESCE(ps.matches_played, 0) as matches_played,
              COALESCE(ps.wins, 0) as wins,
              COALESCE(ps.losses, 0) as losses,
              COALESCE(ps.win_percentage, 0) as win_percentage
       FROM users u LEFT JOIN player_stats ps ON u.id = ps.user_id WHERE u.id = ?`,
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    res.json({ ...user, availability_confirmed: !!user.availability_confirmed });
  } catch (error) {
    console.error('Errore GET user:', error);
    res.status(500).json({ error: 'Errore nel recupero utente' });
  }
});

// POST /api/users - Crea utente (solo Admin)
router.post('/', requireAuth, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, nickname, role, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obbligatorio' });
    const r = role && ROLES.includes(role) ? role : 'player';
    const cat = category && CATEGORIES.includes(category) ? category : null;

    const username = generateUsername(name);
    const password = generatePassword();
    const hash = await bcrypt.hash(password, 10);
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await db.run(
      'INSERT INTO users (username, password_hash, name, nickname, role, category, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hash, name, nickname || name, r, cat, photo_url]
    );

    await db.run('INSERT INTO player_stats (user_id) VALUES (?)', [result.lastID]);
    if (r === 'player') {
      await db.run('INSERT OR IGNORE INTO cumulative_rankings (user_id) VALUES (?)', [result.lastID]);
    }

    res.status(201).json({
      id: result.lastID,
      username,
      password,
      name,
      nickname: nickname || name,
      role: r,
      category: cat,
      photo_url,
    });
  } catch (error) {
    console.error('Errore POST user:', error);
    res.status(500).json({ error: 'Errore nella creazione utente' });
  }
});

// PUT /api/users/:id - Modifica utente
router.put('/:id', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.id === targetId;

    if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Accesso negato' });

    const existing = await db.get('SELECT * FROM users WHERE id = ?', [targetId]);
    if (!existing) return res.status(404).json({ error: 'Utente non trovato' });

    let photo_url = existing.photo_url;
    if (req.file) photo_url = `/uploads/${req.file.filename}`;

    // Admin può modificare: name, nickname, role, category
    // Player può modificare solo: nickname, photo, availability_confirmed (per sé)
    const updates = [];
    const params = [];

    if (isAdmin) {
      if (req.body.name !== undefined) {
        updates.push('name = ?');
        params.push(req.body.name);
      }
      if (req.body.role !== undefined && ROLES.includes(req.body.role)) {
        updates.push('role = ?');
        params.push(req.body.role);
      }
      if (req.body.category !== undefined) {
        updates.push('category = ?');
        params.push(CATEGORIES.includes(req.body.category) ? req.body.category : null);
      }
    }

    if (req.body.nickname !== undefined) {
      updates.push('nickname = ?');
      params.push(req.body.nickname);
    }

    if (isSelf && req.body.availability_confirmed !== undefined) {
      updates.push('availability_confirmed = ?');
      params.push(req.body.availability_confirmed ? 1 : 0);
    }

    updates.push('photo_url = ?');
    params.push(photo_url);

    params.push(targetId);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await db.get(
      'SELECT u.*, ps.matches_played, ps.wins, ps.losses, ps.win_percentage FROM users u LEFT JOIN player_stats ps ON u.id = ps.user_id WHERE u.id = ?',
      [targetId]
    );
    res.json({ ...updated, availability_confirmed: !!updated.availability_confirmed });
  } catch (error) {
    console.error('Errore PUT user:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento utente' });
  }
});

// DELETE /api/users/:id (solo Admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (req.user.id === targetId) return res.status(400).json({ error: 'Non puoi eliminare te stesso' });

    await db.run('DELETE FROM player_stats WHERE user_id = ?', [targetId]);
    await db.run('DELETE FROM cumulative_rankings WHERE user_id = ?', [targetId]);
    await db.run('DELETE FROM tournament_participants WHERE user_id = ?', [targetId]);
    await db.run('DELETE FROM users WHERE id = ?', [targetId]);

    res.json({ message: 'Utente eliminato' });
  } catch (error) {
    console.error('Errore DELETE user:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione' });
  }
});

export default router;
