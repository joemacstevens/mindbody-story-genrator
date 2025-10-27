import {
  listUserGyms,
  upsertUserGym,
  removeUserGym as removeUserGymDoc,
  setUserDefaultGym,
  fetchUserRoot,
} from './userData';

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

const normalizeGym = (gym: SavedGym): SavedGym => {
  const radiusValue = Number(gym.radius);
  const safeRadius = Number.isFinite(radiusValue) && radiusValue > 0 ? radiusValue : 5;
  return {
    ...gym,
    radius: safeRadius,
    lastUsedAt: gym.lastUsedAt || new Date().toISOString(),
  };
};

export const loadSavedGymsForUser = async (uid: string): Promise<SavedGymsState> => {
  const [userGyms, root] = await Promise.all([listUserGyms(uid), fetchUserRoot(uid)]);
  const mappedGyms = userGyms.map((gym) => normalizeGym(gym));
  const defaultGymSlug = root?.lastScheduleSlug ?? mappedGyms[0]?.slug ?? null;
  return { gyms: mappedGyms, defaultGymSlug };
};

export const saveGymRecordForUser = async (
  uid: string,
  gym: Omit<SavedGym, 'lastUsedAt'> & { lastUsedAt?: string },
  options: { setAsDefault?: boolean } = {},
): Promise<SavedGymsState> => {
  const now = new Date().toISOString();
  await upsertUserGym(
    uid,
    {
      ...gym,
      lastUsedAt: gym.lastUsedAt ?? now,
      bookmarkedAt: gym.lastUsedAt ?? now,
    },
    { setAsDefault: options.setAsDefault },
  );
  return loadSavedGymsForUser(uid);
};

export const touchSavedGymForUser = async (uid: string, slug: string): Promise<SavedGymsState> => {
  const state = await loadSavedGymsForUser(uid);
  const target = state.gyms.find((gym) => gym.slug === slug);
  if (!target) {
    return state;
  }
  await upsertUserGym(uid, { ...target, lastUsedAt: new Date().toISOString() });
  return loadSavedGymsForUser(uid);
};

export const removeSavedGymForUser = async (uid: string, slug: string): Promise<SavedGymsState> => {
  await removeUserGymDoc(uid, slug);
  return loadSavedGymsForUser(uid);
};

export const setDefaultGymForUser = async (
  uid: string,
  slug: string | null,
): Promise<SavedGymsState> => {
  await setUserDefaultGym(uid, slug);
  return loadSavedGymsForUser(uid);
};
