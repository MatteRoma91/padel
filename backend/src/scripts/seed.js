import { initDatabase, default as db } from '../models/database.js';
import bcrypt from 'bcrypt';

const PLAYERS = [
  { name: 'Cora', category: 'A_Gold' },
  { name: 'Jullios', category: 'A_Gold' },
  { name: 'Faber', category: 'A_Silver' },
  { name: 'Marcolone', category: 'A_Silver' },
  { name: 'Braccio', category: 'B_Gold' },
  { name: 'Porra', category: 'B_Gold' },
  { name: 'Fabio', category: 'B_Silver' },
  { name: 'Dile', category: 'B_Silver' },
  { name: 'David', category: 'B_Silver' },
  { name: 'Dibby', category: 'C' },
  { name: 'Gazza', category: 'C' },
  { name: 'Scimmia', category: 'C' },
  { name: 'Valerio', category: 'C' },
  { name: 'Merzio', category: 'C' },
  { name: 'Danti', category: 'C' },
  { name: 'Ema Baldi', category: 'C' },
];

function genUser(name) {
  return (name || 'user').toLowerCase().replace(/\s+/g, '') + Math.random().toString(36).slice(-4);
}

async function seed() {
  try {
    await initDatabase();

    await db.run('DELETE FROM matches');
    await db.run('DELETE FROM tournament_rankings');
    await db.run('DELETE FROM pairs');
    await db.run('DELETE FROM tournament_participants');
    await db.run('DELETE FROM tournaments');
    await db.run('DELETE FROM cumulative_rankings');
    await db.run('DELETE FROM player_stats');
    await db.run('DELETE FROM users');

    const adminHash = await bcrypt.hash('admin123', 10);
    await db.run(
      "INSERT INTO users (username, password_hash, name, nickname, role) VALUES ('admin', ?, 'Admin', 'Admin', 'admin')",
      [adminHash]
    );
    console.log('Admin: username=admin, password=admin123');

    const playerHash = await bcrypt.hash('player123', 10);
    const userMap = {};

    for (const p of PLAYERS) {
      const username = genUser(p.name);
      const res = await db.run(
        'INSERT INTO users (username, password_hash, name, nickname, role, category) VALUES (?, ?, ?, ?, ?, ?)',
        [username, playerHash, p.name, p.name, 'player', p.category]
      );
      userMap[p.name] = res.lastID;
      await db.run('INSERT INTO player_stats (user_id) VALUES (?)', [res.lastID]);
      await db.run('INSERT INTO cumulative_rankings (user_id) VALUES (?)', [res.lastID]);
    }
    console.log('Players: password=player123 per tutti');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    const tRes = await db.run(
      'INSERT INTO tournaments (name, date, time, field, status) VALUES (?, ?, ?, ?, ?)',
      ['D&D Padel Slam', dateStr, '18:00', 'Campo 1', 'active']
    );
    const tournamentId = tRes.lastID;

    const userIds = Object.values(userMap);
    for (const uid of userIds) {
      await db.run('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)', [tournamentId, uid]);
    }

    const pairs = [
      [userIds[0], userIds[15]],
      [userIds[1], userIds[14]],
      [userIds[2], userIds[13]],
      [userIds[3], userIds[12]],
      [userIds[4], userIds[11]],
      [userIds[5], userIds[10]],
      [userIds[6], userIds[9]],
      [userIds[7], userIds[8]],
    ];

    const pairIds = [];
    for (const [u1, u2] of pairs) {
      const pr = await db.run('INSERT INTO pairs (tournament_id, user1_id, user2_id) VALUES (?, ?, ?)', [
        tournamentId,
        u1,
        u2,
      ]);
      pairIds.push(pr.lastID);
    }

    for (const [type, p1, p2] of [
      ['Q1', pairIds[0], pairIds[1]],
      ['Q2', pairIds[2], pairIds[3]],
      ['Q3', pairIds[4], pairIds[5]],
      ['Q4', pairIds[6], pairIds[7]],
    ]) {
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

    console.log('Seed completato! Torneo e tabellone creati.');
    process.exit(0);
  } catch (error) {
    console.error('Errore seed:', error);
    process.exit(1);
  }
}

seed();
