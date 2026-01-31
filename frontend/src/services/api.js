const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: { ...getAuthHeaders(), ...options.headers },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Errore nella richiesta');
    }
    return data;
  }

  // Auth
  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { username, password },
      headers: {},
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Players
  async getPlayers() {
    return this.request('/players');
  }

  async getPlayer(id) {
    return this.request(`/players/${id}`);
  }

  async createPlayer(playerData) {
    const formData = new FormData();
    Object.keys(playerData).forEach((key) => {
      if (playerData[key] !== null && playerData[key] !== undefined) {
        if (key === 'avatar' && playerData[key] instanceof File) formData.append('avatar', playerData[key]);
        else formData.append(key, playerData[key]);
      }
    });
    return this.request('/players', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  async updatePlayer(id, playerData) {
    const formData = new FormData();
    Object.keys(playerData).forEach((key) => {
      if (playerData[key] !== null && playerData[key] !== undefined) {
        if (key === 'avatar' && playerData[key] instanceof File) formData.append('avatar', playerData[key]);
        else formData.append(key, playerData[key]);
      }
    });
    return this.request(`/players/${id}`, { method: 'PUT', body: formData, headers: {} });
  }

  async deletePlayer(id) {
    return this.request(`/players/${id}`, { method: 'DELETE' });
  }

  // Users (per admin)
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData) {
    const formData = new FormData();
    Object.keys(userData).forEach((key) => {
      if (userData[key] !== null && userData[key] !== undefined) {
        if (key === 'photo' && userData[key] instanceof File) formData.append('photo', userData[key]);
        else formData.append(key, userData[key]);
      }
    });
    return this.request('/users', { method: 'POST', body: formData, headers: {} });
  }

  async updateUser(id, userData) {
    const formData = new FormData();
    Object.keys(userData).forEach((key) => {
      if (userData[key] !== null && userData[key] !== undefined) {
        if (key === 'photo' && userData[key] instanceof File) formData.append('photo', userData[key]);
        else formData.append(key, userData[key]);
      }
    });
    return this.request(`/users/${id}`, { method: 'PUT', body: formData, headers: {} });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Matches
  async getMatches(tournamentId) {
    const q = tournamentId ? `?tournamentId=${tournamentId}` : '';
    return this.request(`/matches${q}`);
  }

  async updateMatch(id, scores) {
    return this.request(`/matches/${id}`, { method: 'PUT', body: scores });
  }

  // Tournament (legacy - primo torneo)
  async getBracket() {
    return this.request('/tournament/bracket');
  }

  async getTeams() {
    return this.request('/tournament/teams');
  }

  async resetTournament() {
    return this.request('/tournament/reset', { method: 'POST' });
  }

  // Tournaments (multi)
  async getTournaments(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request('/tournaments' + (q ? '?' + q : ''));
  }

  async getTournament(id) {
    return this.request(`/tournaments/${id}`);
  }

  async createTournament(data) {
    return this.request('/tournaments', { method: 'POST', body: data });
  }

  async updateTournament(id, data) {
    return this.request(`/tournaments/${id}`, { method: 'PUT', body: data });
  }

  async getTournamentBracket(id) {
    return this.request(`/tournaments/${id}/bracket`);
  }

  async getTournamentPairs(id) {
    return this.request(`/tournaments/${id}/pairs`);
  }

  async generatePairs(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/pairs/generate`, { method: 'POST' });
  }

  async regeneratePairs(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/pairs/regenerate`, { method: 'POST' });
  }

  async updatePair(tournamentId, pairId, user1_id, user2_id) {
    return this.request(`/tournaments/${tournamentId}/pairs/${pairId}`, {
      method: 'PUT',
      body: { user1_id, user2_id },
    });
  }

  async getArchive(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request('/tournaments/archive' + (q ? '?' + q : ''));
  }

  // Rankings
  async getCumulativeRankings() {
    return this.request('/rankings/cumulative');
  }

  async updateCumulativeRanking(userId, totalPoints) {
    return this.request('/rankings/cumulative', {
      method: 'PUT',
      body: { user_id: userId, total_points: totalPoints },
    });
  }

  async getTournamentRankings(id) {
    return this.request(`/rankings/tournament/${id}`);
  }
}

export default new ApiClient();
