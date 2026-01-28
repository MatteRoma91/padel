import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import './PlayersList.css';

function PlayersList() {
  const navigate = useNavigate();
  const { players, loading, error } = useTournament();

  if (loading) {
    return (
      <div className="players-page">
        <div className="container">
          <div className="loading">Caricamento giocatori...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="players-page">
        <div className="container">
          <div className="error">Errore: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="players-page">
      <div className="container">
        <header className="players-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Indietro
          </button>
          <h1>👥 Giocatori</h1>
        </header>

        <div className="players-grid">
          {players.map((player) => (
            <div
              key={player.id}
              className="player-card"
              onClick={() => navigate(`/players/${player.id}`)}
            >
              <div className="player-avatar">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="player-info">
                <h3 className="player-name">{player.name}</h3>
                {player.skill_level && (
                  <span className="player-level">{player.skill_level}</span>
                )}
                {player.matches_played > 0 && (
                  <div className="player-stats-preview">
                    <span>Vittorie: {player.wins}</span>
                    <span>•</span>
                    <span>{Math.round(player.win_percentage)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="empty-state">
            <p>Nessun giocatore disponibile</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayersList;
