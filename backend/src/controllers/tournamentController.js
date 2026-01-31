import db from '../models/database.js';

/**
 * Calcola il vincitore di una partita basandosi sui punteggi
 * @param {string} team1Score - Punteggio team 1 (es. "6-4, 6-3")
 * @param {string} team2Score - Punteggio team 2 (es. "4-6, 3-6")
 * @param {number} team1Id - ID team 1
 * @param {number} team2Id - ID team 2
 * @returns {number|null} - ID del team vincitore o null se non determinabile
 */
export function calculateWinner(team1Score, team2Score, team1Id, team2Id) {
  if (!team1Score || !team2Score) {
    return null;
  }

  // Parse punteggi (formato: "6-4, 6-3")
  // team1Score = "6-4, 6-3" significa: set1 team1=6 team2=4, set2 team1=6 team2=3
  // team2Score = "4-6, 3-6" significa: set1 team1=4 team2=6, set2 team1=3 team2=6
  // Quindi ogni set ha due punteggi: quello di team1 e quello di team2
  const parseScore = (score) => {
    return score.split(',').map(set => {
      const parts = set.trim().split('-');
      return {
        team1: parseInt(parts[0]) || 0,
        team2: parseInt(parts[1]) || 0
      };
    });
  };

  try {
    const sets1 = parseScore(team1Score);
    const sets2 = parseScore(team2Score);

    let team1Sets = 0;
    let team2Sets = 0;

    // Conta set vinti: per ogni set, confronta i punteggi
    // Se team1 ha più punti di team2 in quel set, team1 vince il set
    const maxSets = Math.max(sets1.length, sets2.length);
    for (let i = 0; i < maxSets; i++) {
      const set1 = sets1[i] || { team1: 0, team2: 0 };
      const set2 = sets2[i] || { team1: 0, team2: 0 };

      // Usa i punteggi di set1 (che contiene i punteggi corretti per entrambe le squadre)
      // set1.team1 = punti team1, set1.team2 = punti team2
      if (set1.team1 > set1.team2) {
        team1Sets++;
      } else if (set1.team2 > set1.team1) {
        team2Sets++;
      }
    }

    // Vincitore è chi ha vinto più set
    if (team1Sets > team2Sets) {
      return team1Id;
    } else if (team2Sets > team1Sets) {
      return team2Id;
    }

    return null; // Pareggio (non dovrebbe accadere nel padel)
  } catch (error) {
    console.error('Errore nel calcolo vincitore:', error);
    return null;
  }
}

/**
 * Aggiorna il tabellone torneo popolando le fasi successive (nuovo schema con pairs)
 */
