import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Archivio.css';

function Archivio() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTournaments, setAllTournaments] = useState([]);
  const [filters, setFilters] = useState({ year: '', month: '', name: '' });

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    try {
      setLoading(true);
      const data = await api.getArchive({});
      setAllTournaments(data);
    } catch (err) {
      setAllTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('it-IT');
  };

  const years = [...new Set(allTournaments.map((t) => new Date(t.date).getFullYear()))].sort((a, b) => b - a);

  const tournaments = allTournaments.filter((t) => {
    const d = new Date(t.date);
    if (filters.year && d.getFullYear() !== parseInt(filters.year)) return false;
    if (filters.month && d.getMonth() + 1 !== parseInt(filters.month)) return false;
    if (filters.name && !(t.name || '').toLowerCase().includes((filters.name || '').toLowerCase())) return false;
    return true;
  });

  return (
    <div className="archivio-page">
      <div className="container">
        <header className="archivio-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Indietro
          </button>
          <h1>📁 Archivio Tornei</h1>
        </header>

        <div className="archivio-filters">
          <input
            type="text"
            placeholder="Cerca per nome..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="filter-input"
          />
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="filter-select"
          >
            <option value="">Tutti gli anni</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="filter-select"
          >
            <option value="">Tutti i mesi</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('it-IT', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Caricamento...</div>
        ) : (
          <div className="archivio-list">
            {tournaments.length === 0 ? (
              <p className="empty">Nessun torneo nell'archivio</p>
            ) : (
              tournaments.map((t) => (
                <div
                  key={t.id}
                  className="archivio-card"
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                >
                  <div className="arch-name">{t.name}</div>
                  <div className="arch-date">{formatDate(t.date)}</div>
                  <div className="arch-field">{t.field || '-'}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Archivio;
