/**
 * Script di migrazione da schema vecchio (players, teams, matches)
 * a nuovo schema (users, pairs, tournaments, etc.)
 *
 * Esegui: node src/scripts/migrate.js
 * Oppure con dati puliti: elimina database.sqlite e usa seed.js
 */
import db from '../models/database.js';
import { initDatabase } from '../models/database.js';
import bcrypt from 'bcrypt';

async function migrate() {
  try {
    // Verifica se esiste lo schema vecchio
    const oldTables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('players', 'teams', 'matches', 'player_stats')"
    );

    if (oldTables.length === 0) {
      console.log('Nessuno schema vecchio trovato. Inizializzo nuovo schema...');
      await initDatabase();
      await seedAdmin();
      process.exit(0);
      return;
    }

    console.log('Migrazione da schema vecchio a nuovo...');

    // Crea nuove tabelle
    await initDatabase();

    // Migra players -> users (con password default)
    const players = await db.all('SELECT * FROM players');
    const defaultHash = await bcrypt.hash('password123', 10);

    for (const p of players) {
      const username = (p.name || 'user').toLowerCase().replace(/\s+/g, '') + p.id;
      await db.run(
        `INSERT INTO users (username, password_hash, name, nickname, role, category, photo_url, availability_confirmed)
         VALUES (?, ?, ?, ?, 'player', ?, ?, 0)`,
        [username, defaultHash, p.name, p.name, 'C', p.avatar_url || null]
      );
      const userResult = await db.get('SELECT id FROM users WHERE username = ?', [username]);
      const stats = await db.get('SELECT * FROM player_stats WHERE player_id = ?', [p.id]).catch(() => null);
      await db.run(
        'INSERT OR REPLACE INTO player_stats (user_id, matches_played, wins, losses, win_percentage) VALUES (?, ?, ?, ?, ?)',
        [
          userResult.id,
          stats?.matches_played || 0,
          stats?.wins || 0,
          stats?.losses || 0,
          stats?.win_percentage || 0,
        ]
      );
    }

    // Crea admin se non esiste
    const adminExists = await db.get("SELECT id FROM users WHERE role = 'admin'");
    if (!adminExists) {
      await seedAdmin();
    }

    console.log('Migrazione completata. Username default: nome+id, password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Errore migrazione:', err);
    process.exit(1);
  }
}

async function seedAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  await db.run(
    `INSERT INTO users (username, password_hash, name, nickname, role) VALUES (?, ?, ?, ?, 'admin')`,
    ['admin', hash, 'Admin', 'Admin', 'admin']
  );
  console.log('Admin creato: username=admin, password=admin123');
}

migrate();
