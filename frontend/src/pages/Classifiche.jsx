import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Classifiche.css';

function Classifiche() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [cumulative, setCumulative] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentRankings, setTournamentRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentRankings(selectedTournament);
    } else {
      setTournamentRankings([]);
    }
  }, [selectedTournament]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cum, tour] = await Promise.all([
        api.getCumulativeRankings().catch(() => []),
        api.getTournaments({}).catch(() => []),
      ]);
      setCumulative(cum);
      setTournaments(tour);
    } catch (err) {
      setCumulative([]);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentRankings = async (tid) => {
    try {
      const data = await api.getTournamentRankings(tid).catch(() => []);
      setTournamentRankings(data);
    } catch {
      setTournamentRankings([]);
    }
  };

  return (
    <div className="classifiche-page">
      <div className="container">
        <header className="classifiche-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Indietro
          </button>
          <h1>🏅 Classifiche</h1>
        </header>

        {loading ? (
          <div className="loading">Caricamento...</div>
        ) : (
          <>
            <section className="ranking-section">
              <h2 className="section-title">Classifica Cumulativa Banana Padel Tour</h2>
              <div className="ranking-table">
                <div className="table-header">
                  <div>Pos.</div>
                  <div>Giocatore</div>
                  <div>Categoria</div>
                  <div>Punti</div>
                </div>
                {cumulative.length === 0 ? (
                  <p className="empty-row">Nessun dato</p>
                ) : (
                  cumulative.map((r, i) => (
                    <div key={r.user_id} className="table-row">
                      <div className="pos">{i + 1}°</div>
                      <div>{r.nickname || r.name}</div>
                      <div>{r.category || '-'}</div>
                      <div className="points">{r.total_points ?? 0}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="ranking-section">
              <h2 className="section-title">Classifica per Torneo</h2>
              <select
                className="tournament-select"
                value={selectedTournament || ''}
                onChange={(e) => setSelectedTournament(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Seleziona torneo</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.date})
                  </option>
                ))}
              </select>
              <div className="ranking-table">
                <div className="table-header">
                  <div>Pos.</div>
                  <div>Giocatore</div>
                  <div>Punti</div>
                </div>
                {tournamentRankings.length === 0 ? (
                  <p className="empty-row">Nessun dato</p>
                ) : (
                  tournamentRankings.map((r) => (
                    <div key={r.user_id} className="table-row">
                      <div className="pos">{r.position}°</div>
                      <div>{r.nickname || r.name}</div>
                      <div className="points">{r.points ?? 0}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Classifiche;
