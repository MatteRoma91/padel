import { initDatabase, default as db } from '../models/database.js';
import { createTournamentBracket } from '../controllers/tournamentController.js';

/**
 * Script per popolare il database con dati iniziali
 */

const players = [
  { name: 'Cora', dominant_hand: 'destra', skill_level: 'intermedio' },
  { name: 'Jullios', dominant_hand: 'destra', skill_level: 'avanzato' },
  { name: 'Faber', dominant_hand: 'destra', skill_level: 'intermedio' },
  { name: 'Marcolone', dominant_hand: 'destra', skill_level: 'avanzato' },
  { name: 'Braccio', dominant_hand: 'destra', skill_level: 'intermedio' },
  { name: 'Porra', dominant_hand: 'sinistra', skill_level: 'avanzato' },
  { name: 'Fabio', dominant_hand: 'destra', skill_level: 'intermedio' },
  { name: 'Dile', dominant_hand: 'destra', skill_level: 'avanzato' },
  { name: 'David', dominant_hand: 'destra', skill_level: 'intermedio' },
  { name: 'Dibby', dominant_hand: 'destra', skill_level: 'avanzato' },
  { name: 'Gazza', dominant_hand: 'destra', skill_level: 'intermedio' },
  { name: 'Scimmia', dominant_hand: 'sinistra', skill_level: 'avanzato' },
  { name: 'Valerio', dominant_hand: 'destra', skill_level: 'intermedio' },
  { name: 'Merzio', dominant_hand: 'destra', skill_level: 'avanzato' },
  { name: 'Danti', dominant_hand: 'destra', skill_level: 'intermedio' },
  { name: 'Ema Baldi', dominant_hand: 'destra', skill_level: 'avanzato' },
];

const teams = [
  { name: 'Cora-Jullios', player1: 'Cora', player2: 'Jullios' },
  { name: 'Faber-Marcolone', player1: 'Faber', player2: 'Marcolone' },
  { name: 'Braccio-Porra', player1: 'Braccio', player2: 'Porra' },
  { name: 'Fabio-Dile', player1: 'Fabio', player2: 'Dile' },
  { name: 'David-Dibby', player1: 'David', player2: 'Dibby' },
  { name: 'Gazza-Scimmia', player1: 'Gazza', player2: 'Scimmia' },
  { name: 'Valerio-Merzio', player1: 'Valerio', player2: 'Merzio' },
  { name: 'Danti-Ema Baldi', player1: 'Danti', player2: 'Ema Baldi' },
];

async function seed() {
  try {
    console.log('Inizializzazione database...');
    await initDatabase();

    // Verifica se ci sono già dati e pulisci se necessario
    const existingPlayers = await db.all('SELECT COUNT(*) as count FROM players');
    const playerCount = existingPlayers && existingPlayers[0] ? (existingPlayers[0].count || 0) : 0;
    
    if (playerCount > 0) {
      console.log(`Database già popolato con ${playerCount} giocatori. Pulisco e ricreo i dati...`);
      await db.run('DELETE FROM matches');
      await db.run('DELETE FROM teams');
      await db.run('DELETE FROM player_stats');
      await db.run('DELETE FROM players');
    }

    console.log('Creazione giocatori...');
    const playerMap = {};
    
    for (const player of players) {
      const result = await db.run(
        'INSERT INTO players (name, dominant_hand, skill_level) VALUES (?, ?, ?)',
        [player.name, player.dominant_hand, player.skill_level]
      );
      
      playerMap[player.name] = result.lastID;
      
      // Crea entry statistiche iniziali
      await db.run(
        'INSERT INTO player_stats (player_id) VALUES (?)',
        [result.lastID]
      );
    }

    console.log('Creazione squadre...');
    const teamMap = {};
    
    for (const team of teams) {
      const player1Id = playerMap[team.player1];
      const player2Id = playerMap[team.player2];
      
      if (!player1Id || !player2Id) {
        throw new Error(`Giocatori non trovati per squadra ${team.name}`);
      }
      
      const result = await db.run(
        'INSERT INTO teams (player1_id, player2_id, name) VALUES (?, ?, ?)',
        [player1Id, player2Id, team.name]
      );
      
      teamMap[team.name] = result.lastID;
    }

    console.log('Creazione tabellone torneo...');
    await createTournamentBracket();

    console.log('Seed completato con successo!');
    console.log(`Creati ${players.length} giocatori e ${teams.length} squadre`);
    
    process.exit(0);
  } catch (error) {
    console.error('Errore durante il seed:', error);
    process.exit(1);
  }
}

seed();
