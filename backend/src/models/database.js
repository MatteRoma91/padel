import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crea database in memoria per sviluppo, o file per produzione
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Promisifica i metodi del database
db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));

// Wrapper personalizzato per db.run che mantiene lastID
const originalRun = db.run.bind(db);
db.run = function(sql, params) {
  return new Promise((resolve, reject) => {
    originalRun(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

/**
 * Inizializza il database creando tutte le tabelle necessarie
 */
export async function initDatabase() {
  try {
    // Tabella Giocatori
    await db.run(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar_url TEXT,
        dominant_hand TEXT CHECK(dominant_hand IN ('destra', 'sinistra')),
        skill_level TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabella Squadre
    await db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player1_id) REFERENCES players(id),
        FOREIGN KEY (player2_id) REFERENCES players(id)
      )
    `);

    // Tabella Partite
    await db.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phase TEXT NOT NULL CHECK(phase IN ('quarters', 'semifinals', 'finals')),
        match_type TEXT NOT NULL,
        team1_id INTEGER,
        team2_id INTEGER,
        team1_score TEXT,
        team2_score TEXT,
        winner_id INTEGER,
        match_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team1_id) REFERENCES teams(id),
        FOREIGN KEY (team2_id) REFERENCES teams(id),
        FOREIGN KEY (winner_id) REFERENCES teams(id)
      )
    `);

    // Tabella Statistiche Giocatori
    await db.run(`
      CREATE TABLE IF NOT EXISTS player_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL UNIQUE,
        total_score INTEGER DEFAULT 0,
        matches_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        win_percentage REAL DEFAULT 0.0,
        FOREIGN KEY (player_id) REFERENCES players(id)
      )
    `);

    console.log('Database inizializzato con successo');
  } catch (error) {
    console.error('Errore nell\'inizializzazione del database:', error);
    throw error;
  }
}

export default db;
