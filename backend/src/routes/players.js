import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../models/database.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione multer per upload immagini
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'player-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse!'));
    }
  }
});

// GET /api/players - Lista tutti i giocatori
router.get('/', async (req, res) => {
  try {
    const players = await db.all(`
      SELECT p.*, 
             COALESCE(ps.matches_played, 0) as matches_played,
             COALESCE(ps.wins, 0) as wins,
             COALESCE(ps.losses, 0) as losses,
             COALESCE(ps.win_percentage, 0) as win_percentage
      FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      ORDER BY p.name
    `);
    res.json(players);
  } catch (error) {
    console.error('Errore nel recupero giocatori:', error);
    res.status(500).json({ error: 'Errore nel recupero giocatori' });
  }
});

// GET /api/players/:id - Dettaglio giocatore
router.get('/:id', async (req, res) => {
  try {
    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.params.id]);
    
    if (!player) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    // Recupera statistiche
    const stats = await db.get(
      'SELECT * FROM player_stats WHERE player_id = ?',
      [req.params.id]
    );

    // Recupera partite recenti
    const recentMatches = await db.all(`
      SELECT m.*, 
             t1.name as team1_name,
             t2.name as team2_name,
             CASE 
               WHEN m.winner_id = t1.id THEN 'win'
               WHEN m.winner_id = t2.id THEN 'loss'
               ELSE NULL
             END as result
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      WHERE (t1.player1_id = ? OR t1.player2_id = ? OR t2.player1_id = ? OR t2.player2_id = ?)
        AND m.winner_id IS NOT NULL
      ORDER BY m.match_date DESC, m.created_at DESC
      LIMIT 10
    `, [req.params.id, req.params.id, req.params.id, req.params.id]);

    res.json({
      ...player,
      stats: stats || {
        total_score: 0,
        matches_played: 0,
        wins: 0,
        losses: 0,
        win_percentage: 0
      },
      recentMatches
    });
  } catch (error) {
    console.error('Errore nel recupero dettaglio giocatore:', error);
    res.status(500).json({ error: 'Errore nel recupero dettaglio giocatore' });
  }
});

// POST /api/players - Aggiungi nuovo giocatore
router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    const { name, dominant_hand, skill_level } = req.body;
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name) {
      return res.status(400).json({ error: 'Il nome è obbligatorio' });
    }

    const result = await db.run(
      'INSERT INTO players (name, avatar_url, dominant_hand, skill_level) VALUES (?, ?, ?, ?)',
      [name, avatar_url, dominant_hand || null, skill_level || null]
    );

    // Crea entry statistiche iniziali
    await db.run(
      'INSERT INTO player_stats (player_id) VALUES (?)',
      [result.lastID]
    );

    res.status(201).json({ 
      id: result.lastID, 
      name, 
      avatar_url, 
      dominant_hand, 
      skill_level 
    });
  } catch (error) {
    console.error('Errore nella creazione giocatore:', error);
    res.status(500).json({ error: 'Errore nella creazione giocatore' });
  }
});

// PUT /api/players/:id - Modifica giocatore
router.put('/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { name, dominant_hand, skill_level } = req.body;
    
    // Verifica che il giocatore esista
    const existing = await db.get('SELECT * FROM players WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    let avatar_url = existing.avatar_url;
    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
    }

    await db.run(
      'UPDATE players SET name = ?, avatar_url = ?, dominant_hand = ?, skill_level = ? WHERE id = ?',
      [name || existing.name, avatar_url, dominant_hand || existing.dominant_hand, skill_level || existing.skill_level, req.params.id]
    );

    const updated = await db.get('SELECT * FROM players WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Errore nell\'aggiornamento giocatore:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento giocatore' });
  }
});

// DELETE /api/players/:id - Rimuovi giocatore
router.delete('/:id', async (req, res) => {
  try {
    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.params.id]);
    
    if (!player) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    // Elimina statistiche
    await db.run('DELETE FROM player_stats WHERE player_id = ?', [req.params.id]);
    
    // Elimina giocatore
    await db.run('DELETE FROM players WHERE id = ?', [req.params.id]);

    res.json({ message: 'Giocatore eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione giocatore:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione giocatore' });
  }
});

export default router;
