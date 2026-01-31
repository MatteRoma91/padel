import { useState } from 'react';
import api from '../services/api';
import './MatchCard.css';

function MatchCard({ match, onUpdate }) {
  const [team1Score, setTeam1Score] = useState(match.team1_score || '');
  const [team2Score, setTeam2Score] = useState(match.team2_score || '');
  const [loading, setLoading] = useState(false);

  const handleScoreUpdate = async () => {
    if (!team1Score || !team2Score) {
      alert('Inserisci entrambi i punteggi');
      return;
    }

    try {
      setLoading(true);
      await api.updateMatch(match.id, {
        team1_score: team1Score,
        team2_score: team2Score,
      });

      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      alert('Errore nell\'aggiornamento punteggio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isWinner = (teamId) => match.winner_id === teamId;
  const isLoser = (teamId) => match.winner_id && match.winner_id !== teamId;

  const getTeam1Name = () => {
    if (match.team1_name) return match.team1_name;
    if (match.team1_player1_name && match.team1_player2_name) {
      return `${match.team1_player1_name}-${match.team1_player2_name}`;
    }
    return 'TBD';
  };

  const getTeam2Name = () => {
    if (match.team2_name) return match.team2_name;
    if (match.team2_player1_name && match.team2_player2_name) {
      return `${match.team2_player1_name}-${match.team2_player2_name}`;
    }
    return 'TBD';
  };

  return (
    <div className={`match-card ${match.winner_id ? 'completed' : ''}`}>
      <div className="match-header">
        <span className="match-type">{match.match_type}</span>
        {match.winner_id && <span className="match-status">✓ Completata</span>}
      </div>

      <div className="match-teams">
        <div className={`team ${isWinner(match.team1_id) ? 'winner' : ''} ${isLoser(match.team1_id) ? 'loser' : ''}`}>
          <div className="team-name">{getTeam1Name()}</div>
          {match.phase === 'quarters' && match.team1_player1_name && match.team1_player2_name && (
            <div className="team-players">
              <span>{match.team1_player1_name} - {match.team1_player2_name}</span>
            </div>
          )}
        </div>

        <div className="vs">VS</div>

        <div className={`team ${isWinner(match.team2_id) ? 'winner' : ''} ${isLoser(match.team2_id) ? 'loser' : ''}`}>
          <div className="team-name">{getTeam2Name()}</div>
          {match.phase === 'quarters' && match.team2_player1_name && match.team2_player2_name && (
            <div className="team-players">
              <span>{match.team2_player1_name} - {match.team2_player2_name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="match-scores">
        <input
          type="text"
          className="score-input"
          placeholder="6-4, 6-3"
          value={team1Score}
          onChange={(e) => setTeam1Score(e.target.value)}
          disabled={loading || !!match.winner_id}
          autoComplete="off"
        />
        <span className="score-separator">-</span>
        <input
          type="text"
          className="score-input"
          placeholder="4-6, 3-6"
          value={team2Score}
          onChange={(e) => setTeam2Score(e.target.value)}
          disabled={loading || !!match.winner_id}
          autoComplete="off"
        />
      </div>

      {!match.winner_id && (
        <button
          className="update-score-button"
          onClick={handleScoreUpdate}
          disabled={loading || !team1Score || !team2Score}
        >
          {loading ? 'Salvataggio...' : 'Salva Punteggio'}
        </button>
      )}

      {match.winner_id && match.winner_name && (
        <div className="match-winner">
          🏆 Vincitore: {match.winner_name}
        </div>
      )}
    </div>
  );
}

export default MatchCard;
