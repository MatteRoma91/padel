import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './models/database.js';
import playersRoutes from './routes/players.js';
import matchesRoutes from './routes/matches.js';
import tournamentRoutes from './routes/tournament.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file statici per upload immagini
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/players', playersRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/tournament', tournamentRoutes);

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
