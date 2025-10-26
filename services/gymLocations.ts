import {
  collection,
  endAt,
  getDocs,
  limit as limitDocs,
  orderBy,
  query,
  startAt,
} from 'firebase/firestore';
import type { GymLocation } from '../types';
import { isGymLocation } from '../types';
import { firestore } from './firebase';
import { slugifyLocation } from '../utils/slugify';

const GYM_LOCATIONS_COLLECTION = 'gym_locations';
const DEFAULT_RESULT_LIMIT = 8;

type SearchGymOptions = {
  limit?: number;
};

export const searchGymLocations = async (
  searchTerm: string,
  options: SearchGymOptions = {},
): Promise<GymLocation[]> => {
  const normalizedSlug = slugifyLocation(searchTerm);
  if (!normalizedSlug) {
    return [];
  }

  const maxResults = options.limit ?? DEFAULT_RESULT_LIMIT;
  const locationsRef = collection(firestore, GYM_LOCATIONS_COLLECTION);
  const locationsQuery = query(
    locationsRef,
    orderBy('slug'),
    startAt(normalizedSlug),
    endAt(`${normalizedSlug}\uf8ff`),
    limitDocs(maxResults),
  );

  const snapshot = await getDocs(locationsQuery);
  const gyms: GymLocation[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (isGymLocation(data)) {
      gyms.push(data);
    }
  });

  return gyms;
};
