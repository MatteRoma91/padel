import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedLayout, ProtectedLayoutNoTournament, AdminLayout } from './components/ProtectedLayout';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TournamentBracket from './pages/TournamentBracket';
import TorneiList from './pages/TorneiList';
import TournamentDetail from './pages/TournamentDetail';
import EstrazioneCoppie from './pages/EstrazioneCoppie';
import Calendario from './pages/Calendario';
import Classifiche from './pages/Classifiche';
import Archivio from './pages/Archivio';
import PlayersList from './pages/PlayersList';
import PlayerDetail from './pages/PlayerDetail';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/tournament" element={<TournamentBracket />} />
          <Route path="/tournaments" element={<TorneiList />} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
          <Route path="/tournaments/:id/pairs" element={<EstrazioneCoppie />} />
          <Route path="/players" element={<PlayersList />} />
          <Route path="/calendar" element={<Calendario />} />
          <Route path="/rankings" element={<Classifiche />} />
          <Route path="/archive" element={<Archivio />} />
        </Route>
        <Route element={<ProtectedLayoutNoTournament />}>
          <Route path="/players/:id" element={<PlayerDetail />} />
        </Route>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
