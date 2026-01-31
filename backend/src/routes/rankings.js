import express from 'express';
import db from '../models/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/rankings/cumulative - Classifica cumulativa Banana Padel Tour
router.get('/cumulative', requireAuth, async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT cr.user_id, cr.total_points, cr.last_updated,
              u.name, u.nickname, u.category
       FROM cumulative_rankings cr
       JOIN users u ON cr.user_id = u.id
       WHERE u.role = 'player'
       ORDER BY cr.total_points DESC`
    );
    res.json(rows.map((r, i) => ({ ...r, position: i + 1 })));
  } catch (error) {
    console.error('Errore GET cumulative:', error);
    res.status(500).json({ error: 'Errore classifica cumulativa' });
  }
});

// PUT /api/rankings/cumulative - Admin override punti
router.put('/cumulative', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_id, total_points } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id richiesto' });
    const existing = await db.get('SELECT id FROM cumulative_rankings WHERE user_id = ?', [user_id]);
    if (existing) {
      await db.run('UPDATE cumulative_rankings SET total_points = ?, last_updated = datetime("now") WHERE user_id = ?', [
        total_points ?? 0,
        user_id,
      ]);
    } else {
      await db.run('INSERT INTO cumulative_rankings (user_id, total_points) VALUES (?, ?)', [
        user_id,
        total_points ?? 0,
      ]);
    }
    const updated = await db.get(
      'SELECT * FROM cumulative_rankings WHERE user_id = ?',
      [user_id]
    );
    res.json(updated);
  } catch (error) {
    console.error('Errore PUT cumulative:', error);
    res.status(500).json({ error: 'Errore aggiornamento' });
  }
});

// GET /api/rankings/tournament/:id - Classifica singolo torneo
router.get('/tournament/:id', requireAuth, async (req, res) => {
  try {
    let rows = await db.all(
      `SELECT tr.*, u.name, u.nickname FROM tournament_rankings tr
       JOIN users u ON tr.user_id = u.id
       WHERE tr.tournament_id = ? ORDER BY tr.position`,
      [req.params.id]
    );
    if (rows.length === 0) {
      rows = [];
    }
    res.json(rows);
  } catch (error) {
    console.error('Errore GET tournament rankings:', error);
    res.status(500).json({ error: 'Errore classifica torneo' });
  }
});

export default router;
