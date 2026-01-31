import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './EstrazioneCoppie.css';

function EstrazioneCoppie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, pData] = await Promise.all([
        api.getTournament(id),
        api.getTournamentPairs(id).catch(() => []),
      ]);
      setTournament(tData);
      setPairs(Array.isArray(pData) ? pData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenLoading(true);
      const data = await api.generatePairs(id);
      setPairs(data.pairs || []);
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Rigenerare le coppie? Le partite esistenti verranno eliminate.')) return;
    try {
      setGenLoading(true);
      const data = await api.regeneratePairs(id);
      setPairs(data.pairs || []);
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setGenLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="estrazione-page">
        <div className="container">
          <div className="loading">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="estrazione-page">
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
    <div className="estrazione-page">
      <div className="container">
        <header className="estrazione-header">
          <button className="back-button" onClick={() => navigate(`/tournaments/${id}`)}>
            ← Indietro
          </button>
          <h1>🎲 Estrazione Coppie</h1>
          <p className="tournament-name">{tournament.name}</p>
        </header>

        {isAdmin && (
          <div className="estrazione-actions">
            <button
              className="action-button primary"
              onClick={handleGenerate}
              disabled={genLoading || pairs.length > 0}
            >
              {genLoading ? 'Generazione...' : pairs.length > 0 ? 'Coppie già generate' : 'Genera Coppie'}
            </button>
            {pairs.length > 0 && (
              <button
                className="action-button danger"
                onClick={handleRegenerate}
                disabled={genLoading}
              >
                {genLoading ? 'Attendere...' : 'Rigenera Coppie'}
              </button>
            )}
          </div>
        )}

        <p className="estrazione-hint">
          L'algoritmo accoppia il giocatore più forte con il più debole (forte+debole) in base a categoria e punti cumulativi.
        </p>

        <div className="pairs-list">
          {pairs.length === 0 ? (
            <p className="empty">Nessuna coppia. {isAdmin && 'Clicca "Genera Coppie" per creare le coppie.'}</p>
          ) : (
            pairs.map((pair, idx) => (
              <div key={pair.id} className="pair-card">
                <span className="pair-number">Coppia {idx + 1}</span>
                <div className="pair-names">
                  {pair.user1_name || pair.nick1 || pair.n1 || '-'} — {pair.user2_name || pair.nick2 || pair.n2 || '-'}
                </div>
                {(pair.user1_category || pair.user2_category) && (
                  <div className="pair-categories">
                    [{pair.user1_category || '-'} + {pair.user2_category || '-'}]
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default EstrazioneCoppie;
