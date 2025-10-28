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
import { Button, Card, Input } from '../components/ui';
import { cn } from '../utils/cn';

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

const getInitials = (name?: string | null, email?: string | null) => {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  }
  if (email && email.length > 0) {
    return email[0]!.toUpperCase();
  }
  return 'U';
};

const emojiPool = ['🏋️', '🧘', '🚴', '🤸', '🤾', '🥊', '🏃', '🏓', '🏄', '🏊'];
const getGymEmoji = (name: string) => {
  const code = name.charCodeAt(0) || 0;
  return emojiPool[code % emojiPool.length];
};

const formatLastUsedLabel = (iso?: string | null) => {
  if (!iso) return 'Just added';
  const last = new Date(iso);
  if (Number.isNaN(last.getTime())) return 'Recently';
  const diff = Date.now() - last.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months <= 1) return '1 month ago';
  return `${months} months ago`;
};

const BackgroundGradients: React.FC = () => (
  <>
    <div className="pointer-events-none absolute -top-48 right-[-20%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,123,216,0.22),transparent_65%)] blur-3xl animate-pulse-a" />
    <div className="pointer-events-none absolute -bottom-40 left-[-15%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15),transparent_60%)] blur-3xl animate-pulse-b" />
  </>
);

interface FinderHeaderProps {
  initials: string;
  onOpenSaved: () => void;
}

const FinderHeader: React.FC<FinderHeaderProps> = ({ initials, onOpenSaved }) => (
  <header className="sticky top-0 z-20 border-b border-border-light/60 bg-background/80 backdrop-blur-2xl">
    <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
      <Link to="/" className="flex items-center gap-3 text-text-primary">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-md">
          <span className="text-lg font-semibold text-primary-light">S</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-text-tertiary">
            Studiogram
          </p>
          <p className="text-base font-semibold text-text-primary">Gym Finder</p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onOpenSaved}>
          Saved gyms
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-surface text-sm font-semibold text-text-primary shadow-sm">
          {initials}
        </div>
      </div>
    </div>
  </header>
);

interface HeroProps {
  statusLabel: string;
}

