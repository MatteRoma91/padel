import { Outlet } from 'react-router-dom';
import { TournamentProvider } from '../context/TournamentContext';
import { ProtectedRoute } from './ProtectedRoute';

export function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <TournamentProvider>
        <Outlet />
      </TournamentProvider>
    </ProtectedRoute>
  );
}

export function ProtectedLayoutNoTournament() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}

export function AdminLayout() {
  return (
    <ProtectedRoute adminOnly>
      <TournamentProvider>
        <Outlet />
      </TournamentProvider>
    </ProtectedRoute>
  );
}
