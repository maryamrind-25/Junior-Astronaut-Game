import { CadetProfile } from './types';

const TOKEN_STORAGE_KEY = 'junior_astronaut_backend_token_v1';

export interface BackendMissionData {
  source?: string;
  level1_prep_and_launch?: {
    geomagneticStormIndex?: number;
    weatherStatus?: string;
  };
  level2_transit?: {
    solarFlareClass?: string;
    radiationAlert?: boolean;
  };
  level3_mars?: {
    landingZone?: string;
    coordinates?: string;
    surfaceTempCelsius?: number;
    windSpeedMs?: number;
    latestSol?: number;
  };
}

export const BackendClient = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore storage errors
    }
  },

  async syncAuth(
    mode: 'signup' | 'login',
    username: string
  ): Promise<void> {
    try {
      const endpoint =
        mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: `cadet_${username.toLowerCase()}`,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { token?: string };
        if (data.token) {
          this.setToken(data.token);
        }
      }
    } catch {
      // non-fatal: localStorage remains active
    }
  },

  async saveProgress(username: string, profile: CadetProfile): Promise<void> {
    if (!username) return;
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, progress: profile }),
      });
    } catch {
      // non-fatal background sync
    }
  },

  async loadProgress(username: string): Promise<CadetProfile | null> {
    if (!username) return null;
    try {
      const res = await fetch(
        `/api/progress/${encodeURIComponent(username)}`
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { progress?: CadetProfile | null };
      return data.progress ?? null;
    } catch {
      return null;
    }
  },

  async fetchMissionData(): Promise<BackendMissionData | null> {
    try {
      const res = await fetch('/api/mission-data');
      if (!res.ok) return null;
      return (await res.json()) as BackendMissionData;
    } catch {
      return null;
    }
  },
};
