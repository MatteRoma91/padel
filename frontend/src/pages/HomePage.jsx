import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../context/TournamentContext';
import api from '../services/api';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { bracket } = useTournament();
  const [nextTournament, setNextTournament] = useState(null);
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    api.getTournaments({ future: '1' }).then((t) => setNextTournament(t[0] || null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (nextTournament?.id) {
      api.getTournamentRankings(nextTournament.id).then(setRankings).catch(() => []);
    }
  }, [nextTournament?.id]);

  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <h1>🟡 Banana Padel Tour</h1>
          <p className="home-welcome">Benvenuto nel Banana Padel Tour!</p>
          <div className="user-bar">
            <span className="user-name">Ciao, {user?.nickname || user?.name}</span>
            <button className="logout-button" onClick={logout}>
              Esci
            </button>
          </div>
        </header>

        {nextTournament && (
          <section className="home-next-tournament">
            <h2>Prossimo Torneo</h2>
            <div
              className="next-tournament-card"
              onClick={() => navigate(`/tournaments/${nextTournament.id}`)}
            >
              <div className="next-name">{nextTournament.name}</div>
              <div className="next-date">
                {new Date(nextTournament.date).toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              {nextTournament.time && <div className="next-time">🕐 {nextTournament.time}</div>}
              {nextTournament.field && <div className="next-field">📍 {nextTournament.field}</div>}
            </div>
          </section>
        )}

        {rankings.length > 0 && (
          <section className="home-rankings">
            <h2>Classifica Torneo Corrente</h2>
            <div className="rankings-preview">
              {rankings.slice(0, 8).map((r, i) => (
                <div key={r.user_id} className="ranking-row">
                  <span className="rank-pos">{i + 1}°</span>
                  <span className="rank-name">{r.nickname || r.name}</span>
                  <span className="rank-pts">{r.points ?? 0} pt</span>
                </div>
              ))}
            </div>
            <button className="link-button" onClick={() => navigate('/rankings')}>
              Vedi classifica completa →
            </button>
          </section>
        )}

        <nav className="home-menu">
          <button className="menu-item" onClick={() => navigate('/tournaments')} aria-label="Tornei">
            <span className="menu-icon">🏆</span>
            <span className="menu-label">Tornei</span>
          </button>

          <button className="menu-item" onClick={() => navigate('/players')} aria-label="Profili">
            <span className="menu-icon">👥</span>
            <span className="menu-label">Profili</span>
          </button>

          <button className="menu-item" onClick={() => navigate('/calendar')} aria-label="Calendario">
            <span className="menu-icon">📅</span>
            <span className="menu-label">Calendario</span>
          </button>

          <button className="menu-item" onClick={() => navigate('/rankings')} aria-label="Classifiche">
            <span className="menu-icon">🏅</span>
            <span className="menu-label">Classifiche</span>
          </button>

          <button className="menu-item" onClick={() => navigate('/archive')} aria-label="Archivio">
            <span className="menu-icon">📁</span>
            <span className="menu-label">Archivio</span>
          </button>

          {user?.role === 'admin' && (
            <button className="menu-item admin" onClick={() => navigate('/admin')} aria-label="Amministratore">
              <span className="menu-icon">⚙️</span>
              <span className="menu-label">Amministratore</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}

export default HomePage;
