import express from 'express';
import db from '../models/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generatePairs } from '../controllers/pairsController.js';

const router = express.Router();

// GET /api/tournaments - Elenco tornei (filtro ?status=active|draft|completed&future=1)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, future } = req.query;
    let sql = 'SELECT * FROM tournaments WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (future === '1') {
      sql += ' AND date >= date("now")';
    } else if (future === '0') {
      sql += ' AND date < date("now")';
    }

    sql += ' ORDER BY date DESC, id DESC';
    const tournaments = await db.all(sql, params);
    res.json(tournaments);
  } catch (error) {
    console.error('Errore GET tournaments:', error);
    res.status(500).json({ error: 'Errore nel recupero tornei' });
  }
});

// GET /api/tournaments/archive - Archivio tornei passati con filtri
router.get('/archive', requireAuth, async (req, res) => {
  try {
    const { year, month, name } = req.query;
    let sql = 'SELECT * FROM tournaments WHERE date < date("now")';
    const params = [];

    if (year) {
      sql += ' AND strftime("%Y", date) = ?';
      params.push(String(year));
    }
    if (month) {
      sql += ' AND strftime("%m", date) = ?';
      params.push(String(month).padStart(2, '0'));
    }
    if (name) {
      sql += ' AND name LIKE ?';
      params.push('%' + name + '%');
    }

    sql += ' ORDER BY date DESC';
    const tournaments = await db.all(sql, params);
    res.json(tournaments);
  } catch (error) {
    console.error('Errore GET archive:', error);
    res.status(500).json({ error: 'Errore archivio' });
  }
});

// GET /api/tournaments/:id/participants - Partecipanti
router.get('/:id/participants', requireAuth, async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT u.id, u.name, u.nickname, u.category FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id WHERE tp.tournament_id = ? ORDER BY u.name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Errore GET participants:', error);
    res.status(500).json({ error: 'Errore partecipanti' });
  }
});

// PUT /api/tournaments/:id/participants - Imposta partecipanti (solo Admin)
router.put('/:id/participants', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids)) return res.status(400).json({ error: 'user_ids array richiesto' });
    await db.run('DELETE FROM tournament_participants WHERE tournament_id = ?', [req.params.id]);
    for (const uid of user_ids) {
      await db.run('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)', [
        req.params.id,
        uid,
      ]);
    }
    res.json({ message: 'Partecipanti aggiornati' });
  } catch (error) {
    console.error('Errore PUT participants:', error);
    res.status(500).json({ error: 'Errore aggiornamento partecipanti' });
  }
});

// GET /api/tournaments/:id/pairs - Elenco coppie
router.get('/:id/pairs', requireAuth, async (req, res) => {
  try {
    const pairs = await db.all(
      `SELECT p.id, p.tournament_id, p.user1_id, p.user2_id,
        u1.name as user1_name, u1.nickname as user1_nickname, u1.category as user1_category,
        u2.name as user2_name, u2.nickname as user2_nickname, u2.category as user2_category
       FROM pairs p
       JOIN users u1 ON p.user1_id = u1.id
       JOIN users u2 ON p.user2_id = u2.id
       WHERE p.tournament_id = ? ORDER BY p.id`,
      [req.params.id]
    );
    res.json(
      pairs.map((row) => ({
        id: row.id,
        tournament_id: row.tournament_id,
        user1_id: row.user1_id,
        user2_id: row.user2_id,
        user1_name: row.user1_nickname || row.user1_name,
        user2_name: row.user2_nickname || row.user2_name,
        user1_category: row.user1_category,
        user2_category: row.user2_category,
      }))
    );
  } catch (error) {
    console.error('Errore GET pairs:', error);
    res.status(500).json({ error: 'Errore coppie' });
  }
});

// POST /api/tournaments/:id/pairs/generate - Genera coppie (forte+debole)
router.post('/:id/pairs/generate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const t = await db.get('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
    if (!t) return res.status(404).json({ error: 'Torneo non trovato' });

    await generatePairs(tournamentId);
    const pairs = await db.all(
      `SELECT p.id, p.user1_id, p.user2_id, u1.name as n1, u1.nickname as nick1, u2.name as n2, u2.nickname as nick2
       FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id
       WHERE p.tournament_id = ?`,
      [tournamentId]
    );
    res.json({ message: 'Coppie generate', pairs });
  } catch (error) {
    console.error('Errore generate pairs:', error);
    res.status(500).json({ error: error.message || 'Errore generazione coppie' });
  }
});

// POST /api/tournaments/:id/pairs/regenerate - Rigenera coppie
router.post('/:id/pairs/regenerate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    await db.run('DELETE FROM pairs WHERE tournament_id = ?', [tournamentId]);
    await generatePairs(tournamentId);
    const pairs = await db.all(
      `SELECT p.id, p.user1_id, p.user2_id, u1.name as n1, u1.nickname as nick1, u2.name as n2, u2.nickname as nick2
       FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id
       WHERE p.tournament_id = ?`,
      [tournamentId]
    );
    res.json({ message: 'Coppie rigenerate', pairs });
  } catch (error) {
    console.error('Errore regenerate pairs:', error);
    res.status(500).json({ error: error.message || 'Errore rigenerazione' });
  }
});

