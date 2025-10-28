import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type {
  AppSettings,
  Schedule,
  Style,
  TemplateId,
  ScheduleElementId,
  ScheduleElementStyle,
} from '../types';
import { DEFAULT_APP_SETTINGS } from '../constants';
import type { SavedGym } from './savedGyms';

type UserPreferences = {
  defaultPaletteId?: string | null;
  defaultTimezone?: string | null;
  shareHintsDismissed?: boolean;
};

export type UserRootDocument = {
  profile: {
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    lastActiveAt?: Timestamp;
  };
  activeTemplateId: TemplateId;
  lastScheduleSlug?: string | null;
  preferences?: UserPreferences;
  storage?: {
    logoPath?: string | null;
    backgroundPath?: string | null;
  };
  migrations?: Record<string, boolean>;
};

export type UserTemplateDocument = {
  style: Style;
  visibleElements?: ScheduleElementId[];
  hiddenElements?: ScheduleElementId[];
  elementOrder?: ScheduleElementId[];
  elementStyles?: Record<ScheduleElementId, ScheduleElementStyle>;
  gymSlug?: string | null;
  clientUpdatedAt?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type EditorTemplatePayload = {
  style: Style;
  visibleElements: ScheduleElementId[];
  hiddenElements: ScheduleElementId[];
  elementOrder?: ScheduleElementId[];
  elementStyles: Record<ScheduleElementId, ScheduleElementStyle>;
  gymSlug?: string | null;
  clientUpdatedAt?: string;
};

export type UserScheduleDocument = {
  schedule: Schedule;
  updatedAt?: Timestamp;
  lastRequestedDate?: string;
  mindbodyMeta?: {
    locationSlug?: string;
    radius?: number;
    timezone?: string;
  };
};

export type UserGymDocument = SavedGym & {
  bookmarkedAt: string;
  lastFetchedScheduleAt?: string | null;
};

const usersCollection = collection(firestore, 'users');

const userDocRef = (uid: string) => doc(usersCollection, uid);

const userTemplatesCollection = (uid: string) =>
  collection(firestore, 'users', uid, 'templates');

const userTemplateDoc = (uid: string, templateId: TemplateId) =>
  doc(userTemplatesCollection(uid), templateId);

const userGymsCollection = (uid: string) =>
  collection(firestore, 'users', uid, 'gyms');

const userGymDoc = (uid: string, slug: string) =>
  doc(userGymsCollection(uid), slug);

const userSchedulesCollection = (uid: string) =>
  collection(firestore, 'users', uid, 'schedules');

const userScheduleDoc = (uid: string, slug: string) =>
  doc(userSchedulesCollection(uid), slug);

const nowIso = () => new Date().toISOString();

export const ensureUserDocument = async (
  uid: string,
  profileOverrides: Partial<UserRootDocument['profile']> = {},
): Promise<UserRootDocument> => {
  const ref = userDocRef(uid);
  const snapshot = await getDoc(ref);
  const baseProfile = {
    email: profileOverrides.email ?? null,
    displayName: profileOverrides.displayName ?? null,
    photoURL: profileOverrides.photoURL ?? null,
  };

  if (!snapshot.exists()) {
    const docData: UserRootDocument = {
      profile: {
        ...baseProfile,
        createdAt: serverTimestamp() as unknown as Timestamp,
        updatedAt: serverTimestamp() as unknown as Timestamp,
        lastActiveAt: serverTimestamp() as unknown as Timestamp,
      },
      activeTemplateId: DEFAULT_APP_SETTINGS.activeTemplateId,
      lastScheduleSlug: null,
      preferences: {},
      storage: {},
      migrations: {},
    };
    await setDoc(ref, docData);
    return docData;
  }

  const current = snapshot.data() as UserRootDocument;
  await updateDoc(ref, {
    'profile.displayName': baseProfile.displayName ?? current.profile.displayName ?? null,
    'profile.email': baseProfile.email ?? current.profile.email ?? null,
    'profile.photoURL': baseProfile.photoURL ?? current.profile.photoURL ?? null,
    'profile.updatedAt': serverTimestamp(),
    'profile.lastActiveAt': serverTimestamp(),
  });
  return {
    ...current,
    profile: {
      ...current.profile,
      ...baseProfile,
    },
  };
};

export const fetchUserRoot = async (uid: string): Promise<UserRootDocument | null> => {
  const snapshot = await getDoc(userDocRef(uid));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as UserRootDocument;
};

export const saveUserRoot = async (
  uid: string,
  data: Partial<UserRootDocument>,
): Promise<void> => {
  const ref = userDocRef(uid);
  await setDoc(
    ref,
    {
      ...data,
      profile: {
        ...(data.profile || {}),
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      },
    },
    { merge: true },
  );
};

export const fetchTemplateStyles = async (
  uid: string,
): Promise<Record<TemplateId, Style>> => {
  const snapshot = await getDocs(userTemplatesCollection(uid));
  const result: Record<TemplateId, Style> = {};
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as UserTemplateDocument;
    if (data?.style) {
      result[docSnap.id as TemplateId] = data.style;
    }
  });
  return result;
};

