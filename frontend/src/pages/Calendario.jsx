import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Calendario.css';

function Calendario() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await api.getTournaments({});
      setTournaments(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="calendario-page">
      <div className="container">
        <header className="calendario-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Indietro
          </button>
          <h1>📅 Calendario</h1>
          <p className="calendario-desc">Giorni e orari dei tornei</p>
        </header>

        {loading ? (
          <div className="loading">Caricamento...</div>
        ) : (
          <div className="calendario-list">
            {tournaments.length === 0 ? (
              <p className="empty">Nessun torneo in programma</p>
            ) : (
              tournaments.map((t) => (
                <div
                  key={t.id}
                  className="calendario-card"
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                >
                  <div className="cal-date">{formatDate(t.date)}</div>
                  <div className="cal-name">{t.name}</div>
                  {t.time && <div className="cal-time">🕐 {t.time}</div>}
                  {t.field && <div className="cal-field">📍 {t.field}</div>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendario;
