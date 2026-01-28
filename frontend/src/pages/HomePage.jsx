import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <h1>🟡 Banana Padel Tour</h1>
        </header>

        <nav className="home-menu">
          <button
            className="menu-item"
            onClick={() => navigate('/tournament')}
            aria-label="D&D Padel Slam"
          >
            <span className="menu-icon">🏆</span>
            <span className="menu-label">D&D Padel Slam</span>
          </button>

          <button
            className="menu-item"
            onClick={() => navigate('/players')}
            aria-label="Giocatori"
          >
            <span className="menu-icon">👥</span>
            <span className="menu-label">Giocatori</span>
          </button>

          <button
            className="menu-item"
            onClick={() => navigate('/admin')}
            aria-label="Amministratore"
          >
            <span className="menu-icon">⚙️</span>
            <span className="menu-label">Amministratore</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default HomePage;
