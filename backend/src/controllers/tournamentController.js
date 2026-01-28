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
 * Aggiorna il tabellone torneo popolando le fasi successive
 */
export async function updateTournamentBracket(phase, matchType, winnerId, loserId) {
  try {
    if (phase === 'quarters') {
      // Quarti → Semifinali
      await populateSemifinals(matchType, winnerId, loserId);
    } else if (phase === 'semifinals') {
      // Semifinali → Finali
      await populateFinals(matchType, winnerId, loserId);
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento tabellone:', error);
  }
}

/**
 * Popola le semifinali basandosi sui risultati dei quarti
 */
async function populateSemifinals(quarterType, winnerId, loserId) {
  try {
    // Mappa quarti → semifinali
    const quarterToSemifinal = {
      'Q1': { winner: 'A1', team1: true },
      'Q2': { winner: 'A1', team1: false },
      'Q3': { winner: 'A2', team1: true },
      'Q4': { winner: 'A2', team1: false },
    };

    const semifinalLoser = {
      'Q1': { loser: 'B1', team1: true },
      'Q2': { loser: 'B1', team1: false },
      'Q3': { loser: 'B2', team1: true },
      'Q4': { loser: 'B2', team1: false },
    };

    const semiInfo = quarterToSemifinal[quarterType];
    const loserInfo = semifinalLoser[quarterType];

    if (semiInfo) {
      // Aggiorna semifinale principale (1°-4°)
      const semiMatch = await db.get(
        'SELECT * FROM matches WHERE phase = ? AND match_type = ?',
        ['semifinals', semiInfo.winner]
      );

      if (semiMatch) {
        if (semiInfo.team1) {
          await db.run(
            'UPDATE matches SET team1_id = ? WHERE id = ?',
            [winnerId, semiMatch.id]
          );
        } else {
          await db.run(
            'UPDATE matches SET team2_id = ? WHERE id = ?',
            [winnerId, semiMatch.id]
          );
        }
      }
    }

    if (loserInfo) {
      // Aggiorna semifinale consolazione (5°-8°)
      const loserMatch = await db.get(
        'SELECT * FROM matches WHERE phase = ? AND match_type = ?',
        ['semifinals', loserInfo.loser]
      );

      if (loserMatch) {
        if (loserInfo.team1) {
          await db.run(
            'UPDATE matches SET team1_id = ? WHERE id = ?',
            [loserId, loserMatch.id]
          );
        } else {
          await db.run(
            'UPDATE matches SET team2_id = ? WHERE id = ?',
            [loserId, loserMatch.id]
          );
        }
      }
    }
  } catch (error) {
    console.error('Errore nel popolamento semifinali:', error);
  }
}

/**
 * Popola le finali basandosi sui risultati delle semifinali
 */
async function populateFinals(semifinalType, winnerId, loserId) {
  try {
    // Mappa semifinali → finali
    const semifinalToFinal = {
      'A1': { winner: 'final_1_2', team1: true },
      'A2': { winner: 'final_1_2', team1: false },
      'B1': { winner: 'final_5_6', team1: true },
      'B2': { winner: 'final_5_6', team1: false },
    };

    const finalLoser = {
      'A1': { loser: 'final_3_4', team1: true },
      'A2': { loser: 'final_3_4', team1: false },
      'B1': { loser: 'final_7_8', team1: true },
      'B2': { loser: 'final_7_8', team1: false },
    };

    const finalInfo = semifinalToFinal[semifinalType];
    const loserInfo = finalLoser[semifinalType];

    if (finalInfo) {
      // Aggiorna finale principale
      const finalMatch = await db.get(
        'SELECT * FROM matches WHERE phase = ? AND match_type = ?',
        ['finals', finalInfo.winner]
      );

      if (finalMatch) {
        if (finalInfo.team1) {
          await db.run(
            'UPDATE matches SET team1_id = ? WHERE id = ?',
            [winnerId, finalMatch.id]
          );
        } else {
          await db.run(
            'UPDATE matches SET team2_id = ? WHERE id = ?',
            [winnerId, finalMatch.id]
          );
        }
      }
    }

    if (loserInfo) {
      // Aggiorna finale consolazione
      const loserMatch = await db.get(
        'SELECT * FROM matches WHERE phase = ? AND match_type = ?',
        ['finals', loserInfo.loser]
      );

      if (loserMatch) {
        if (loserInfo.team1) {
          await db.run(
            'UPDATE matches SET team1_id = ? WHERE id = ?',
            [loserId, loserMatch.id]
          );
        } else {
          await db.run(
            'UPDATE matches SET team2_id = ? WHERE id = ?',
            [loserId, loserMatch.id]
          );
        }
      }
    }
  } catch (error) {
    console.error('Errore nel popolamento finali:', error);
  }
}

/**
 * Crea la struttura iniziale del torneo
 */
export async function createTournamentBracket() {
  try {
    // Verifica se il torneo esiste già
    const existing = await db.get('SELECT COUNT(*) as count FROM matches');
    if (existing.count > 0) {
      return; // Torneo già creato
    }

    // Recupera tutte le squadre
    const teams = await db.all('SELECT * FROM teams ORDER BY id LIMIT 8');
    
    if (teams.length < 8) {
      throw new Error('Servono almeno 8 squadre per creare il torneo');
    }

    // Crea partite quarti di finale
    const quarters = [
      { type: 'Q1', team1: teams[0].id, team2: teams[1].id },
      { type: 'Q2', team1: teams[2].id, team2: teams[3].id },
      { type: 'Q3', team1: teams[4].id, team2: teams[5].id },
      { type: 'Q4', team1: teams[6].id, team2: teams[7].id },
    ];

    for (const q of quarters) {
      await db.run(
        'INSERT INTO matches (phase, match_type, team1_id, team2_id) VALUES (?, ?, ?, ?)',
        ['quarters', q.type, q.team1, q.team2]
      );
    }

    // Crea partite semifinali (con team null, verranno popolati automaticamente)
    const semifinals = [
      { type: 'A1', team1: null, team2: null }, // Vinc. Q1 vs Vinc. Q2
      { type: 'A2', team1: null, team2: null }, // Vinc. Q3 vs Vinc. Q4
      { type: 'B1', team1: null, team2: null }, // Perd. Q1 vs Perd. Q2
      { type: 'B2', team1: null, team2: null }, // Perd. Q3 vs Perd. Q4
    ];

    for (const s of semifinals) {
      await db.run(
        'INSERT INTO matches (phase, match_type, team1_id, team2_id) VALUES (?, ?, ?, ?)',
        ['semifinals', s.type, s.team1, s.team2]
      );
    }

    // Crea partite finali
    const finals = [
      { type: 'final_1_2', team1: null, team2: null }, // Vinc. A1 vs Vinc. A2
      { type: 'final_3_4', team1: null, team2: null }, // Perd. A1 vs Perd. A2
      { type: 'final_5_6', team1: null, team2: null }, // Vinc. B1 vs Vinc. B2
      { type: 'final_7_8', team1: null, team2: null }, // Perd. B1 vs Perd. B2
    ];

    for (const f of finals) {
      await db.run(
        'INSERT INTO matches (phase, match_type, team1_id, team2_id) VALUES (?, ?, ?, ?)',
        ['finals', f.type, f.team1, f.team2]
      );
    }

    console.log('Tabellone torneo creato con successo');
  } catch (error) {
    console.error('Errore nella creazione tabellone:', error);
    throw error;
  }
}