// PUT /api/tournaments/:id/pairs/:pairId - Modifica singola coppia
router.put('/:id/pairs/:pairId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user1_id, user2_id } = req.body;
    if (!user1_id || !user2_id) return res.status(400).json({ error: 'user1_id e user2_id richiesti' });
    const pair = await db.get('SELECT * FROM pairs WHERE id = ? AND tournament_id = ?', [
      req.params.pairId,
      req.params.id,
    ]);
    if (!pair) return res.status(404).json({ error: 'Coppia non trovata' });
    await db.run('UPDATE pairs SET user1_id = ?, user2_id = ? WHERE id = ?', [
      user1_id,
      user2_id,
      req.params.pairId,
    ]);
    const updated = await db.get(
      'SELECT p.*, u1.name as n1, u2.name as n2 FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id = ?',
      [req.params.pairId]
    );
    res.json(updated);
  } catch (error) {
    console.error('Errore PUT pair:', error);
    res.status(500).json({ error: 'Errore modifica coppia' });
  }
});

// GET /api/tournaments/:id/bracket - Tabellone torneo
router.get('/:id/bracket', requireAuth, async (req, res) => {
  try {
    const matches = await db.all(
      `SELECT m.*,
        (SELECT COALESCE(u1.nickname,u1.name) || '-' || COALESCE(u2.nickname,u2.name) FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.pair1_id) as team1_name,
        (SELECT COALESCE(u1.nickname,u1.name) || '-' || COALESCE(u2.nickname,u2.name) FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.pair2_id) as team2_name,
        (SELECT COALESCE(u1.nickname,u1.name) || '-' || COALESCE(u2.nickname,u2.name) FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.winner_pair_id) as winner_name
       FROM matches m WHERE m.tournament_id = ? ORDER BY CASE m.phase WHEN 'quarters' THEN 1 WHEN 'semifinals' THEN 2 WHEN 'finals' THEN 3 END, m.match_type`,
      [req.params.id]
    );
    const result = matches.map((m) => ({
      ...m,
      team1_id: m.pair1_id,
      team2_id: m.pair2_id,
      winner_id: m.winner_pair_id,
    }));
    res.json({ quarters: result.filter((m) => m.phase === 'quarters'), semifinals: result.filter((m) => m.phase === 'semifinals'), finals: result.filter((m) => m.phase === 'finals') });
  } catch (error) {
    console.error('Errore GET bracket:', error);
    res.status(500).json({ error: 'Errore tabellone' });
  }
});

// GET /api/tournaments/:id/rankings - Classifica torneo 1-8
router.get('/:id/rankings', requireAuth, async (req, res) => {
  try {
    let rankings = await db.all(
      'SELECT tr.*, u.name, u.nickname FROM tournament_rankings tr JOIN users u ON tr.user_id = u.id WHERE tr.tournament_id = ? ORDER BY tr.position',
      [req.params.id]
    );
    if (rankings.length === 0) {
      rankings = [];
    }
    res.json(rankings);
  } catch (error) {
    console.error('Errore GET rankings:', error);
    res.status(500).json({ error: 'Errore classifica' });
  }
});

// GET /api/tournaments/:id - Dettaglio torneo
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const t = await db.get('SELECT * FROM tournaments WHERE id = ?', [req.params.id]);
    if (!t) return res.status(404).json({ error: 'Torneo non trovato' });
    res.json(t);
  } catch (error) {
    console.error('Errore GET tournament:', error);
    res.status(500).json({ error: 'Errore nel recupero torneo' });
  }
});

// POST /api/tournaments - Crea torneo (solo Admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, date, time, field, status } = req.body;
    if (!name || !date) return res.status(400).json({ error: 'Nome e data obbligatori' });
    const result = await db.run(
      'INSERT INTO tournaments (name, date, time, field, status) VALUES (?, ?, ?, ?, ?)',
      [name, date, time || null, field || null, status || 'draft']
    );
    res.status(201).json({ id: result.lastID, name, date, time, field, status: status || 'draft' });
  } catch (error) {
    console.error('Errore POST tournament:', error);
    res.status(500).json({ error: 'Errore nella creazione torneo' });
  }
});

// PUT /api/tournaments/:id - Modifica torneo (solo Admin)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, date, time, field, status } = req.body;
    const existing = await db.get('SELECT * FROM tournaments WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Torneo non trovato' });

    await db.run(
      'UPDATE tournaments SET name = ?, date = ?, time = ?, field = ?, status = ? WHERE id = ?',
      [name ?? existing.name, date ?? existing.date, time ?? existing.time, field ?? existing.field, status ?? existing.status, req.params.id]
    );
    const updated = await db.get('SELECT * FROM tournaments WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Errore PUT tournament:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento torneo' });
  }
});

export default router;
