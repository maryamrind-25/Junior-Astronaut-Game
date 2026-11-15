import { BackendClient } from './backendClient';
import { CadetProfile, Checkpoint, Resources } from './types';

const STORAGE_KEY = 'junior_astronaut_mission_trainer_accounts_v1';
const GUEST_USERNAME = 'Guest_Astronaut';

interface AccountsStore {
  stayLoggedInUser: string;
  users: Record<string, CadetProfile>;
}

function defaultResources(): Resources {
  return {
    oxygen: 100,
    water: 100,
    food: 100,
    power: 100,
    fuel: 100,
    shield: 100,
    suit: 100,
    thermal: 100,
    mass: 100,
    health: 100,
    sproutHealth: 100,
    morale: 100,
    science: 100,
  };
}

export function normalizeProfile(raw: Partial<CadetProfile>): CadetProfile {
  const defaults = createDefaultProfile(
    raw.username ?? 'Cadet',
    Boolean(raw.isGuest)
  );
  const bag = raw.bagItems ?? {};
  const mergedRes: Resources = {
    ...defaults.resources,
    ...(raw.resources ?? {}),
  };

  return {
    ...defaults,
    ...raw,
    bagItems: { ...bag },
    repairKits:
      typeof raw.repairKits === 'number'
        ? raw.repairKits
        : typeof bag.repair === 'number'
          ? bag.repair
          : 1,
    level2Checkpoint: raw.level2Checkpoint ?? 0,
    level2Completed: Boolean(raw.level2Completed),
    level2Stars: raw.level2Stars ?? 0,
    level2History: Array.isArray(raw.level2History) ? raw.level2History : [],
    co2Cartridges:
      typeof raw.co2Cartridges === 'number' ? raw.co2Cartridges : 6,
    level3Step: raw.level3Step ?? 0,
    level3CheckpointPending: raw.level3CheckpointPending ?? 0,
    level3PartStars:
      raw.level3PartStars && typeof raw.level3PartStars === 'object'
        ? { ...raw.level3PartStars }
        : {},
    level3LandingPassed: Boolean(raw.level3LandingPassed),
    level3Completed: Boolean(raw.level3Completed),
    level3Stars: raw.level3Stars ?? 0,
    level3FinaleOrder: Array.isArray(raw.level3FinaleOrder)
      ? raw.level3FinaleOrder
      : [],
    level3History: Array.isArray(raw.level3History) ? raw.level3History : [],
    resources: mergedRes,
  };
}

function loadStore(): AccountsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { stayLoggedInUser: '', users: {} };
    }
    const parsed = JSON.parse(raw) as Partial<AccountsStore>;
    return {
      stayLoggedInUser: parsed.stayLoggedInUser ?? '',
      users: parsed.users ?? {},
    };
  } catch {
    return { stayLoggedInUser: '', users: {} };
  }
}

function saveStore(store: AccountsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function createDefaultProfile(
  username: string,
  isGuest: boolean
): CadetProfile {
  return {
    username,
    isGuest,
    cadetLevel: 1,
    firstTimeLobby: true,
    level1Checkpoint: Checkpoint.LOBBY_INTRO,
    level1Completed: false,
    level1Stars: 0,
    selectedSuit: '',
    suitResult: '',
    bagItems: {},
    bagResult: '',
    launchMethod: '',
    launchResult: '',
    repairKits: 1,
    level2Checkpoint: 0,
    level2Completed: false,
    level2Stars: 0,
    level2History: [],
    co2Cartridges: 6,
    level3Step: 0,
    level3CheckpointPending: 0,
    level3PartStars: {},
    level3LandingPassed: false,
    level3Completed: false,
    level3Stars: 0,
    level3FinaleOrder: [],
    level3History: [],
    resources: defaultResources(),
  };
}

export const SaveManager = {
  hasAutoLogin(): boolean {
    const store = loadStore();
    const u = store.stayLoggedInUser;
    return Boolean(u && store.users[u]);
  },

  getAutoLoginUser(): string {
    return loadStore().stayLoggedInUser;
  },

  clearAutoLogin(): void {
    const store = loadStore();
    store.stayLoggedInUser = '';
    saveStore(store);
  },

  signUp(
    rawUsername: string,
    stayLoggedIn: boolean
  ): { ok: true; profile: CadetProfile } | { ok: false; msg: string } {
    const username = rawUsername.trim();
    if (!username) {
      return { ok: false, msg: 'Please enter a Cadet Username.' };
    }
    if (username.length < 2) {
      return { ok: false, msg: 'Username must be at least 2 characters.' };
    }
    const store = loadStore();
    if (store.users[username]) {
      return { ok: false, msg: 'Username already exists! Please Log In.' };
    }
    const profile = createDefaultProfile(username, false);
    store.users[username] = profile;
    if (stayLoggedIn) {
      store.stayLoggedInUser = username;
    }
    saveStore(store);
    return { ok: true, profile: structuredClone(profile) };
  },

  logIn(
    rawUsername: string,
    stayLoggedIn: boolean
  ): { ok: true; profile: CadetProfile } | { ok: false; msg: string } {
    const username = rawUsername.trim();
    if (!username) {
      return { ok: false, msg: 'Please enter your Cadet Username.' };
    }
    const store = loadStore();
    if (!store.users[username]) {
      return { ok: false, msg: 'Account not found. Please Sign Up first!' };
    }
    if (stayLoggedIn) {
      store.stayLoggedInUser = username;
    } else if (store.stayLoggedInUser === username) {
      store.stayLoggedInUser = '';
    }
    const normalized = normalizeProfile(store.users[username]);
    store.users[username] = normalized;
    saveStore(store);
    return { ok: true, profile: structuredClone(normalized) };
  },

  createOrLoadGuest(): CadetProfile {
    const store = loadStore();
    if (!store.users[GUEST_USERNAME]) {
      store.users[GUEST_USERNAME] = createDefaultProfile(GUEST_USERNAME, true);
      saveStore(store);
    }
    const normalized = normalizeProfile(store.users[GUEST_USERNAME]);
    return structuredClone(normalized);
  },

  saveUserProgress(username: string, profile: CadetProfile): void {
    if (!username) return;
    const store = loadStore();
    store.users[username] = structuredClone(profile);
    saveStore(store);
    void BackendClient.saveProgress(username, profile);
  },

  getUserProfile(username: string): CadetProfile | null {
    const store = loadStore();
    const found = store.users[username];
    return found ? structuredClone(normalizeProfile(found)) : null;
  },
};