export const saveTemplateStyle = async (
  uid: string,
  templateId: TemplateId,
  style: Style,
): Promise<void> => {
  await setDoc(
    userTemplateDoc(uid, templateId),
    {
      style,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const saveEditorTemplate = async (
  uid: string,
  templateId: TemplateId,
  payload: EditorTemplatePayload,
): Promise<void> => {
  const ref = userTemplateDoc(uid, templateId);
  const snapshot = await getDoc(ref);
  const baseFields = snapshot.exists()
    ? {}
    : { createdAt: serverTimestamp() as unknown as Timestamp };

  await setDoc(
    ref,
    {
      ...baseFields,
      style: payload.style,
      visibleElements: payload.visibleElements,
      hiddenElements: payload.hiddenElements,
      elementOrder: payload.elementOrder ?? payload.visibleElements,
      elementStyles: payload.elementStyles,
      gymSlug: payload.gymSlug ?? null,
      clientUpdatedAt: payload.clientUpdatedAt ?? nowIso(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await updateDoc(userDocRef(uid), {
    activeTemplateId: templateId,
    'profile.lastActiveAt': serverTimestamp(),
  });
};

export const deleteTemplateStyle = async (uid: string, templateId: TemplateId): Promise<void> => {
  await deleteDoc(userTemplateDoc(uid, templateId));
};

export const fetchUserSettings = async (uid: string): Promise<AppSettings | null> => {
  const root = await fetchUserRoot(uid);
  if (!root) {
    return null;
  }
  const templateStyles = await fetchTemplateStyles(uid);
  const mergedConfigs = {
    ...DEFAULT_APP_SETTINGS.configs,
    ...templateStyles,
  };
  return {
    activeTemplateId: root.activeTemplateId || DEFAULT_APP_SETTINGS.activeTemplateId,
    configs: mergedConfigs,
  };
};

export const saveUserSettings = async (uid: string, settings: AppSettings): Promise<void> => {
  const batch = writeBatch(firestore);
  batch.set(
    userDocRef(uid),
    {
      activeTemplateId: settings.activeTemplateId,
      profile: {
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      },
    },
    { merge: true },
  );

  Object.entries(settings.configs).forEach(([templateId, style]) => {
    batch.set(
      userTemplateDoc(uid, templateId as TemplateId),
      {
        style,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
};

const normalizeGymDocument = (gym: UserGymDocument): UserGymDocument => ({
  ...gym,
  radius: Number(gym.radius) || 5,
  bookmarkedAt: gym.bookmarkedAt || nowIso(),
  lastUsedAt: gym.lastUsedAt || nowIso(),
});

export const listUserGyms = async (uid: string): Promise<UserGymDocument[]> => {
  const snapshot = await getDocs(userGymsCollection(uid));
  const gyms: UserGymDocument[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as UserGymDocument | undefined;
    if (data) {
      gyms.push(normalizeGymDocument({ ...data, slug: docSnap.id }));
    }
  });
  return gyms.sort(
    (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime(),
  );
};

export const upsertUserGym = async (
  uid: string,
  gym: Omit<UserGymDocument, 'bookmarkedAt'> & { bookmarkedAt?: string },
  options: { setAsDefault?: boolean } = {},
): Promise<void> => {
  const now = nowIso();
  const payload: UserGymDocument = normalizeGymDocument({
    ...gym,
    bookmarkedAt: gym.bookmarkedAt || now,
    lastUsedAt: now,
  });
  await setDoc(userGymDoc(uid, payload.slug), payload, { merge: true });
  if (options.setAsDefault) {
    await updateDoc(userDocRef(uid), {
      lastScheduleSlug: payload.slug,
      'profile.lastActiveAt': serverTimestamp(),
    });
  }
};

export const removeUserGym = async (uid: string, slug: string): Promise<void> => {
  await deleteDoc(userGymDoc(uid, slug));
};

export const setUserDefaultGym = async (uid: string, slug: string | null): Promise<void> => {
  await updateDoc(userDocRef(uid), {
    lastScheduleSlug: slug ?? null,
    'profile.lastActiveAt': serverTimestamp(),
  });
};

export const fetchUserSchedule = async (
  uid: string,
  slug: string,
): Promise<UserScheduleDocument | null> => {
  const snapshot = await getDoc(userScheduleDoc(uid, slug));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as UserScheduleDocument;
};

export const saveUserSchedule = async (
  uid: string,
  slug: string,
  schedule: Schedule,
  options: {
    lastRequestedDate?: string;
    mindbodyMeta?: UserScheduleDocument['mindbodyMeta'];
  } = {},
): Promise<void> => {
  await setDoc(
    userScheduleDoc(uid, slug),
    {
      schedule,
      updatedAt: serverTimestamp(),
      lastRequestedDate: options.lastRequestedDate ?? null,
      mindbodyMeta: options.mindbodyMeta ?? null,
    },
    { merge: true },
  );
  await updateDoc(userDocRef(uid), {
    lastScheduleSlug: slug,
    'profile.lastActiveAt': serverTimestamp(),
  });
};

export const deleteUserSchedule = async (uid: string, slug: string): Promise<void> => {
  await deleteDoc(userScheduleDoc(uid, slug));
};
