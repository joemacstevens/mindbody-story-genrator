import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoryRenderer from '../components/StoryRenderer';
import { DEFAULT_APP_SETTINGS, MOCK_SCHEDULE } from '../constants';
import type { Schedule } from '../types';
import { saveSchedule } from '../services/api';
import { slugifyLocation, humanizeDate } from '../utils/slugify';

const PREVIEW_TEMPLATE_ID = DEFAULT_APP_SETTINGS.activeTemplateId;
const PREVIEW_STYLE = DEFAULT_APP_SETTINGS.configs[PREVIEW_TEMPLATE_ID];

type FetchState = 'idle' | 'loading' | 'success' | 'error';

const formatIsoRange = (date: string) => {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

const buildMockSchedule = (isoDate: string): Schedule => ({
  ...MOCK_SCHEDULE,
  date: humanizeDate(isoDate) || MOCK_SCHEDULE.date,
});

const GymFinderPage: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [gymName, setGymName] = useState('');
  const [date, setDate] = useState(today);
  const [radius, setRadius] = useState('5');
  const [status, setStatus] = useState<FetchState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [resultMeta, setResultMeta] = useState<{ slug: string; source: 'live' | 'sample'; count: number } | null>(null);

  const slug = useMemo(() => slugifyLocation(gymName), [gymName]);
  const scheduleEndpoint =
    (import.meta.env.VITE_SCHEDULE_ENDPOINT as string | undefined) || '/api/schedule';

  const requestPreview = useMemo(() => {
    const range = formatIsoRange(date);
    return {
      sort: 'start_time',
      page: { size: 100, number: 1 },
      filter: {
        radius: Number(radius) || 1,
        startTimeRanges: [range],
        locationSlugs: slug ? [slug] : [],
        include_dynamic_pricing: true,
        inventory_source: ['MB'],
      },
    };
  }, [date, radius, slug]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slug) {
      setErrorMessage('Enter a gym name to generate the Mindbody slug.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setResultMeta(null);
    const payload = {
      gymName,
      locationSlug: slug,
      date,
      radius: Number(radius) || 1,
    };

    try {
      const response = await fetch(scheduleEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const nextSchedule: Schedule | null = data?.schedule ?? null;

      if (!nextSchedule) {
        throw new Error('Schedule payload missing from response.');
      }

      setSchedule(nextSchedule);
      setRawResponse(data?.raw ?? null);
      setStatus('success');
      if (data?.slug && data?.source) {
        setResultMeta({
          slug: data.slug,
          source: data.source,
          count: data?.count ?? nextSchedule.items.length,
        });
      }
    } catch (error) {
      console.error('Mindbody fetch failed:', error);
      setSchedule(buildMockSchedule(date));
      setRawResponse(null);
      setStatus('error');
      setResultMeta(null);
      setErrorMessage(
        'Could not reach the schedule service yet. Showing a placeholder schedule so you can test the flow.',
      );
    }
  };

  const handleApplyToEditor = () => {
    if (!schedule) return;
    saveSchedule(schedule);
    navigate('/');
  };

  const statusLabel: Record<FetchState, string> = {
    idle: 'Awaiting search',
    loading: 'Contacting Mindbody...',
    success: 'Schedule ready',
    error: 'Using placeholder data',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-900/60 bg-gray-900/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Mindbody onboarding</p>
            <h1 className="text-2xl font-bold mt-1">Find Your Gym Schedule</h1>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 hover:border-indigo-500 hover:text-white transition-colors"
          >
            ← Back to Editor
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <section className="flex-1 rounded-2xl border border-gray-900 bg-gray-900/60 p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-lg font-semibold">{statusLabel[status]}</p>
              </div>
              {resultMeta && (
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    resultMeta.source === 'live'
                      ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/30'
                      : 'bg-amber-500/10 text-amber-200 border border-amber-400/30'
                  }`}
                >
                  {resultMeta.source === 'live' ? 'Live data' : 'Sample data'}
                </span>
              )}
              {errorMessage && (
                <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full">
                  Attention
                </span>
              )}
            </div>

            {resultMeta && (
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <div>
                  <p className="uppercase text-xs tracking-wide text-gray-500">Slug used</p>
                  <p className="font-semibold text-gray-200">{resultMeta.slug}</p>
                </div>
                <div>
                  <p className="uppercase text-xs tracking-wide text-gray-500">Classes found</p>
                  <p className="font-semibold text-gray-200">{resultMeta.count}</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-300">Gym name</label>
              <input
                type="text"
                value={gymName}
                onChange={(event) => setGymName(event.target.value)}
                placeholder="Different Breed Sports Academy"
                className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                We convert this into a Mindbody location slug automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-300">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300">Radius (miles)</label>
                <input
                  type="number"
                  min="1"
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Slug</p>
              <p className="mt-1 text-lg font-mono text-indigo-300">
                {slug || 'type-a-gym-name-to-generate'}
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:opacity-50"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Fetching schedule…' : 'Fetch schedule'}
            </button>
          </form>

          {errorMessage && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              {errorMessage}
            </div>
          )}
          {resultMeta?.source === 'sample' && !errorMessage && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              You are currently viewing sample data. Configure the Mindbody environment variables on
              Vercel to fetch live schedules for different gyms.
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-gray-300 mb-2">Mindbody request preview</p>
            <pre className="max-h-64 overflow-auto rounded-2xl border border-gray-900 bg-black/40 p-4 text-xs leading-relaxed">
{JSON.stringify(requestPreview, null, 2)}
            </pre>
          </div>
        </section>

        <section className="flex-1 rounded-2xl border border-gray-900 bg-gray-900/60 p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Preview</p>
              <p className="text-lg font-semibold">What will be saved</p>
            </div>
            <button
              type="button"
              onClick={handleApplyToEditor}
              disabled={!schedule}
              className="rounded-lg border border-indigo-500/50 px-4 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/10 disabled:opacity-40"
            >
              Send to editor
            </button>
          </div>

          <div className="flex-1 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/40 flex items-center justify-center p-4">
            {schedule ? (
              <div className="w-full max-w-sm">
                <div className="relative aspect-[9/16] rounded-xl bg-gray-900">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      style={{
                        width: '1080px',
                        height: '1920px',
                        transform: 'scale(0.25)',
                        transformOrigin: 'top center',
                      }}
                    >
                      <StoryRenderer
                        templateId={PREVIEW_TEMPLATE_ID}
                        style={PREVIEW_STYLE}
                        schedule={schedule}
                        isFullSize={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 px-4">
                Enter a gym name and date to preview how the schedule will look.
              </p>
            )}
          </div>

          {rawResponse && (
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">Raw API snippet</p>
              <pre className="max-h-48 overflow-auto rounded-2xl border border-gray-900 bg-black/40 p-4 text-xs leading-relaxed">
{JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default GymFinderPage;