export async function updateTournamentBracket(tournamentId, phase, matchType, winnerPairId, loserPairId) {
  try {
    if (phase === 'quarters') {
      await populateSemifinalsNew(tournamentId, matchType, winnerPairId, loserPairId);
    } else if (phase === 'semifinals') {
      await populateFinalsNew(tournamentId, matchType, winnerPairId, loserPairId);
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento tabellone:', error);
  }
}

async function populateSemifinalsNew(tournamentId, quarterType, winnerPairId, loserPairId) {
  const quarterToSemifinal = { Q1: { winner: 'A1', team1: true }, Q2: { winner: 'A1', team1: false }, Q3: { winner: 'A2', team1: true }, Q4: { winner: 'A2', team1: false } };
  const semifinalLoser = { Q1: { loser: 'B1', team1: true }, Q2: { loser: 'B1', team1: false }, Q3: { loser: 'B2', team1: true }, Q4: { loser: 'B2', team1: false } };
  const semiInfo = quarterToSemifinal[quarterType];
  const loserInfo = semifinalLoser[quarterType];
  if (semiInfo) {
    const semiMatch = await db.get('SELECT * FROM matches WHERE tournament_id = ? AND phase = ? AND match_type = ?', [tournamentId, 'semifinals', semiInfo.winner]);
    if (semiMatch) {
      await db.run(semiInfo.team1 ? 'UPDATE matches SET pair1_id = ? WHERE id = ?' : 'UPDATE matches SET pair2_id = ? WHERE id = ?', [winnerPairId, semiMatch.id]);
    }
  }
  if (loserInfo) {
    const loserMatch = await db.get('SELECT * FROM matches WHERE tournament_id = ? AND phase = ? AND match_type = ?', [tournamentId, 'semifinals', loserInfo.loser]);
    if (loserMatch) {
      await db.run(loserInfo.team1 ? 'UPDATE matches SET pair1_id = ? WHERE id = ?' : 'UPDATE matches SET pair2_id = ? WHERE id = ?', [loserPairId, loserMatch.id]);
    }
  }
}

async function populateFinalsNew(tournamentId, semifinalType, winnerPairId, loserPairId) {
  const semifinalToFinal = { A1: { winner: 'final_1_2', team1: true }, A2: { winner: 'final_1_2', team1: false }, B1: { winner: 'final_5_6', team1: true }, B2: { winner: 'final_5_6', team1: false } };
  const finalLoser = { A1: { loser: 'final_3_4', team1: true }, A2: { loser: 'final_3_4', team1: false }, B1: { loser: 'final_7_8', team1: true }, B2: { loser: 'final_7_8', team1: false } };
  const finalInfo = semifinalToFinal[semifinalType];
  const loserInfo = finalLoser[semifinalType];
  if (finalInfo) {
    const finalMatch = await db.get('SELECT * FROM matches WHERE tournament_id = ? AND phase = ? AND match_type = ?', [tournamentId, 'finals', finalInfo.winner]);
    if (finalMatch) await db.run(finalInfo.team1 ? 'UPDATE matches SET pair1_id = ? WHERE id = ?' : 'UPDATE matches SET pair2_id = ? WHERE id = ?', [winnerPairId, finalMatch.id]);
  }
  if (loserInfo) {
    const loserMatch = await db.get('SELECT * FROM matches WHERE tournament_id = ? AND phase = ? AND match_type = ?', [tournamentId, 'finals', loserInfo.loser]);
    if (loserMatch) await db.run(loserInfo.team1 ? 'UPDATE matches SET pair1_id = ? WHERE id = ?' : 'UPDATE matches SET pair2_id = ? WHERE id = ?', [loserPairId, loserMatch.id]);
  }
}

/**
 * Aggiorna statistiche giocatori dopo una partita (usa pairs -> user_id)
 */
export async function updatePlayerStatsFromMatch(pair1Id, pair2Id, winnerPairId) {
  try {
    const p1 = await db.get('SELECT user1_id, user2_id FROM pairs WHERE id = ?', [pair1Id]);
    const p2 = await db.get('SELECT user1_id, user2_id FROM pairs WHERE id = ?', [pair2Id]);
    if (!p1 || !p2) return;
    const winnerIds = winnerPairId === pair1Id ? [p1.user1_id, p1.user2_id] : [p2.user1_id, p2.user2_id];
    const loserIds = winnerPairId === pair1Id ? [p2.user1_id, p2.user2_id] : [p1.user1_id, p1.user2_id];
    for (const uid of winnerIds) {
      await db.run(`UPDATE player_stats SET matches_played = matches_played + 1, wins = wins + 1, win_percentage = CAST(wins + 1 AS REAL) / CAST(matches_played + 1 AS REAL) * 100 WHERE user_id = ?`, [uid]);
    }
    for (const uid of loserIds) {
      await db.run(`UPDATE player_stats SET matches_played = matches_played + 1, losses = losses + 1, win_percentage = CAST(wins AS REAL) / CAST(matches_played + 1 AS REAL) * 100 WHERE user_id = ?`, [uid]);
    }
  } catch (error) {
    console.error('Errore update stats:', error);
  }
}

