import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import api from '../services/api';
import './AdminPanel.css';

function AdminPanel() {
  const navigate = useNavigate();
  const { players, refreshPlayers, refreshBracket } = useTournament();
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dominant_hand: 'destra',
    skill_level: '',
    avatar: null,
  });
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar') {
      setFormData({ ...formData, avatar: files[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Il nome è obbligatorio');
      return;
    }

    try {
      setLoading(true);
      await api.createPlayer(formData);
      await refreshPlayers();
      setFormData({ name: '', dominant_hand: 'destra', skill_level: '', avatar: null });
      setShowAddForm(false);
      alert('Giocatore aggiunto con successo!');
    } catch (error) {
      alert('Errore nell\'aggiunta del giocatore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      dominant_hand: player.dominant_hand || 'destra',
      skill_level: player.skill_level || '',
      avatar: null,
    });
    setShowAddForm(true);
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Il nome è obbligatorio');
      return;
    }

    try {
      setLoading(true);
      await api.updatePlayer(editingPlayer.id, formData);
      await refreshPlayers();
      setEditingPlayer(null);
      setFormData({ name: '', dominant_hand: 'destra', skill_level: '', avatar: null });
      setShowAddForm(false);
      alert('Giocatore aggiornato con successo!');
    } catch (error) {
      alert('Errore nell\'aggiornamento del giocatore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo giocatore?')) {
      return;
    }

    try {
      setLoading(true);
      await api.deletePlayer(id);
      await refreshPlayers();
      alert('Giocatore eliminato con successo!');
    } catch (error) {
      alert('Errore nell\'eliminazione del giocatore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTournament = async () => {
    if (!confirm('Sei sicuro di voler resettare il torneo? Tutte le partite e statistiche verranno azzerate.')) {
      return;
    }

    try {
      setResetLoading(true);
      await api.resetTournament();
      await refreshBracket();
      await refreshPlayers();
      alert('Torneo resettato con successo!');
    } catch (error) {
      alert('Errore nel reset del torneo: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingPlayer(null);
    setFormData({ name: '', dominant_hand: 'destra', skill_level: '', avatar: null });
  };

  return (
    <div className="admin-page">
      <div className="container">
        <header className="admin-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Indietro
          </button>
          <h1>⚙️ Area Amministratore</h1>
        </header>

        <div className="admin-actions">
          <button
            className="action-button primary"
            onClick={() => {
              setEditingPlayer(null);
              setFormData({ name: '', dominant_hand: 'destra', skill_level: '', avatar: null });
              setShowAddForm(true);
            }}
          >
            + Aggiungi Giocatore
          </button>
          <button
            className="action-button danger"
            onClick={handleResetTournament}
            disabled={resetLoading}
          >
            {resetLoading ? 'Reset in corso...' : '🔄 Reset Torneo'}
          </button>
        </div>

        {showAddForm && (
          <div className="admin-form-container">
            <h2>{editingPlayer ? 'Modifica Giocatore' : 'Aggiungi Nuovo Giocatore'}</h2>
            <form onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer}>
              <div className="form-group">
                <label htmlFor="name">Nome *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dominant_hand">Mano Dominante</label>
                <select
                  id="dominant_hand"
                  name="dominant_hand"
                  value={formData.dominant_hand}
                  onChange={handleInputChange}
                >
                  <option value="destra">Destra</option>
                  <option value="sinistra">Sinistra</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="skill_level">Livello di Gioco</label>
                <input
                  type="text"
                  id="skill_level"
                  name="skill_level"
                  value={formData.skill_level}
                  onChange={handleInputChange}
                  placeholder="es. principiante, intermedio, avanzato"
                />
              </div>

              <div className="form-group">
                <label htmlFor="avatar">Avatar</label>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Salvataggio...' : editingPlayer ? 'Aggiorna' : 'Aggiungi'}
                </button>
                <button type="button" className="cancel-button" onClick={cancelForm}>
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="players-admin-list">
          <h2>Gestione Giocatori</h2>
          <div className="players-table">
            <div className="table-header">
              <div>Nome</div>
              <div>Mano</div>
              <div>Livello</div>
              <div>Azioni</div>
            </div>
            {players.map((player) => (
              <div key={player.id} className="table-row">
                <div className="player-cell">
                  {player.avatar_url && (
                    <img src={player.avatar_url} alt={player.name} className="player-thumb" />
                  )}
                  <span>{player.name}</span>
                </div>
                <div>{player.dominant_hand || '-'}</div>
                <div>{player.skill_level || '-'}</div>
                <div className="actions-cell">
                  <button
                    className="edit-button"
                    onClick={() => handleEditPlayer(player)}
                  >
                    ✏️ Modifica
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeletePlayer(player.id)}
                    disabled={loading}
                  >
                    🗑️ Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
