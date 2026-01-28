import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const TournamentContext = createContext();

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament deve essere usato dentro TournamentProvider');
  }
  return context;
}

export function TournamentProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica dati iniziali
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [playersData, bracketData, teamsData] = await Promise.all([
        api.getPlayers(),
        api.getBracket(),
        api.getTeams(),
      ]);

      setPlayers(playersData);
      setBracket(bracketData);
      setTeams(teamsData);
    } catch (err) {
      console.error('Errore nel caricamento dati:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshBracket = async () => {
    try {
      const bracketData = await api.getBracket();
      setBracket(bracketData);
    } catch (err) {
      console.error('Errore nell\'aggiornamento tabellone:', err);
    }
  };

  const refreshPlayers = async () => {
    try {
      const playersData = await api.getPlayers();
      setPlayers(playersData);
    } catch (err) {
      console.error('Errore nell\'aggiornamento giocatori:', err);
    }
  };

  const value = {
    players,
    bracket,
    teams,
    loading,
    error,
    loadData,
    refreshBracket,
    refreshPlayers,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}
