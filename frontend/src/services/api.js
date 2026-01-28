const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Client API per comunicare con il backend
 */
class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore nella richiesta');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
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
    Object.keys(playerData).forEach(key => {
      if (playerData[key] !== null && playerData[key] !== undefined) {
        if (key === 'avatar' && playerData[key] instanceof File) {
          formData.append('avatar', playerData[key]);
        } else {
          formData.append(key, playerData[key]);
        }
      }
    });
    
    return this.request('/players', {
      method: 'POST',
      body: formData,
      headers: {}, // Rimuove Content-Type per FormData
    });
  }

  async updatePlayer(id, playerData) {
    const formData = new FormData();
    Object.keys(playerData).forEach(key => {
      if (playerData[key] !== null && playerData[key] !== undefined) {
        if (key === 'avatar' && playerData[key] instanceof File) {
          formData.append('avatar', playerData[key]);
        } else {
          formData.append(key, playerData[key]);
        }
      }
    });
    
    return this.request(`/players/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {},
    });
  }

  async deletePlayer(id) {
    return this.request(`/players/${id}`, { method: 'DELETE' });
  }

  // Matches
  async getMatches() {
    return this.request('/matches');
  }

  async updateMatch(id, scores) {
    return this.request(`/matches/${id}`, {
      method: 'PUT',
      body: scores,
    });
  }

  // Tournament
  async getBracket() {
    return this.request('/tournament/bracket');
  }

  async getTeams() {
    return this.request('/tournament/teams');
  }

  async resetTournament() {
    return this.request('/tournament/reset', { method: 'POST' });
  }
}

export default new ApiClient();
