import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';

function WelcomePage() {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/login');
  };

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1 className="welcome-title">🟡 Banana Padel Tour</h1>
        <p className="welcome-subtitle">
          Gestisci il tuo torneo di padel in modo semplice e intuitivo
        </p>
        <button className="welcome-button" onClick={handleEnter}>
          Entra
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;
