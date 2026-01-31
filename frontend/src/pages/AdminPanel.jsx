import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import api from '../services/api';
import './AdminPanel.css';

const CATEGORIES = ['A_Gold', 'A_Silver', 'B_Gold', 'B_Silver', 'C'];

function AdminPanel() {
  const navigate = useNavigate();
  const { players, refreshPlayers, refreshBracket } = useTournament();
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    category: 'C',
    avatar: null,
  });
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({ name: '', date: '', time: '', field: '' });

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
      setCreatedCredentials(null);
      const data = await api.createUser({
        name: formData.name,
        nickname: formData.nickname || formData.name,
        role: 'player',
        category: formData.category,
        photo: formData.avatar,
      });
      await refreshPlayers();
      setFormData({ name: '', nickname: '', category: 'C', avatar: null });
      setShowAddForm(false);
      setCreatedCredentials({ username: data.username, password: data.password });
      alert('Utente creato! Credenziali: ' + data.username + ' / ' + data.password);
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      nickname: player.nickname || player.name,
      category: player.category || 'C',
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
      await api.updateUser(editingPlayer.id, {
        name: formData.name,
        nickname: formData.nickname || formData.name,
        category: formData.category,
        photo: formData.avatar,
      });
      await refreshPlayers();
      setEditingPlayer(null);
      setFormData({ name: '', nickname: '', category: 'C', avatar: null });
      setShowAddForm(false);
      alert('Giocatore aggiornato!');
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo giocatore?')) return;

    try {
      setLoading(true);
      await api.deleteUser(id);
      await refreshPlayers();
      alert('Giocatore eliminato!');
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!tournamentForm.name || !tournamentForm.date) {
      alert('Nome e data obbligatori');
      return;
    }
    try {
      setLoading(true);
      await api.createTournament(tournamentForm);
      setTournamentForm({ name: '', date: '', time: '', field: '' });
      setShowTournamentForm(false);
      alert('Torneo creato!');
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTournament = async () => {
    if (!confirm('Sei sicuro? Le partite verranno eliminate.')) return;

    try {
      setResetLoading(true);
      await api.resetTournament();
      await refreshBracket();
      await refreshPlayers();
      alert('Torneo resettato!');
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingPlayer(null);
    setCreatedCredentials(null);
    setFormData({ name: '', nickname: '', category: 'C', avatar: null });
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
            onClick={() => setShowTournamentForm(!showTournamentForm)}
          >
            + Nuovo Torneo
          </button>
          <button
            className="action-button primary"
            onClick={() => {
              setEditingPlayer(null);
              setFormData({ name: '', nickname: '', category: 'C', avatar: null });
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
            {resetLoading ? 'Reset...' : '🔄 Reset Torneo'}
          </button>
        </div>

        {showTournamentForm && (
          <div className="admin-form-container">
            <h2>Nuovo Torneo</h2>
            <form onSubmit={handleCreateTournament}>
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Data *</label>
                <input
                  type="date"
                  value={tournamentForm.date}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ora</label>
                <input
                  type="text"
                  placeholder="18:00"
                  value={tournamentForm.time}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Campo</label>
                <input
                  type="text"
                  placeholder="Campo 1"
                  value={tournamentForm.field}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, field: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={loading}>Crea</button>
                <button type="button" className="cancel-button" onClick={() => setShowTournamentForm(false)}>Annulla</button>
              </div>
            </form>
          </div>
        )}

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
                <label htmlFor="nickname">Nickname</label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  placeholder="Nome visualizzato"
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Categoria</label>
                <select id="category" name="category" value={formData.category} onChange={handleInputChange}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="avatar">Foto</label>
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
              <div>Categoria</div>
              <div>Statistiche</div>
              <div>Azioni</div>
            </div>
            {players.map((player) => (
              <div key={player.id} className="table-row">
                <div className="player-cell">
                  {player.avatar_url && (
                    <img src={player.avatar_url} alt={player.name} className="player-thumb" />
                  )}
                  <span>{player.nickname || player.name}</span>
                </div>
                <div>{player.category || '-'}</div>
                <div>{player.matches_played ?? 0} partite, {player.wins ?? 0}V - {player.losses ?? 0}P</div>
                <div className="actions-cell">
                  <button className="edit-button" onClick={() => handleEditPlayer(player)}>
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
