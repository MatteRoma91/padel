import db from '../models/database.js';

const CATEGORY_ORDER = { A_Gold: 0, A_Silver: 1, B_Gold: 2, B_Silver: 3, C: 4 };

/**
 * Ordina partecipanti: prima per categoria (migliore prima), poi per punti cumulativi
 */
function sortParticipants(participants, cumulativeMap) {
  return [...participants].sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.category] ?? 5;
    const orderB = CATEGORY_ORDER[b.category] ?? 5;
    if (orderA !== orderB) return orderA - orderB;
    const ptsA = cumulativeMap[a.id] || 0;
    const ptsB = cumulativeMap[b.id] || 0;
    return ptsB - ptsA;
  });
}

/**
 * Algoritmo forte+debole: accoppia il migliore con il più debole
 */
export async function generatePairs(tournamentId) {
  const participants = await db.all(
    `SELECT u.id, u.name, u.nickname, u.category
     FROM tournament_participants tp
     JOIN users u ON tp.user_id = u.id
     WHERE tp.tournament_id = ? AND u.role = 'player'
     ORDER BY u.id`,
    [tournamentId]
  );

  if (participants.length < 16) {
    throw new Error('Servono almeno 16 partecipanti per generare le coppie');
  }

  const cumRows = await db.all('SELECT user_id, total_points FROM cumulative_rankings');
  const cumulativeMap = {};
  cumRows.forEach((r) => (cumulativeMap[r.user_id] = r.total_points));

  const sorted = sortParticipants(participants, cumulativeMap);
  const pairs = [];
  const n = Math.min(16, sorted.length);
  for (let i = 0; i < n / 2; i++) {
    pairs.push([sorted[i], sorted[n - 1 - i]]);
  }

  await db.run('DELETE FROM pairs WHERE tournament_id = ?', [tournamentId]);
  await db.run('DELETE FROM matches WHERE tournament_id = ?', [tournamentId]);

  const pairIds = [];
  for (const [p1, p2] of pairs) {
    const r = await db.run('INSERT INTO pairs (tournament_id, user1_id, user2_id) VALUES (?, ?, ?)', [
      tournamentId,
      p1.id,
      p2.id,
    ]);
    pairIds.push(r.lastID);
  }

  // Crea tabellone
  const quarters = [
    ['Q1', pairIds[0], pairIds[1]],
    ['Q2', pairIds[2], pairIds[3]],
    ['Q3', pairIds[4], pairIds[5]],
    ['Q4', pairIds[6], pairIds[7]],
  ];
  for (const [type, p1, p2] of quarters) {
    await db.run(
      'INSERT INTO matches (tournament_id, phase, match_type, pair1_id, pair2_id) VALUES (?, ?, ?, ?, ?)',
      [tournamentId, 'quarters', type, p1, p2]
    );
  }
  for (const type of ['A1', 'A2', 'B1', 'B2']) {
    await db.run(
      'INSERT INTO matches (tournament_id, phase, match_type, pair1_id, pair2_id) VALUES (?, ?, ?, ?, ?)',
      [tournamentId, 'semifinals', type, null, null]
    );
  }
  for (const type of ['final_1_2', 'final_3_4', 'final_5_6', 'final_7_8']) {
    await db.run(
      'INSERT INTO matches (tournament_id, phase, match_type, pair1_id, pair2_id) VALUES (?, ?, ?, ?, ?)',
      [tournamentId, 'finals', type, null, null]
    );
  }

  return pairIds;
}
