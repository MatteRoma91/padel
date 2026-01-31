import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../models/database.js';
import { requireAuth } from '../middleware/auth.js';

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

// GET /api/players - Lista giocatori (users con role=player)
router.get('/', requireAuth, async (req, res) => {
  try {
    const players = await db.all(`
      SELECT u.id, u.name, u.nickname, u.category, u.photo_url as avatar_url, u.availability_confirmed,
             COALESCE(ps.matches_played, 0) as matches_played,
             COALESCE(ps.wins, 0) as wins,
             COALESCE(ps.losses, 0) as losses,
             COALESCE(ps.win_percentage, 0) as win_percentage
      FROM users u
      LEFT JOIN player_stats ps ON u.id = ps.user_id
      WHERE u.role = 'player'
      ORDER BY u.name
    `);
    res.json(players);
  } catch (error) {
    console.error('Errore GET players:', error);
    res.status(500).json({ error: 'Errore nel recupero giocatori' });
  }
});

// GET /api/players/:id - Dettaglio giocatore
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const player = await db.get(
      `SELECT u.id, u.name, u.nickname, u.category, u.photo_url, u.availability_confirmed
       FROM users u WHERE u.id = ? AND u.role = 'player'`,
      [req.params.id]
    );
    if (!player) return res.status(404).json({ error: 'Giocatore non trovato' });

    const stats = await db.get('SELECT * FROM player_stats WHERE user_id = ?', [req.params.id]);

    // recentMatches: partite del giocatore (via pairs)
    let recentMatches = [];
    try {
      const rows = await db.all(
        `SELECT m.*, p1.id as p1id, p2.id as p2id FROM matches m
         JOIN pairs p1 ON m.pair1_id = p1.id JOIN pairs p2 ON m.pair2_id = p2.id
         WHERE (p1.user1_id = ? OR p1.user2_id = ? OR p2.user1_id = ? OR p2.user2_id = ?) AND m.winner_pair_id IS NOT NULL
         ORDER BY m.match_date DESC, m.created_at DESC LIMIT 10`,
        [req.params.id, req.params.id, req.params.id, req.params.id]
      );
      for (const m of rows) {
        const p1 = await db.get('SELECT u1.name n1, u2.name n2 FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=?', [m.pair1_id]);
        const p2 = await db.get('SELECT u1.name n1, u2.name n2 FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=?', [m.pair2_id]);
        const team1_name = p1 ? `${p1.n1}-${p1.n2}` : '-';
        const team2_name = p2 ? `${p2.n1}-${p2.n2}` : '-';
        const inP1 = await db.get('SELECT 1 FROM pairs WHERE id=? AND (user1_id=? OR user2_id=?)', [m.pair1_id, req.params.id, req.params.id]);
        const myPairId = inP1 ? m.pair1_id : m.pair2_id;
        recentMatches.push({ ...m, team1_name, team2_name, result: m.winner_pair_id === myPairId ? 'win' : 'loss' });
      }
    } catch (_) {}

    res.json({
      ...player,
      avatar_url: player.photo_url,
      stats: stats || { matches_played: 0, wins: 0, losses: 0, win_percentage: 0 },
      recentMatches,
    });
  } catch (error) {
    console.error('Errore GET player:', error);
    res.status(500).json({ error: 'Errore nel recupero giocatore' });
  }
});

// POST /api/players - Aggiungi giocatore (solo admin, delegato a users)
// Manteniamo per compatibilità AdminPanel - la logica è in users.js
router.post('/', requireAuth, upload.single('avatar'), async (req, res) => {
  res.status(501).json({ error: 'Usa /api/users per creare utenti' });
});

// PUT /api/players/:id - Modifica giocatore (delegato a users)
router.put('/:id', requireAuth, upload.single('avatar'), async (req, res) => {
  res.status(501).json({ error: 'Usa /api/users/:id per modificare' });
});

// DELETE /api/players/:id
router.delete('/:id', requireAuth, async (req, res) => {
  res.status(501).json({ error: 'Usa /api/users/:id per eliminare' });
});

export default router;
