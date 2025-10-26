import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Schedule, ScheduleItem } from '../types';

type MindbodyEntity = {
  id: string;
  type: string;
  attributes?: Record<string, any>;
};

type MindbodyRelationships = {
  course?: { data?: { id: string } | null };
  staff?: { data?: { id: string } | null };
};

type MindbodyClassTime = {
  id: string;
  type: string;
  attributes?: {
    startTime?: string;
    endTime?: string;
  } & Record<string, any>;
  relationships?: MindbodyRelationships;
};

type MindbodyResponse = {
  data?: MindbodyClassTime[];
  included?: MindbodyEntity[];
  meta?: Record<string, any>;
};

type HandlerBody = {
  gymName?: string;
  locationSlug?: string;
  date?: string;
  radius?: number;
  timezone?: string;
};

const slugifyLocation = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const humanizeDate = (isoDate: string, locale = 'en-US') => {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const MINDBODY_URL = process.env.MINDBODY_CLASS_SEARCH_URL;
const MINDBODY_USE_SAMPLE = process.env.MINDBODY_USE_SAMPLE === 'true';

const SAMPLE_PATH = path.resolve(process.cwd(), 'mindbody/response');

const formatTimeLabel = (isoString: string, timeZone: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
};

const buildRange = (date: string) => {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

const buildRequestPayload = (slug: string, date: string, radius: number) => {
  const range = buildRange(date);
  return {
    sort: 'start_time',
    page: { size: 100, number: 1 },
    filter: {
      radius,
      startTimeRanges: [range],
      locationSlugs: [slug],
      include_dynamic_pricing: true,
      inventory_source: ['MB'],
    },
  };
};

const loadSampleResponse = async (): Promise<MindbodyResponse> => {
  const raw = await fs.readFile(SAMPLE_PATH, 'utf-8');
  return JSON.parse(raw);
};

const fetchMindbody = async (payload: any): Promise<MindbodyResponse> => {
  if (!MINDBODY_URL) {
    throw new Error('MINDBODY_CLASS_SEARCH_URL environment variable is not defined.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(MINDBODY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(
      `Mindbody request failed (${response.status}) ${response.statusText}: ${errorPayload}`,
    );
  }

  return response.json();
};

const toSchedule = (
  raw: MindbodyResponse,
  date: string,
  timeZone: string,
): { schedule: Schedule; count: number } => {
  const includedLookup = new Map<string, MindbodyEntity>();
  raw.included?.forEach((entity) => {
    includedLookup.set(`${entity.type}:${entity.id}`, entity);
  });

  const parsedItems =
    raw.data
      ?.filter((entry) => entry.attributes?.startTime)
      .map((entry) => {
        const start = entry.attributes?.startTime as string;
        const timeLabel = formatTimeLabel(start, timeZone);

        const courseId = entry.relationships?.course?.data?.id;
        const staffId = entry.relationships?.staff?.data?.id;

        const courseName =
          (courseId && includedLookup.get(`course:${courseId}`)?.attributes?.name) ||
          'Scheduled Class';
        const coachName =
          (staffId && includedLookup.get(`staff:${staffId}`)?.attributes?.name) ||
          'Coach TBA';

        return {
          start,
          item: {
            time: timeLabel,
            class: courseName,
            coach: coachName,
          } as ScheduleItem,
        };
      }) || [];

  const items: ScheduleItem[] = parsedItems
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map((entry) => entry.item);

  const range = buildRange(date);
  const schedule: Schedule = {
    date: humanizeDate(range.from) || new Date(range.from).toDateString(),
    items,
  };

  return { schedule, count: items.length };
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { gymName = '', locationSlug, date, radius = 1, timezone = 'America/New_York' } =
    (req.body as HandlerBody) || {};

  if (!date) {
    return res.status(400).json({ error: 'A date (YYYY-MM-DD) is required.' });
  }

  const slug = (locationSlug || slugifyLocation(gymName)).trim();
  if (!slug) {
    return res
      .status(400)
      .json({ error: 'Provide a gymName or locationSlug to build the Mindbody request.' });
  }

  const numericRadius = Number(radius) > 0 ? Number(radius) : 1;
  const payload = buildRequestPayload(slug, date, numericRadius);

  let rawResponse: MindbodyResponse | null = null;
  let source: 'live' | 'sample' = 'live';

  try {
    if (MINDBODY_USE_SAMPLE || !MINDBODY_URL) {
      rawResponse = await loadSampleResponse();
      source = 'sample';
    } else {
      rawResponse = await fetchMindbody(payload);
    }
  } catch (error) {
    console.error('Mindbody fetch failed. Falling back to sample file if available.', error);
    try {
      rawResponse = await loadSampleResponse();
      source = 'sample';
    } catch (sampleError) {
      console.error('Sample fallback failed.', sampleError);
      return res.status(502).json({
        error: 'Unable to fetch schedule data from Mindbody and no fallback data is available.',
      });
    }
  }

  const { schedule, count } = toSchedule(rawResponse ?? {}, date, timezone);

  return res.status(200).json({
    schedule,
    slug,
    count,
    source,
    raw:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            meta: rawResponse?.meta,
            preview: rawResponse?.data?.slice(0, 3),
            payload,
          },
  });
};

export default handler;
