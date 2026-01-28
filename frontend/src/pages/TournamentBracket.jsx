import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import MatchCard from '../components/MatchCard';
import './TournamentBracket.css';

function TournamentBracket() {
  const navigate = useNavigate();
  const { bracket, loading, error, refreshBracket } = useTournament();

  useEffect(() => {
    refreshBracket();
  }, []);

  const handleMatchUpdate = async () => {
    await refreshBracket();
  };

  if (loading) {
    return (
      <div className="tournament-page">
        <div className="container">
          <div className="loading">Caricamento tabellone...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-page">
        <div className="container">
          <div className="error">Errore: {error}</div>
        </div>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="tournament-page">
        <div className="container">
          <div className="error">Nessun dato disponibile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-page">
      <div className="container">
        <header className="tournament-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Indietro
          </button>
          <h1>🏆 D&D Padel Slam</h1>
        </header>

        {/* Quarti di Finale */}
        <section className="tournament-phase">
          <h2 className="phase-title">🔹 Quarti di Finale (20 min – 4 campi)</h2>
          <div className="matches-grid">
            {bracket.quarters?.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onUpdate={handleMatchUpdate}
              />
            ))}
          </div>
        </section>

        {/* Semifinali */}
        <section className="tournament-phase">
          <h2 className="phase-title">🔹 Semifinali (20 min – 4 campi)</h2>
          
          <div className="semifinals-container">
            <div className="semifinals-group">
              <h3 className="group-title">1°–4° posto</h3>
              <div className="matches-grid">
                {bracket.semifinals
                  ?.filter((m) => m.match_type === 'A1' || m.match_type === 'A2')
                  .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onUpdate={handleMatchUpdate}
                    />
                  ))}
              </div>
            </div>

            <div className="semifinals-group">
              <h3 className="group-title">5°–8° posto</h3>
              <div className="matches-grid">
                {bracket.semifinals
                  ?.filter((m) => m.match_type === 'B1' || m.match_type === 'B2')
                  .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onUpdate={handleMatchUpdate}
                    />
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Finali */}
        <section className="tournament-phase">
          <h2 className="phase-title">🔹 Finali (35 min – 4 campi)</h2>
          <div className="matches-grid">
            {bracket.finals?.map((match) => {
              let finalLabel = '';
              switch (match.match_type) {
                case 'final_1_2':
                  finalLabel = 'Finale 1°/2°';
                  break;
                case 'final_3_4':
                  finalLabel = 'Finale 3°/4°';
                  break;
                case 'final_5_6':
                  finalLabel = 'Finale 5°/6°';
                  break;
                case 'final_7_8':
                  finalLabel = 'Finale 7°/8°';
                  break;
                default:
                  finalLabel = match.match_type;
              }
              return (
                <div key={match.id} className="final-match-wrapper">
                  <div className="final-label">{finalLabel}</div>
                  <MatchCard
                    match={match}
                    onUpdate={handleMatchUpdate}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default TournamentBracket;
