import express from 'express';
import db from '../models/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper: recupera match con nomi coppie
async function getMatchesWithNames(tournamentId) {
  const matches = await db.all(
    `SELECT m.*,
      (SELECT COALESCE(u1.nickname,u1.name) || '-' || COALESCE(u2.nickname,u2.name) FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.pair1_id) as team1_name,
      (SELECT COALESCE(u1.nickname,u1.name) || '-' || COALESCE(u2.nickname,u2.name) FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.pair2_id) as team2_name,
      (SELECT COALESCE(u1.nickname,u1.name) || '-' || COALESCE(u2.nickname,u2.name) FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.winner_pair_id) as winner_name
     FROM matches m WHERE m.tournament_id = ? ORDER BY
       CASE m.phase WHEN 'quarters' THEN 1 WHEN 'semifinals' THEN 2 WHEN 'finals' THEN 3 END,
       m.match_type`,
    [tournamentId]
  );
  // Alias per compatibilità frontend: team1_id/team2_id/winner_id
  return matches.map((m) => ({
    ...m,
    team1_id: m.pair1_id,
    team2_id: m.pair2_id,
    winner_id: m.winner_pair_id,
    team1_name: m.team1_name || '-',
    team2_name: m.team2_name || '-',
    winner_name: m.winner_name || null,
  }));
}

// GET /api/tournament/bracket - Tabellone primo torneo attivo o ultimo
router.get('/bracket', requireAuth, async (req, res) => {
  try {
    const t = await db.get(
      'SELECT id FROM tournaments WHERE status IN ("active","draft","completed") ORDER BY date DESC, id DESC LIMIT 1'
    );
    if (!t) return res.json({ quarters: [], semifinals: [], finals: [] });

    const matches = await getMatchesWithNames(t.id);
    res.json({
      quarters: matches.filter((m) => m.phase === 'quarters'),
      semifinals: matches.filter((m) => m.phase === 'semifinals'),
      finals: matches.filter((m) => m.phase === 'finals'),
    });
  } catch (error) {
    console.error('Errore GET bracket:', error);
    res.status(500).json({ error: 'Errore nel recupero tabellone' });
  }
});

// GET /api/tournament/teams - Coppie del torneo corrente (come "teams")
router.get('/teams', requireAuth, async (req, res) => {
  try {
    const t = await db.get(
      'SELECT id FROM tournaments WHERE status IN ("active","draft","completed") ORDER BY date DESC LIMIT 1'
    );
    if (!t) return res.json([]);

    const pairs = await db.all(
      `SELECT p.id, p.tournament_id, p.user1_id, p.user2_id,
        u1.name as player1_name, u1.nickname as p1_nick, u1.photo_url as player1_avatar,
        u2.name as player2_name, u2.nickname as p2_nick, u2.photo_url as player2_avatar
       FROM pairs p
       JOIN users u1 ON p.user1_id = u1.id JOIN users u2 ON p.user2_id = u2.id
       WHERE p.tournament_id = ? ORDER BY p.id`,
      [t.id]
    );
    res.json(
      pairs.map((row) => ({
        id: row.id,
        name: (row.p1_nick || row.player1_name) + '-' + (row.p2_nick || row.player2_name),
        player1_id: row.user1_id,
        player2_id: row.user2_id,
        player1_name: row.player1_name,
        player2_name: row.player2_name,
        player1_avatar: row.player1_avatar,
        player2_avatar: row.player2_avatar,
      }))
    );
  } catch (error) {
    console.error('Errore GET teams:', error);
    res.status(500).json({ error: 'Errore nel recupero squadre' });
  }
});

// POST /api/tournament/reset - Reset torneo corrente (solo admin, Phase 3)
router.post('/reset', requireAuth, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  try {
    const t = await db.get('SELECT id FROM tournaments ORDER BY date DESC LIMIT 1');
    if (!t) return res.json({ message: 'Nessun torneo da resettare' });
    await db.run('DELETE FROM matches WHERE tournament_id = ?', [t.id]);
    res.json({ message: 'Partite eliminate. Ricrea coppie e tabellone.' });
  } catch (error) {
    console.error('Errore reset:', error);
    res.status(500).json({ error: 'Errore nel reset' });
  }
});

export default router;
