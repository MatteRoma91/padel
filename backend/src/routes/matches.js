import express from 'express';
import db from '../models/database.js';
import { updateTournamentBracket, calculateWinner } from '../controllers/tournamentController.js';

const router = express.Router();

// GET /api/matches - Lista tutte le partite
router.get('/', async (req, res) => {
  try {
    const matches = await db.all(`
      SELECT m.*,
             t1.name as team1_name,
             t1.player1_id as team1_player1_id,
             t1.player2_id as team1_player2_id,
             t2.name as team2_name,
             t2.player1_id as team2_player1_id,
             t2.player2_id as team2_player2_id,
             w.name as winner_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams w ON m.winner_id = w.id
      ORDER BY 
        CASE m.phase
          WHEN 'quarters' THEN 1
          WHEN 'semifinals' THEN 2
          WHEN 'finals' THEN 3
        END,
        m.match_type
    `);
    res.json(matches);
  } catch (error) {
    console.error('Errore nel recupero partite:', error);
    res.status(500).json({ error: 'Errore nel recupero partite' });
  }
});

// PUT /api/matches/:id - Aggiorna punteggio partita
router.put('/:id', async (req, res) => {
  try {
    const { team1_score, team2_score } = req.body;
    
    const match = await db.get('SELECT * FROM matches WHERE id = ?', [req.params.id]);
    if (!match) {
      return res.status(404).json({ error: 'Partita non trovata' });
    }

    // Valida formato punteggio (es. "6-4" o "6-4, 6-3")
    if (team1_score && !/^[\d-,\s]+$/.test(team1_score)) {
      return res.status(400).json({ error: 'Formato punteggio non valido per team1' });
    }
    if (team2_score && !/^[\d-,\s]+$/.test(team2_score)) {
      return res.status(400).json({ error: 'Formato punteggio non valido per team2' });
    }

    // Calcola vincitore
    const winnerId = calculateWinner(team1_score, team2_score, match.team1_id, match.team2_id);

    // Aggiorna partita
    await db.run(
      'UPDATE matches SET team1_score = ?, team2_score = ?, winner_id = ? WHERE id = ?',
      [team1_score || null, team2_score || null, winnerId, req.params.id]
    );

    // Aggiorna tabellone torneo (popola fasi successive)
    if (winnerId) {
      await updateTournamentBracket(match.phase, match.match_type, winnerId, match.team1_id === winnerId ? match.team2_id : match.team1_id);
      
      // Aggiorna statistiche giocatori
      await updatePlayerStats(match.team1_id, match.team2_id, winnerId);
    }

    const updated = await db.get(`
      SELECT m.*,
             t1.name as team1_name,
             t2.name as team2_name,
             w.name as winner_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams w ON m.winner_id = w.id
      WHERE m.id = ?
    `, [req.params.id]);

    res.json(updated);
  } catch (error) {
    console.error('Errore nell\'aggiornamento partita:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento partita' });
  }
});

/**
 * Aggiorna le statistiche dei giocatori dopo una partita
 */
async function updatePlayerStats(team1Id, team2Id, winnerId) {
  try {
    // Recupera i giocatori delle squadre
    const team1 = await db.get('SELECT player1_id, player2_id FROM teams WHERE id = ?', [team1Id]);
    const team2 = await db.get('SELECT player1_id, player2_id FROM teams WHERE id = ?', [team2Id]);

    const team1Players = [team1.player1_id, team1.player2_id];
    const team2Players = [team2.player1_id, team2.player2_id];
    const winnerPlayers = winnerId === team1Id ? team1Players : team2Players;
    const loserPlayers = winnerId === team1Id ? team2Players : team1Players;

    // Aggiorna statistiche vincitori
    for (const playerId of winnerPlayers) {
      await db.run(`
        UPDATE player_stats 
        SET matches_played = matches_played + 1,
            wins = wins + 1,
            win_percentage = CAST(wins + 1 AS REAL) / CAST(matches_played + 1 AS REAL) * 100
        WHERE player_id = ?
      `, [playerId]);
    }

    // Aggiorna statistiche perdenti
    for (const playerId of loserPlayers) {
      await db.run(`
        UPDATE player_stats 
        SET matches_played = matches_played + 1,
            losses = losses + 1,
            win_percentage = CAST(wins AS REAL) / CAST(matches_played + 1 AS REAL) * 100
        WHERE player_id = ?
      `, [playerId]);
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento statistiche:', error);
  }
}

export default router;
