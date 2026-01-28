import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PlayerDetail.css';

function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPlayer();
  }, [id]);

  const loadPlayer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPlayer(id);
      setPlayer(data);
    } catch (err) {
      console.error('Errore nel caricamento giocatore:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="player-detail-page">
        <div className="container">
          <div className="loading">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="player-detail-page">
        <div className="container">
          <div className="error">Errore: {error || 'Giocatore non trovato'}</div>
          <button className="back-button" onClick={() => navigate('/players')}>
            ← Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  const stats = player.stats || {
    total_score: 0,
    matches_played: 0,
    wins: 0,
    losses: 0,
    win_percentage: 0,
  };

  return (
    <div className="player-detail-page">
      <div className="container">
        <header className="player-detail-header">
          <button className="back-button" onClick={() => navigate('/players')}>
            ← Indietro
          </button>
        </header>

        <div className="player-profile">
          <div className="profile-avatar">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.name} />
            ) : (
              <div className="avatar-placeholder">
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{player.name}</h1>
            <div className="profile-details">
              {player.dominant_hand && (
                <div className="detail-item">
                  <span className="detail-label">Mano dominante:</span>
                  <span className="detail-value">{player.dominant_hand}</span>
                </div>
              )}
              {player.skill_level && (
                <div className="detail-item">
                  <span className="detail-label">Livello:</span>
                  <span className="detail-value">{player.skill_level}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="player-stats-section">
          <h2 className="section-title">📊 Statistiche</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.matches_played}</div>
              <div className="stat-label">Partite giocate</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{stats.wins}</div>
              <div className="stat-label">Vittorie</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-value">{stats.losses}</div>
              <div className="stat-label">Sconfitte</div>
            </div>
            <div className="stat-card primary">
              <div className="stat-value">{Math.round(stats.win_percentage)}%</div>
              <div className="stat-label">Percentuale vittoria</div>
            </div>
          </div>
        </section>

        <section className="recent-matches-section">
          <h2 className="section-title">🕘 Risultati Recenti</h2>
          {player.recentMatches && player.recentMatches.length > 0 ? (
            <div className="matches-list">
              {player.recentMatches.map((match, index) => (
                <div
                  key={index}
                  className={`match-item ${match.result === 'win' ? 'win' : 'loss'}`}
                >
                  <div className="match-info">
                    <div className="match-opponent">
                      {match.team1_name || match.team2_name || 'Avversari'}
                    </div>
                    <div className="match-date">
                      {match.match_date
                        ? new Date(match.match_date).toLocaleDateString('it-IT')
                        : 'Data non disponibile'}
                    </div>
                  </div>
                  <div className="match-result">
                    {match.result === 'win' ? (
                      <span className="result-badge win">Vittoria</span>
                    ) : (
                      <span className="result-badge loss">Sconfitta</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nessuna partita giocata ancora</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PlayerDetail;