const HeroSection: React.FC<HeroProps> = ({ statusLabel }) => (
  <div className="flex flex-col items-center text-center">
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-text-tertiary animate-fade-slide"
      style={{ animationDelay: '0.2s' }}
    >
      ⚡ Quick Setup
    </span>
    <h1
      className="mt-6 bg-gradient-to-r from-primary-light via-primary to-primary-dark bg-clip-text text-4xl font-bold text-transparent sm:text-5xl animate-fade-slide"
      style={{ animationDelay: '0.3s' }}
    >
      Find Your Gym
    </h1>
    <p
      className="mt-4 max-w-2xl text-[17px] text-text-secondary animate-fade-slide"
      style={{ animationDelay: '0.4s' }}
    >
      Connect to your Mindbody studio in seconds. Search for your gym, pick a slug, and instantly
      sync the latest class schedule to your templates.
    </p>
    <p
      className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-text-tertiary animate-fade-slide"
      style={{ animationDelay: '0.5s' }}
    >
      Status: <span className="ml-2 text-text-primary">{statusLabel}</span>
    </p>
  </div>
);

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
  const [resultMeta, setResultMeta] = useState<{
    slug: string;
    source: 'live' | 'sample';
    count: number;
  } | null>(null);
  const [applyHint, setApplyHint] = useState<string | null>(null);
  const [gymSaveMessage, setGymSaveMessage] = useState<string | null>(null);
  const [savedGymsState, setSavedGymsState] = useState<SavedGymsState>({
    gyms: [],
    defaultGymSlug: null,
  });
  const [hasLoadedGyms, setHasLoadedGyms] = useState(false);
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
        setHasLoadedGyms(true);
      } catch (error) {
        console.error('Failed to load saved gyms from Firestore:', error);
        setHasLoadedGyms(true);
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

        if (user?.uid) {
          const updatedState = await touchSavedGymForUser(user.uid, finalSlug);
          setSavedGymsState(updatedState);
        }
      } catch (error) {
        console.error('Mindbody fetch failed:', error);
        setSchedule(buildMockSchedule(targetDate));
        setStatus('error');
        setResultMeta(null);
        setErrorMessage(
          'Could not reach the schedule service yet. Showing a placeholder schedule so you can test the flow.',
        );
      }
    },
    [scheduleEndpoint, user],
  );

  const handleFetchSchedule = useCallback(() => {
    const trimmedGymName = gymName.trim();
    if (!slug) {
      setErrorMessage('Enter a gym name to generate the Mindbody slug.');
      return;
    }
    void fetchScheduleData({
      gymName: trimmedGymName || gymName,
      slug,
      radius: Number(radius) || 1,
      date,
    });
  }, [fetchScheduleData, gymName, slug, radius, date]);

  const handleSelectGymSuggestion = (location: GymLocation) => {
    setGymName(location.name);
    setCustomSlug(location.slug);
    setGymSuggestions([]);
    setGymSaveMessage(null);
    setGymSearchError(null);
  };

  useEffect(() => {
    if (!hasLoadedGyms || hasLoadedDefault) {
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
  }, [savedGymsState, hasLoadedGyms, hasLoadedDefault, date, fetchScheduleData]);

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
    setGymSaveMessage(`${trimmedGymName} saved as your default gym. We'll load it automatically next time.`);
  }, [gymName, radius, slug, user]);

  const handleSelectSavedGym = useCallback(async (gym: SavedGym) => {
    setIsDrawerOpen(false);
    setGymName(gym.name);
    setCustomSlug(gym.slug);
    setRadius(String(gym.radius));
    setGymSaveMessage(null);
    setGymSuggestions([]);
    setGymSearchError(null);
    await fetchScheduleData({
      gymName: gym.name,
      slug: gym.slug,
      radius: gym.radius,
      date,
    });
  }, [fetchScheduleData, date]);

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

  const savedGyms = savedGymsState.gyms;
  const defaultGymSlug = savedGymsState.defaultGymSlug;
  const topSavedGyms = savedGyms.slice(0, 3);

  const statusLabel: Record<FetchState, string> = {
    idle: 'Awaiting search',
    loading: 'Contacting Mindbody…',
    success: 'Schedule ready',
    error: 'Using placeholder data',
  };

  const initials = getInitials(user?.displayName, user?.email);
  const trimmedQuery = gymName.trim();
  const shouldShowResults =
    trimmedQuery.length >= 2 &&
    (gymSuggestions.length > 0 || isSearchingGyms || Boolean(gymSearchError));

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-text-primary">
      <BackgroundGradients />
      <div className="relative z-10 flex min-h-screen flex-col">
        <FinderHeader initials={initials} onOpenSaved={() => setIsDrawerOpen(true)} />
        <main className="flex-1 px-4 pb-24 pt-16 sm:px-8">
          <section className="mx-auto flex max-w-5xl flex-col items-center gap-12">
            <HeroSection statusLabel={statusLabel[status]} />
            <Card variant="elevated" className="w-full space-y-10 bg-surface/90 shadow-xl">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-text-secondary">
                      Search for your gym
                    </label>
                    {resultMeta && (
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                          resultMeta.source === 'live'
                            ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/40'
                            : 'bg-amber-500/10 text-amber-100 border border-amber-400/40',
                        )}
                      >
                        {resultMeta.source === 'live' ? 'Live payload' : 'Sample payload'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      variant="search"
                      placeholder="Enter gym name…"
                      value={gymName}
                      onChange={(event) => setGymName(event.target.value)}
                      helpText="Use the official name from Mindbody"
                    />
                    {shouldShowResults && (
                      <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-border-light bg-background/95 shadow-xl backdrop-blur-xl">
                        <ul className="max-h-72 divide-y divide-border-light overflow-auto">
                          {isSearchingGyms && (
                            <li className="flex items-center gap-3 px-4 py-3 text-sm text-text-tertiary">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-tertiary/40 border-t-transparent" />
                              Searching…
                            </li>
                          )}
                          {!isSearchingGyms &&
                            gymSuggestions.map((result) => (
                              <li key={result.slug}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectGymSuggestion(result)}
                                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-primary/10 focus:bg-primary/10"
                                >
                                  <div>
                                    <p className="font-semibold text-text-primary">{result.name}</p>
                                    <p className="text-xs text-text-tertiary">
                                      {result.city}, {result.state}
                                    </p>
                                  </div>
                                  <span className="text-xs font-semibold uppercase text-text-tertiary">
                                    Select →
                                  </span>
                                </button>
                              </li>
                            ))}
                          {!isSearchingGyms && gymSuggestions.length === 0 && !gymSearchError && (
                            <li className="px-4 py-3 text-sm text-text-secondary">
                              No matches just yet. Try another spelling or add it manually below.
                            </li>
                          )}
                          {gymSearchError && (
                            <li className="px-4 py-3 text-sm text-accent-red">{gymSearchError}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Radius (miles)</label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={radius}
                      onChange={(event) => setRadius(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Schedule Date</label>
                    <Input
                      type="date"
                      value={date}
                      max={today}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      Manual slug (optional)
                    </label>
                    <Input
                      value={customSlug ?? ''}
                      onChange={(event) => setCustomSlug(event.target.value)}
                      placeholder="studiogram-hoboken"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-2xl border border-border-light bg-surface/70 px-4 py-3 font-mono text-sm text-text-tertiary">
                    {slug || 'type-a-gym-name-to-generate'}
                  </div>
                  <div className="flex flex-1 flex-wrap items-center gap-3 sm:justify-end">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleSaveGym}
                      disabled={!user?.uid || !slug}
                    >
                      Save as default
                    </Button>
                    <Button
                      size="md"
                      onClick={handleFetchSchedule}
                      loading={status === 'loading'}
                    >
                      {status === 'loading' ? 'Finding classes…' : 'Fetch schedule'}
                    </Button>
                  </div>
                </div>
                {errorMessage && (
                  <div className="rounded-2xl border border-accent-red/40 bg-accent-red/10 p-4 text-sm text-accent-red">
                    {errorMessage}
                  </div>
                )}
                {gymSaveMessage && !errorMessage && (
                  <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-text-primary">
                    {gymSaveMessage}
                  </div>
                )}
              </div>

              {showSavedState ? (
                <>
                  <div className="flex items-center gap-4">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border-primary to-transparent" />
                    <span className="text-xs uppercase tracking-[0.4em] text-text-tertiary">
                      or choose from saved
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border-primary to-transparent" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-text-primary">Recent Gyms</h2>
                      <Button variant="ghost" size="sm" onClick={() => setIsDrawerOpen(true)}>
                        View all →
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {topSavedGyms.map((gym) => (
                        <button
                          key={gym.slug}
                          type="button"
                          onClick={() => handleSelectSavedGym(gym)}
                          className="group flex flex-col gap-3 rounded-2xl border border-border-light bg-surface/70 p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-primary focus-visible:-translate-y-1 focus-visible:border-primary focus-visible:shadow-primary"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{getGymEmoji(gym.name)}</span>
                            <span className="text-xs font-semibold uppercase text-text-tertiary">
                              {formatLastUsedLabel(gym.lastUsedAt)}
                            </span>
                          </div>
                          <p className="text-base font-semibold text-text-primary">{gym.name}</p>
                          <div className="flex items-center justify-between text-sm text-text-tertiary">
                            <span>{gym.slug}</span>
                            <span className="text-primary-light transition group-hover:translate-x-1">
                              Select →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="mb-6 animate-fade-slide" style={{ animationDelay: '0.4s' }}>
                    <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-surface/70 text-4xl shadow-md animate-[float_3s_ease-in-out_infinite]">
                      🏋️
                    </div>
                    <h3 className="text-lg font-semibold text-text-secondary">No saved gyms yet</h3>
                    <p className="mt-2 text-sm text-text-tertiary">
                      Start by searching above to pull your Mindbody schedule instantly.
                    </p>
                  </div>
                  <div className="mx-auto max-w-sm rounded-2xl border border-primary/30 bg-primary/10 p-6 text-left">
                    <div className="mb-3 flex items-center gap-3 text-primary-light">
                      <span className="text-xl">📌</span>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Can't find your gym?</p>
                        <p className="text-xs text-text-tertiary">Add it manually with your Mindbody URL.</p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      onClick={() => navigate('/gym-finder/manual')}
                    >
                      Add manually →
                    </Button>
                  </div>
                  <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
                    {[
                      { icon: '⚡', title: 'Instant Sync', description: 'Fetch classes in seconds.' },
                      { icon: '🎨', title: 'Custom Designs', description: 'Preview templates instantly.' },
                      { icon: '📱', title: 'Share Anywhere', description: 'Export renders ready to post.' },
                    ].map((feature) => (
                      <div
                        key={feature.title}
                        className="flex items-start gap-3 rounded-2xl border border-border-light bg-surface/60 p-4 text-sm text-text-secondary transition hover:bg-surface-hover"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface text-base">
                          {feature.icon}
                        </span>
                        <div>
                          <p className="font-semibold text-text-primary">{feature.title}</p>
                          <p className="text-xs text-text-tertiary">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <section className="w-full space-y-6 rounded-3xl border border-border-light bg-surface/70 p-8 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-text-tertiary">Preview</p>
                  <h2 className="mt-1 text-xl font-semibold text-text-primary">
                    Send schedule to templates
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleApply('editor')}
                    disabled={!schedule}
                  >
                    Save to editor
                  </Button>
                  <Button size="sm" onClick={() => handleApply('render')} disabled={!schedule}>
                    Open render
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-border-light bg-background/70 p-4 backdrop-blur-xl">
                {schedule ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">
                          Schedule Date
                        </p>
                        <p className="text-base font-semibold text-text-primary">{schedule.date}</p>
                      </div>
                      <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-secondary">
                        {schedule.items.length} classes
                      </span>
                    </div>
                    <ul className="max-h-60 space-y-3 overflow-auto pr-1">
                      {schedule.items.map((item, idx) => (
                        <li
                          key={`${item.time}-${idx}`}
                          className="flex items-center gap-4 rounded-2xl border border-border-light bg-surface/70 p-3"
                        >
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary-light">
                            {item.time}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{item.class}</p>
                            <p className="text-xs text-text-tertiary">with {item.coach}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary">
                    Search for a gym to preview the schedule here.
                  </p>
                )}
              </div>
              {applyHint && <p className="text-sm text-text-tertiary">{applyHint}</p>}
              <details className="rounded-2xl border border-border-light bg-background/70 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-text-secondary">
                  Need to double-check the API payload?
                </summary>
                <pre className="mt-4 max-h-64 w-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border-light bg-black/50 p-4 text-xs leading-relaxed">
{JSON.stringify(requestPreview, null, 2)}
                </pre>
              </details>
            </section>
          </section>
        </main>
      </div>

      <SavedGymsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        gyms={savedGyms}
        defaultGymSlug={defaultGymSlug}
        onSelectGym={handleSelectSavedGym}
        onRemove={handleRemoveGym}
        onSetDefault={handleSetDefaultGym}
      />
    </div>
  );
};

export default GymFinderPage;
