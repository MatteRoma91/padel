import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TorneiList.css';

function TorneiList() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTournaments();
  }, [filter]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'future') params.future = '1';
      else if (filter === 'past') params.future = '0';
      const data = await api.getTournaments(params);
      setTournaments(data);
    } catch (err) {
      console.error(err);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="tornei-page">
      <div className="container">
        <header className="tornei-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Indietro
          </button>
          <h1>🏆 Tornei</h1>
        </header>

        <div className="tornei-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tutti
          </button>
          <button
            className={`filter-btn ${filter === 'future' ? 'active' : ''}`}
            onClick={() => setFilter('future')}
          >
            Futuri
          </button>
          <button
            className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Passati
          </button>
        </div>

        {loading ? (
          <div className="loading">Caricamento...</div>
        ) : (
          <div className="tornei-list">
            {tournaments.length === 0 ? (
              <p className="empty">Nessun torneo trovato</p>
            ) : (
              tournaments.map((t) => (
                <div
                  key={t.id}
                  className="torneo-card"
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                >
                  <div className="torneo-name">{t.name}</div>
                  <div className="torneo-date">{formatDate(t.date)}</div>
                  {t.time && <div className="torneo-time">{t.time}</div>}
                  {t.field && <div className="torneo-field">📍 {t.field}</div>}
                  <span className={`torneo-status status-${t.status}`}>{t.status}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TorneiList;
