import express from 'express';
import db from '../models/database.js';
import { createTournamentBracket } from '../controllers/tournamentController.js';

const router = express.Router();

// GET /api/tournament/bracket - Recupera tabellone completo
router.get('/bracket', async (req, res) => {
  try {
    const matches = await db.all(`
      SELECT m.*,
             t1.name as team1_name,
             t1.player1_id as team1_player1_id,
             t1.player2_id as team1_player2_id,
             p1_1.name as team1_player1_name,
             p1_2.name as team1_player2_name,
             t2.name as team2_name,
             t2.player1_id as team2_player1_id,
             t2.player2_id as team2_player2_id,
             p2_1.name as team2_player1_name,
             p2_2.name as team2_player2_name,
             w.name as winner_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams w ON m.winner_id = w.id
      LEFT JOIN players p1_1 ON t1.player1_id = p1_1.id
      LEFT JOIN players p1_2 ON t1.player2_id = p1_2.id
      LEFT JOIN players p2_1 ON t2.player1_id = p2_1.id
      LEFT JOIN players p2_2 ON t2.player2_id = p2_2.id
      ORDER BY 
        CASE m.phase
          WHEN 'quarters' THEN 1
          WHEN 'semifinals' THEN 2
          WHEN 'finals' THEN 3
        END,
        m.match_type
    `);

    // Organizza per fase
    const bracket = {
      quarters: matches.filter(m => m.phase === 'quarters'),
      semifinals: matches.filter(m => m.phase === 'semifinals'),
      finals: matches.filter(m => m.phase === 'finals')
    };

    res.json(bracket);
  } catch (error) {
    console.error('Errore nel recupero tabellone:', error);
    res.status(500).json({ error: 'Errore nel recupero tabellone' });
  }
});

// POST /api/tournament/reset - Reset torneo
router.post('/reset', async (req, res) => {
  try {
    // Elimina tutte le partite
    await db.run('DELETE FROM matches');
    
    // Reset statistiche giocatori
    await db.run(`
      UPDATE player_stats 
      SET total_score = 0,
          matches_played = 0,
          wins = 0,
          losses = 0,
          win_percentage = 0
    `);

    // Ricrea tabellone
    await createTournamentBracket();

    res.json({ message: 'Torneo resettato con successo' });
  } catch (error) {
    console.error('Errore nel reset torneo:', error);
    res.status(500).json({ error: 'Errore nel reset torneo' });
  }
});

// GET /api/tournament/teams - Lista squadre
router.get('/teams', async (req, res) => {
  try {
    const teams = await db.all(`
      SELECT t.*,
             p1.name as player1_name,
             p1.avatar_url as player1_avatar,
             p2.name as player2_name,
             p2.avatar_url as player2_avatar
      FROM teams t
      LEFT JOIN players p1 ON t.player1_id = p1.id
      LEFT JOIN players p2 ON t.player2_id = p2.id
      ORDER BY t.name
    `);
    res.json(teams);
  } catch (error) {
    console.error('Errore nel recupero squadre:', error);
    res.status(500).json({ error: 'Errore nel recupero squadre' });
  }
});

export default router;
