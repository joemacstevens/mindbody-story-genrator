// IMPORTANT: Replace with your actual Unsplash Access Key.
// You can get one from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = 'EOGLE2scNH_8Yhg-mWNvZbR3Nf2HYO8gcdDrD5FtSbA';

const API_URL = 'https://api.unsplash.com';

export interface UnsplashPhoto {
  id: string;
  alt_description?: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

export interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

export interface UnsplashSearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  orderBy?: 'relevant' | 'latest';
}

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'undefined') return;
    query.set(key, String(value));
  });
  return query.toString();
};

export const searchUnsplashPhotos = async (
  params: string | UnsplashSearchParams,
): Promise<UnsplashSearchResponse> => {
  const normalized: UnsplashSearchParams =
    typeof params === 'string' ? { query: params } : params;

  if (!normalized.query.trim()) {
    return { results: [], total: 0, total_pages: 0 };
  }

  const {
    query,
    page = 1,
    perPage = 12,
    orientation = 'portrait',
    orderBy = 'relevant',
  } = normalized;

  const queryString = buildQueryString({
    query,
    page,
    per_page: perPage,
    orientation,
    order_by: orderBy,
  });

  const response = await fetch(`${API_URL}/search/photos?${queryString}`, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash API error (${response.status}): ${response.statusText}`);
  }

  return response.json();
};
