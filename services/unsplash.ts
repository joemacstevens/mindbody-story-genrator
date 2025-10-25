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

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

export const searchUnsplashPhotos = async (query: string): Promise<UnsplashSearchResponse> => {
  if (!query.trim()) {
    return { results: [], total: 0, total_pages: 0 };
  }
  
  // FIX: Removed the check for a placeholder API key, as the actual key is already provided.
  // This resolves a TypeScript error about comparing two literals with no overlap.

  const response = await fetch(
    `${API_URL}/search/photos?query=${encodeURIComponent(query)}&orientation=portrait&per_page=30`,
    {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Unsplash API error (${response.status}): ${response.statusText}`);
  }

  return response.json();
};