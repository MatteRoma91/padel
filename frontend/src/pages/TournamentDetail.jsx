import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import MatchCard from '../components/MatchCard';
import { exportTournamentPDF } from '../utils/pdfExport';
import './TournamentBracket.css';

function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, bData, rData] = await Promise.all([
        api.getTournament(id),
        api.getTournamentBracket(id),
        api.getTournamentRankings(id).catch(() => []),
      ]);
      setTournament(tData);
      setBracket(bData);
      setRankings(Array.isArray(rData) ? rData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchUpdate = async () => {
    await loadData();
  };

  if (loading) {
    return (
      <div className="tournament-page">
        <div className="container">
          <div className="loading">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="tournament-page">
        <div className="container">
          <div className="error">Errore: {error || 'Torneo non trovato'}</div>
          <button className="back-button" onClick={() => navigate('/tournaments')}>
            ← Indietro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-page">
      <div className="container">
        <header className="tournament-header">
          <button className="back-button" onClick={() => navigate('/tournaments')}>
            ← Indietro
          </button>
          <h1>🏆 {tournament.name}</h1>
          <div className="tournament-meta">
            {tournament.date && new Date(tournament.date).toLocaleDateString('it-IT')}
            {tournament.time && ` • ${tournament.time}`}
            {tournament.field && ` • ${tournament.field}`}
          </div>
          <div className="tournament-actions">
            <button className="action-link" onClick={() => navigate(`/tournaments/${id}/pairs`)}>
              Estrazione Coppie
            </button>
            <button
              className="action-link"
              onClick={() => exportTournamentPDF(tournament, bracket, rankings)}
            >
              Scarica PDF
            </button>
          </div>
        </header>

        {bracket && (
          <>
            <section className="tournament-phase">
              <h2 className="phase-title">🔹 Quarti di Finale</h2>
              <div className="matches-grid">
                {bracket.quarters?.map((match) => (
                  <MatchCard key={match.id} match={match} onUpdate={handleMatchUpdate} />
                ))}
              </div>
            </section>

            <section className="tournament-phase">
              <h2 className="phase-title">🔹 Semifinali</h2>
              <div className="semifinals-container">
                <div className="semifinals-group">
                  <h3 className="group-title">1°–4° posto</h3>
                  <div className="matches-grid">
                    {bracket.semifinals
                      ?.filter((m) => m.match_type === 'A1' || m.match_type === 'A2')
                      .map((match) => (
                        <MatchCard key={match.id} match={match} onUpdate={handleMatchUpdate} />
                      ))}
                  </div>
                </div>
                <div className="semifinals-group">
                  <h3 className="group-title">5°–8° posto</h3>
                  <div className="matches-grid">
                    {bracket.semifinals
                      ?.filter((m) => m.match_type === 'B1' || m.match_type === 'B2')
                      .map((match) => (
                        <MatchCard key={match.id} match={match} onUpdate={handleMatchUpdate} />
                      ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="tournament-phase">
              <h2 className="phase-title">🔹 Finali</h2>
              <div className="matches-grid">
                {bracket.finals?.map((match) => {
                  const labels = {
                    final_1_2: 'Finale 1°/2°',
                    final_3_4: 'Finale 3°/4°',
                    final_5_6: 'Finale 5°/6°',
                    final_7_8: 'Finale 7°/8°',
                  };
                  return (
                    <div key={match.id} className="final-match-wrapper">
                      <div className="final-label">{labels[match.match_type] || match.match_type}</div>
                      <MatchCard match={match} onUpdate={handleMatchUpdate} />
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {(!bracket || (bracket.quarters?.length === 0 && bracket.semifinals?.length === 0)) && (
          <p className="empty-bracket">Tabellone non ancora generato. Vai a Estrazione Coppie per generare le coppie.</p>
        )}
      </div>
    </div>
  );
}

export default TournamentDetail;
