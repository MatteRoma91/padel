import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './models/database.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import playersRoutes from './routes/players.js';
import matchesRoutes from './routes/matches.js';
import tournamentRoutes from './routes/tournament.js';
import tournamentsRoutes from './routes/tournaments.js';
import rankingsRoutes from './routes/rankings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file statici per upload immagini
app.use('/uploads', express.static('uploads'));

// Routes pubbliche
app.use('/api/auth', authRoutes);

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/tournament', tournamentRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/rankings', rankingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Banana Padel Tour API' });
});

// Inizializza database e avvia server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server in ascolto sulla porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Errore nell\'avvio del server:', error);
    process.exit(1);
  });

export default app;
