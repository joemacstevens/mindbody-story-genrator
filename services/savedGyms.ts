import { slugifyLocation } from '../utils/slugify';

export type SavedGym = {
  name: string;
  slug: string;
  radius: number;
  lastUsedAt: string;
};

export type SavedGymsState = {
  gyms: SavedGym[];
  defaultGymSlug: string | null;
};

const STORAGE_KEY = 'savedGymsState:v1';

const emptyState: SavedGymsState = { gyms: [], defaultGymSlug: null };

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const normalizeGym = (gym: SavedGym): SavedGym => {
  const radiusValue = Number((gym as any).radius);
  const safeRadius = Number.isFinite(radiusValue) && radiusValue > 0 ? radiusValue : 5;
  return {
    ...gym,
    slug: gym.slug || slugifyLocation(gym.name),
    radius: safeRadius,
    lastUsedAt: gym.lastUsedAt || new Date().toISOString(),
  };
};

const readState = (): SavedGymsState => {
  if (!isBrowser()) {
    return emptyState;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return emptyState;
    }
    const gymsArray: any[] = Array.isArray(parsed.gyms) ? parsed.gyms : [];
    const gyms: SavedGym[] = gymsArray
      .map((gym) => normalizeGym(gym))
      .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
    const defaultGymSlug = typeof parsed.defaultGymSlug === 'string' ? parsed.defaultGymSlug : null;
    return { gyms, defaultGymSlug };
  } catch (error) {
    console.error('Failed to read saved gyms from localStorage:', error);
    return emptyState;
  }
};

const persistState = (state: SavedGymsState): SavedGymsState => {
  if (!isBrowser()) {
    return state;
  }
  const payload: SavedGymsState = {
    gyms: state.gyms.map((gym) => normalizeGym(gym)),
    defaultGymSlug: state.defaultGymSlug,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist saved gyms to localStorage:', error);
  }
  return payload;
};

export const loadSavedGyms = (): SavedGymsState => readState();

export const saveGymRecord = (
  gym: Omit<SavedGym, 'lastUsedAt'> & { lastUsedAt?: string },
  options: { setAsDefault?: boolean } = {},
): SavedGymsState => {
  const state = readState();
  const existingIndex = state.gyms.findIndex((item) => item.slug === gym.slug);
  const now = new Date().toISOString();
  const nextGym = normalizeGym({ ...gym, lastUsedAt: gym.lastUsedAt || now });
  let gyms: SavedGym[];

  if (existingIndex >= 0) {
    gyms = [...state.gyms];
    gyms[existingIndex] = { ...state.gyms[existingIndex], ...nextGym, lastUsedAt: now };
  } else {
    gyms = [...state.gyms, nextGym];
  }

  gyms.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());

  const defaultGymSlug = options.setAsDefault ? nextGym.slug : state.defaultGymSlug ?? nextGym.slug;

  return persistState({ gyms, defaultGymSlug });
};

export const touchSavedGym = (slug: string): SavedGymsState => {
  const state = readState();
  const gym = state.gyms.find((item) => item.slug === slug);
  if (!gym) {
    return state;
  }
  const updatedGym: SavedGym = { ...gym, lastUsedAt: new Date().toISOString() };
  const gyms = state.gyms
    .map((item) => (item.slug === slug ? updatedGym : item))
    .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
  return persistState({ gyms, defaultGymSlug: state.defaultGymSlug });
};

export const removeSavedGym = (slug: string): SavedGymsState => {
  const state = readState();
  const gyms = state.gyms.filter((item) => item.slug !== slug);
  const defaultGymSlug = state.defaultGymSlug === slug ? (gyms[0]?.slug ?? null) : state.defaultGymSlug;
  return persistState({ gyms, defaultGymSlug });
};

export const setDefaultGym = (slug: string | null): SavedGymsState => {
  const state = readState();
  if (slug && !state.gyms.some((gym) => gym.slug === slug)) {
    return state;
  }
  return persistState({ gyms: state.gyms, defaultGymSlug: slug });
};

