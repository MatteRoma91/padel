import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import TournamentBracket from './pages/TournamentBracket';
import PlayersList from './pages/PlayersList';
import PlayerDetail from './pages/PlayerDetail';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <TournamentProvider>
      <Router>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/tournament" element={<TournamentBracket />} />
          <Route path="/players" element={<PlayersList />} />
          <Route path="/players/:id" element={<PlayerDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
    </TournamentProvider>
  );
}

export default App;
