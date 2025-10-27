import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEFAULT_APP_SETTINGS, MOCK_SCHEDULE } from '../constants';
import type { GymLocation, Schedule } from '../types';
import { saveSchedule } from '../services/api';
import { slugifyLocation, humanizeDate } from '../utils/slugify';
import SavedGymsDrawer from '../components/SavedGymsDrawer';
import {
  loadSavedGymsForUser,
  saveGymRecordForUser,
  removeSavedGymForUser,
  setDefaultGymForUser,
  touchSavedGymForUser,
} from '../services/savedGyms';
import type { SavedGym, SavedGymsState } from '../services/savedGyms';
import { searchGymLocations } from '../services/gymLocations';
import { useAuth } from '../contexts/AuthContext';
import { ensureUserDocument } from '../services/userData';

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
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [gymName, setGymName] = useState('');
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [radius, setRadius] = useState('5');
  const [status, setStatus] = useState<FetchState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [resultMeta, setResultMeta] = useState<{
    slug: string;
    source: 'live' | 'sample';
    count: number;
  } | null>(null);
  const [applyHint, setApplyHint] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [gymSaveMessage, setGymSaveMessage] = useState<string | null>(null);
  const [savedGymsState, setSavedGymsState] = useState<SavedGymsState>({ gyms: [], defaultGymSlug: null });
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [gymSuggestions, setGymSuggestions] = useState<GymLocation[]>([]);
  const [isSearchingGyms, setIsSearchingGyms] = useState(false);
  const [gymSearchError, setGymSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    const bootstrap = async () => {
      try {
        await ensureUserDocument(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        const remoteState = await loadSavedGymsForUser(user.uid);
        setSavedGymsState(remoteState);
      } catch (error) {
        console.error('Failed to load saved gyms from Firestore:', error);
      }
    };
    void bootstrap();
  }, [user]);

  const slug = useMemo(() => customSlug ?? slugifyLocation(gymName), [customSlug, gymName]);
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

  const fetchScheduleData = useCallback(
    async ({
      gymName: targetGymName,
      slug: targetSlug,
      radius: targetRadius,
      date: targetDate,
    }: {
      gymName: string;
      slug: string;
      radius: number;
      date: string;
    }) => {
      if (!targetSlug) {
        setErrorMessage('Enter a gym name to generate the Mindbody slug.');
        return;
      }

      setGymName(targetGymName);
      setRadius(String(targetRadius));
      setCustomSlug(targetSlug);
      setStatus('loading');
      setErrorMessage(null);
      setResultMeta(null);
      setApplyHint(null);
      setShowSavePrompt(false);
      setGymSaveMessage(null);

      const payload = {
        gymName: targetGymName,
        locationSlug: targetSlug,
        date: targetDate,
        radius: targetRadius,
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

        const finalSlug = typeof data?.slug === 'string' && data.slug ? data.slug : targetSlug;

        setCustomSlug(finalSlug);
        setSchedule(nextSchedule);
        setRawResponse(data?.raw ?? null);
        setStatus('success');

        if (data?.slug && data?.source) {
          setResultMeta({
            slug: data.slug,
            source: data.source,
            count: data?.count ?? nextSchedule.items.length,
          });
        } else {
          setResultMeta({
            slug: finalSlug,
            source: 'live',
            count: nextSchedule.items.length,
          });
        }

        if (!user?.uid) {
          throw new Error('You must be signed in to fetch schedules.');
        }
        const currentState = await loadSavedGymsForUser(user.uid);
        const alreadySaved = currentState.gyms.some((gym) => gym.slug === finalSlug);

        if (alreadySaved) {
          const updatedState = await touchSavedGymForUser(user.uid, finalSlug);
          setSavedGymsState(updatedState);
          setShowSavePrompt(false);
        } else {
          setSavedGymsState(currentState);
          setShowSavePrompt(true);
        }
      } catch (error) {
        console.error('Mindbody fetch failed:', error);
        setSchedule(buildMockSchedule(targetDate));
        setRawResponse(null);
        setStatus('error');
        setResultMeta(null);
        setShowSavePrompt(false);
        setGymSaveMessage(null);
        setErrorMessage(
          'Could not reach the schedule service yet. Showing a placeholder schedule so you can test the flow.',
        );
      }
    },
    [scheduleEndpoint, user],
  );

  const handleSelectGymSuggestion = (location: GymLocation) => {
    setGymName(location.name);
    setCustomSlug(location.slug);
    setGymSuggestions([]);
    setShowSavePrompt(false);
    setGymSaveMessage(null);
    setGymSearchError(null);
  };

  useEffect(() => {
    if (hasLoadedDefault) {
      return;
    }
    const { defaultGymSlug, gyms } = savedGymsState;
    if (!defaultGymSlug) {
      setHasLoadedDefault(true);
      return;
    }
    const defaultGym = gyms.find((gym) => gym.slug === defaultGymSlug) ?? gyms[0];
    if (!defaultGym) {
      setHasLoadedDefault(true);
      return;
    }
    setHasLoadedDefault(true);
    setGymName(defaultGym.name);
    setCustomSlug(defaultGym.slug);
    setRadius(String(defaultGym.radius));
    void fetchScheduleData({
      gymName: defaultGym.name,
      slug: defaultGym.slug,
      radius: defaultGym.radius,
      date,
    });
  }, [savedGymsState, hasLoadedDefault, date, fetchScheduleData]);

  useEffect(() => {
    const trimmed = gymName.trim();
    if (trimmed.length < 2) {
      setGymSuggestions([]);
      setGymSearchError(null);
      setIsSearchingGyms(false);
      return;
    }

    let isCurrent = true;
    setIsSearchingGyms(true);

    const debounceId = window.setTimeout(() => {
      searchGymLocations(trimmed, { limit: 6 })
        .then((results) => {
          if (!isCurrent) return;
          setGymSuggestions(results);
          setGymSearchError(null);
        })
        .catch((error) => {
          console.error('Gym autocomplete failed:', error);
          if (!isCurrent) return;
          setGymSuggestions([]);
          setGymSearchError('Could not search gyms right now. Try again shortly.');
        })
        .finally(() => {
          if (!isCurrent) return;
          setIsSearchingGyms(false);
        });
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(debounceId);
    };
  }, [gymName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedGymName = gymName.trim();
    if (!slug) {
      setErrorMessage('Enter a gym name to generate the Mindbody slug.');
      return;
    }
    await fetchScheduleData({
      gymName: trimmedGymName || gymName,
      slug,
      radius: Number(radius) || 1,
      date,
    });
  };

  const handleApply = async (destination: 'editor' | 'render') => {
    if (!schedule) return;
    if (!slug) {
      setApplyHint('Generate a Mindbody slug before applying the schedule.');
      return;
    }
    if (!user?.uid) {
      setApplyHint('Sign in to save this schedule.');
      return;
    }
    const resolvedSlug = await saveSchedule(schedule, slug, user.uid);
    setApplyHint(
      destination === 'editor'
        ? 'Schedule applied to the editor.'
        : 'Schedule applied. Opening render preview...',
    );
    if (destination === 'render') {
      navigate(`/render/${resolvedSlug}`);
    } else {
      navigate('/');
    }
  };

  const handleSaveGym = useCallback(async () => {
    if (!slug) return;
    if (!user?.uid) {
      setGymSaveMessage('Sign in to save gyms.');
      return;
    }
    const trimmedGymName = gymName.trim();
    if (!trimmedGymName) return;
    const radiusValue = Number(radius) || 1;
    const updatedState = await saveGymRecordForUser(
      user.uid,
      { name: trimmedGymName, slug, radius: radiusValue },
      { setAsDefault: true },
    );
    setSavedGymsState(updatedState);
    setShowSavePrompt(false);
    setGymSaveMessage(`${trimmedGymName} saved as your default gym. We'll load it automatically next time.`);
  }, [gymName, radius, slug, user]);

  const handleDismissSavePrompt = () => {
    setShowSavePrompt(false);
  };

  const savedGyms = savedGymsState.gyms;
  const defaultGymSlug = savedGymsState.defaultGymSlug;

  const handleSelectSavedGym = (gym: SavedGym) => {
    setIsDrawerOpen(false);
    setGymName(gym.name);
    setCustomSlug(gym.slug);
    setRadius(String(gym.radius));
    setGymSaveMessage(null);
    setShowSavePrompt(false);
    setGymSuggestions([]);
    setGymSearchError(null);
    void fetchScheduleData({
      gymName: gym.name,
      slug: gym.slug,
      radius: gym.radius,
      date,
    });
  };

  const handleSetDefaultGym = useCallback(async (gym: SavedGym) => {
    if (!user?.uid) {
      setGymSaveMessage('Sign in to choose a default gym.');
      return;
    }
    const updatedState = await setDefaultGymForUser(user.uid, gym.slug);
    setSavedGymsState(updatedState);
    setGymSaveMessage(`${gym.name} is now your default gym.`);
  }, [user]);

  const handleRemoveGym = useCallback(async (gym: SavedGym) => {
    if (!user?.uid) {
      setGymSaveMessage('Sign in to manage saved gyms.');
      return;
    }
    const updatedState = await removeSavedGymForUser(user.uid, gym.slug);
    setSavedGymsState(updatedState);
    setGymSaveMessage(`${gym.name} was removed from your saved gyms.`);
    if (updatedState.gyms.length === 0) {
      setHasLoadedDefault(true);
    }
  }, [user]);

  const statusLabel: Record<FetchState, string> = {
    idle: 'Awaiting search',
    loading: 'Contacting Mindbody...',
    success: 'Schedule ready',
    error: 'Using placeholder data',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-gradient-to-r from-indigo-600/40 via-purple-600/20 to-transparent border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/80">Mindbody sync</p>
              <h1 className="text-3xl sm:text-4xl font-bold">Find your gym schedule</h1>
              <p className="text-sm text-indigo-50/80 max-w-2xl mt-2">
                Paste the gym name, pick a day, and we’ll pull the official Mindbody schedule so
                your templates stay on-brand without spreadsheets.
              </p>
            </div>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 hover:border-white hover:text-white transition"
            >
              ← Back to editor
            </Link>
          </div>
          <div className="sm:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 hover:border-white hover:text-white transition"
            >
              ← Back to editor
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Step 1 */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 space-y-6 shadow-[0_15px_60px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">Step 1</p>
              <h2 className="text-2xl font-semibold mt-1">Search your gym</h2>
              <p className="text-sm text-slate-400 mt-1">
                Use the official name from Mindbody. We’ll auto-generate the slug and pull the
                classes within a mile radius.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-sm font-semibold text-slate-300">{statusLabel[status]}</span>
              {resultMeta && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                    resultMeta.source === 'live'
                      ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/40'
                      : 'bg-amber-500/10 text-amber-200 border border-amber-400/40'
                  }`}
                >
                  {resultMeta.source === 'live' ? 'Live data' : 'Sample data'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-white/40 hover:text-white transition"
              >
                Saved gyms{savedGyms.length ? ` (${savedGyms.length})` : ''}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-slate-200">Gym name</label>
              <input
                type="text"
                value={gymName}
                onChange={(event) => {
                  setGymName(event.target.value);
                  setCustomSlug(null);
                  setShowSavePrompt(false);
                  setGymSaveMessage(null);
                  setGymSearchError(null);
                }}
                placeholder="Humble Yoga"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <p className="text-xs text-slate-500">Example: “Different Breed Sports Academy”</p>
              {gymName.trim().length >= 2 &&
                (isSearchingGyms || gymSuggestions.length > 0 || gymSearchError) && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2">
                    <div className="rounded-2xl border border-white/15 bg-slate-950/90 backdrop-blur-md shadow-2xl">
                      {isSearchingGyms ? (
                        <div className="px-4 py-3 text-sm text-slate-300">Searching gyms…</div>
                      ) : gymSearchError ? (
                        <div className="px-4 py-3 text-sm text-amber-200">{gymSearchError}</div>
                      ) : gymSuggestions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400">No gyms found.</div>
                      ) : (
                        <ul className="divide-y divide-white/5 max-h-64 overflow-auto">
                          {gymSuggestions.map((location) => (
                            <li key={location.slug}>
                              <button
                                type="button"
                                onClick={() => handleSelectGymSuggestion(location)}
                                className="w-full text-left px-4 py-3 hover:bg-white/5 focus:bg-white/10 focus:outline-none transition rounded-2xl"
                              >
                                <p className="text-sm font-semibold text-white">{location.name}</p>
                                <p className="text-xs text-slate-400">
                                  {location.city}, {location.state} · {location.slug}
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setGymSaveMessage(null);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">Radius (miles)</label>
                <input
                  type="number"
                  min="1"
                  value={radius}
                  onChange={(event) => {
                    setRadius(event.target.value);
                    setGymSaveMessage(null);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Mindbody slug</p>
              <p className="mt-1 text-lg font-mono text-indigo-200">
                {slug || 'type-a-gym-name-to-generate'}
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-base font-semibold shadow-[0_20px_40px_rgba(99,102,241,0.35)] transition hover:brightness-110 disabled:opacity-50"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Finding classes…' : 'Fetch schedule'}
            </button>
          </form>

          {resultMeta && (
            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
              <div>
                <p className="uppercase text-xs tracking-wide text-slate-500">Slug used</p>
                <p className="font-semibold text-slate-100">{resultMeta.slug}</p>
              </div>
              <div>
                <p className="uppercase text-xs tracking-wide text-slate-500">Classes found</p>
                <p className="font-semibold text-slate-100">{resultMeta.count}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              {errorMessage}
            </div>
          )}

          {gymSaveMessage && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-100">
              {gymSaveMessage}
            </div>
          )}

          {resultMeta?.source === 'sample' && !errorMessage && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-50/90">
              You’re viewing the sample payload. Add your Mindbody endpoint in the Vercel env vars to
              pull live schedules automatically.
            </div>
          )}

          <details className="rounded-2xl border border-white/5 bg-slate-950/30 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-300">
              Need to double-check the API payload?
            </summary>
            <pre className="mt-4 max-h-64 w-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/50 p-4 text-xs leading-relaxed">
{JSON.stringify(requestPreview, null, 2)}
            </pre>
          </details>
        </section>

        {/* Step 2 */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-[0_15px_60px_rgba(15,23,42,0.45)]">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">Step 2</p>
              <h2 className="text-2xl font-semibold mt-1">Preview & send to templates</h2>
              <p className="text-sm text-slate-400 mt-1">
                Everything shown here will automatically load in the editor and full render.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApply('editor')}
                disabled={!schedule}
                className="rounded-full border border-indigo-400/50 px-4 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/10 disabled:opacity-40"
              >
                Save to editor
              </button>
              <button
                type="button"
                onClick={() => handleApply('render')}
                disabled={!schedule}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.4)] hover:bg-indigo-400 disabled:opacity-40"
              >
                Open render
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-4 flex flex-col gap-4">
            {schedule ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Schedule date</p>
                    <p className="text-lg font-semibold text-white">{schedule.date}</p>
                  </div>
                  <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                    {schedule.items.length} classes
                  </div>
                </div>
                <ul className="space-y-3 max-h-96 overflow-auto pr-1">
                  {schedule.items.map((item, idx) => (
                    <li
                      key={`${item.time}-${idx}`}
                      className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 flex items-center gap-3"
                    >
                      <div className="w-24 text-sm font-semibold text-indigo-200">
                        {item.time}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.class}</p>
                        <p className="text-xs text-slate-400">with {item.coach}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-slate-200">
                  Preview loads after you fetch a gym
                </p>
                <p className="text-xs text-slate-500">
                  We’ll list the full day’s classes here so you can double-check everything before
                  saving.
                </p>
              </div>
            )}
          </div>

          {showSavePrompt && status === 'success' && schedule && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-100">
                  Save {gymName || 'this gym'} for next time?
                </p>
                <p className="text-xs text-indigo-200/80">
                  We’ll set it as your default and load it automatically when you come back.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveGym}
                  className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)] hover:bg-indigo-400"
                >
                  Save gym
                </button>
                <button
                  type="button"
                  onClick={handleDismissSavePrompt}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-white/50"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          {applyHint && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {applyHint}
            </div>
          )}

          {rawResponse && (
            <details className="rounded-2xl border border-white/5 bg-slate-950/30 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-300">
                Developer view
              </summary>
              <pre className="mt-4 max-h-64 w-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/50 p-4 text-xs leading-relaxed">
{JSON.stringify(rawResponse, null, 2)}
              </pre>
            </details>
          )}
        </section>
      </main>
      <SavedGymsDrawer
        isOpen={isDrawerOpen}
        gyms={savedGyms}
        defaultGymSlug={defaultGymSlug}
        onClose={() => setIsDrawerOpen(false)}
        onSelectGym={handleSelectSavedGym}
        onSetDefault={handleSetDefaultGym}
        onRemove={handleRemoveGym}
      />
    </div>
  );
};

export default GymFinderPage;
