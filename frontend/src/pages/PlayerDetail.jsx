import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './PlayerDetail.css';

function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nickname: '', avatar: null, availability_confirmed: false });
  const [saveLoading, setSaveLoading] = useState(false);

  const isOwnProfile = user && parseInt(id) === user.id;

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      await api.updateUser(id, {
        nickname: editForm.nickname,
        photo: editForm.avatar,
        availability_confirmed: editForm.availability_confirmed,
      });
      await loadPlayer();
      setEditing(false);
      setEditForm({ nickname: player.nickname || player.name, avatar: null, availability_confirmed: !!player.availability_confirmed });
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const startEdit = () => {
    setEditForm({
      nickname: player.nickname || player.name,
      avatar: null,
      availability_confirmed: !!player.availability_confirmed,
    });
    setEditing(true);
  };

  return (
    <div className="player-detail-page">
      <div className="container">
        <header className="player-detail-header">
          <button className="back-button" onClick={() => navigate('/players')}>
            ← Indietro
          </button>
          {isOwnProfile && !editing && (
            <button className="edit-profile-button" onClick={startEdit}>
              Modifica profilo
            </button>
          )}
        </header>

        {editing && isOwnProfile ? (
          <form className="profile-edit-form" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label>Nickname</label>
              <input
                type="text"
                value={editForm.nickname}
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Foto</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.files[0] || null })}
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={editForm.availability_confirmed}
                  onChange={(e) => setEditForm({ ...editForm, availability_confirmed: e.target.checked })}
                />
                Conferma disponibilità
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={saveLoading}>
                {saveLoading ? 'Salvataggio...' : 'Salva'}
              </button>
              <button type="button" onClick={() => setEditing(false)}>
                Annulla
              </button>
            </div>
          </form>
        ) : (
          <div className="player-profile">
            <div className="profile-avatar">
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={player.name} />
              ) : (
                <div className="avatar-placeholder">
                  {(player.nickname || player.name).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{player.nickname || player.name}</h1>
              <div className="profile-details">
                {player.category && (
                  <div className="detail-item">
                    <span className="detail-label">Categoria:</span>
                    <span className="detail-value">{player.category}</span>
                  </div>
                )}
                {player.availability_confirmed !== undefined && (
                  <div className="detail-item">
                    <span className="detail-label">Disponibilità:</span>
                    <span className="detail-value">{player.availability_confirmed ? 'Confermata' : 'Da confermare'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
