import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));

const originalRun = db.run.bind(db);
db.run = function (sql, params) {
  return new Promise((resolve, reject) => {
    originalRun(sql, params || [], function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const CATEGORIES = ['A_Gold', 'A_Silver', 'B_Gold', 'B_Silver', 'C'];
const ROLES = ['admin', 'player'];
const TOURNAMENT_STATUS = ['draft', 'active', 'completed'];

export { CATEGORIES, ROLES, TOURNAMENT_STATUS };

/**
 * Inizializza il database con il nuovo schema
 */
export async function initDatabase() {
  try {
    // Tabella Utenti (sostituisce players per auth)
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        nickname TEXT,
        role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('admin', 'player')),
        category TEXT CHECK(category IN ('A_Gold', 'A_Silver', 'B_Gold', 'B_Silver', 'C')),
        photo_url TEXT,
        availability_confirmed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Statistiche giocatori (legata a users)
    await db.run(`
      CREATE TABLE IF NOT EXISTS player_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        matches_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        win_percentage REAL DEFAULT 0.0,
        total_tour_points INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tornei
    await db.run(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        field TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Partecipanti torneo (admin assegna)
    await db.run(`
      CREATE TABLE IF NOT EXISTS tournament_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        UNIQUE(tournament_id, user_id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Coppie per torneo
    await db.run(`
      CREATE TABLE IF NOT EXISTS pairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
        FOREIGN KEY (user1_id) REFERENCES users(id),
        FOREIGN KEY (user2_id) REFERENCES users(id)
      )
    `);

    // Partite (legata a pairs e tornei)
    await db.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        phase TEXT NOT NULL CHECK(phase IN ('quarters', 'semifinals', 'finals')),
        match_type TEXT NOT NULL,
        pair1_id INTEGER,
        pair2_id INTEGER,
        team1_score TEXT,
        team2_score TEXT,
        winner_pair_id INTEGER,
        match_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
        FOREIGN KEY (pair1_id) REFERENCES pairs(id),
        FOREIGN KEY (pair2_id) REFERENCES pairs(id),
        FOREIGN KEY (winner_pair_id) REFERENCES pairs(id)
      )
    `);

    // Classifica singolo torneo
    await db.run(`
      CREATE TABLE IF NOT EXISTS tournament_rankings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        points INTEGER DEFAULT 0,
        UNIQUE(tournament_id, user_id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Classifica cumulativa Banana Padel Tour
    await db.run(`
      CREATE TABLE IF NOT EXISTS cumulative_rankings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        total_points INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('Database inizializzato con successo');
  } catch (error) {
    console.error("Errore nell'inizializzazione del database:", error);
    throw error;
  }
}

export default db;
