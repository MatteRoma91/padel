import express from 'express';
import db from '../models/database.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateWinner } from '../controllers/tournamentController.js';

const router = express.Router();

// GET /api/matches - Lista partite (opzionale tournamentId)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { tournamentId } = req.query;
    let matches = [];
    if (tournamentId) {
      matches = await db.all(
        `SELECT m.*,
          (SELECT u1.name || '-' || u2.name FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.pair1_id) as team1_name,
          (SELECT u1.name || '-' || u2.name FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.pair2_id) as team2_name,
          (SELECT u1.name || '-' || u2.name FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.winner_pair_id) as winner_name
         FROM matches m WHERE m.tournament_id = ? ORDER BY phase, match_type`,
        [tournamentId]
      );
    }
    res.json(matches);
  } catch (error) {
    console.error('Errore GET matches:', error);
    res.status(500).json({ error: 'Errore nel recupero partite' });
  }
});

// PUT /api/matches/:id - Aggiorna punteggio (solo admin in Phase 3)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { team1_score, team2_score } = req.body;
    const match = await db.get('SELECT * FROM matches WHERE id = ?', [req.params.id]);
    if (!match) return res.status(404).json({ error: 'Partita non trovata' });

    if (team1_score && !/^[\d-,\s]+$/.test(team1_score)) return res.status(400).json({ error: 'Formato punteggio non valido' });
    if (team2_score && !/^[\d-,\s]+$/.test(team2_score)) return res.status(400).json({ error: 'Formato punteggio non valido' });

    const winnerPairId = calculateWinner(team1_score, team2_score, match.pair1_id, match.pair2_id);

    await db.run(
      'UPDATE matches SET team1_score = ?, team2_score = ?, winner_pair_id = ? WHERE id = ?',
      [team1_score || null, team2_score || null, winnerPairId, req.params.id]
    );

    if (winnerPairId) {
      const { updateTournamentBracket, updatePlayerStatsFromMatch } = await import('../controllers/tournamentController.js');
      const loserPairId = match.pair1_id === winnerPairId ? match.pair2_id : match.pair1_id;
      await updateTournamentBracket(match.tournament_id, match.phase, match.match_type, winnerPairId, loserPairId);
      await updatePlayerStatsFromMatch(match.pair1_id, match.pair2_id, winnerPairId);
    }

    const updated = await db.get(
      `SELECT m.*,
        (SELECT u1.name || '-' || u2.name FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.pair1_id) as team1_name,
        (SELECT u1.name || '-' || u2.name FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.pair2_id) as team2_name,
        (SELECT u1.name || '-' || u2.name FROM pairs p JOIN users u1 ON p.user1_id=u1.id JOIN users u2 ON p.user2_id=u2.id WHERE p.id=m.winner_pair_id) as winner_name
       FROM matches m WHERE m.id = ?`,
      [req.params.id]
    );
    res.json(updated);
  } catch (error) {
    console.error('Errore PUT match:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento partita' });
  }
});

export default router;
