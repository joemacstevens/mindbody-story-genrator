import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from '../components/ui';
import type { GymLocation, Schedule } from '../types';
import { searchGymLocations } from '../services/gymLocations';
import { saveSchedule } from '../services/api';
import {
  loadSavedGymsForUser,
  saveGymRecordForUser,
  touchSavedGymForUser,
  type SavedGym,
} from '../services/savedGyms';
import { cn } from '../utils/cn';

const BackgroundGradients: React.FC = () => (
  <>
    <div className="pointer-events-none absolute -top-48 right-[-20%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,123,216,0.15),transparent_70%)] blur-3xl animate-pulse" />
    <div className="pointer-events-none absolute -bottom-40 left-[-15%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1),transparent_70%)] blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
  </>
);

const Header: React.FC<{ initials: string }> = ({ initials }) => (
  <header className="absolute top-0 left-0 right-0 z-10 px-8 py-6">
    <div className="flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 text-xl font-semibold text-slate-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-lg">
          📅
        </div>
            Studiogram
      </Link>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-transform">
          {initials}
      </div>
    </div>
  </header>
);

const HeroSection: React.FC = () => (
  <div className="text-center mb-12">
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-500/30 text-sm text-purple-400 font-medium mb-5">
      <span>👋</span>
      <span>Welcome</span>
    </div>
    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
      Find Your Gym
    </h1>
    <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
      Let's get you set up! Search for your studio to sync your class schedule.
    </p>
  </div>
);

const SearchSection: React.FC<{ 
  gymName: string; 
  onGymNameChange: (value: string) => void;
  suggestions: GymLocation[];
  isSearching: boolean;
  onSelectSuggestion: (gym: GymLocation) => void;
}> = ({ gymName, onGymNameChange, suggestions, isSearching, onSelectSuggestion }) => (
  <div className="mb-8">
    <label className="block text-sm font-semibold text-slate-300 mb-3">
      Search for your gym
    </label>
    <div className="relative">
      <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-xl text-slate-500 pointer-events-none">
        🔍
      </span>
      <input
        type="text"
        className="w-full pl-14 pr-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:bg-white/8 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all"
        placeholder="Enter gym name..."
        value={gymName}
        onChange={(e) => onGymNameChange(e.target.value)}
      />
      {(suggestions.length > 0 || isSearching) && (
        <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-white/15 bg-slate-900/98 shadow-2xl backdrop-blur-xl">
          {isSearching ? (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-300">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-transparent" aria-hidden="true" />
              Searching gyms…
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-white/5 overflow-y-auto">
              {suggestions.map((gym) => (
                <li key={gym.slug}>
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion(gym)}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-purple-500/10 focus:bg-purple-500/15"
                  >
                    <span className="font-medium text-slate-50">{gym.name}</span>
                    <span className="text-sm text-slate-400">{gym.city}, {gym.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
      <span className="w-4 h-4 bg-slate-500/20 rounded-full flex items-center justify-center text-xs font-semibold">?</span>
      <span>Use the official name from Mindbody</span>
    </div>
  </div>
);

const EmptyState: React.FC<{ onManualEntry: () => void }> = ({ onManualEntry }) => (
  <div className="text-center py-12">
    <div className="mb-6">
      <span className="text-6xl block mb-2">🏋️</span>
    </div>
    <h3 className="text-xl font-semibold text-slate-300 mb-3">No saved gyms yet</h3>
    <p className="text-slate-500 mb-8 leading-relaxed">
      Start by searching for your gym above, or add it manually if you can't find it.
    </p>

    {/* CTA Box */}
    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">📌</span>
        <h4 className="text-purple-400 font-semibold">Can't find your gym?</h4>
      </div>
      <p className="text-slate-400 text-sm mb-4 leading-relaxed">
        If your gym isn't appearing in search results, you can add it manually with your Mindbody schedule URL.
      </p>
      <Button
        variant="secondary"
        size="md"
        className="w-full"
        onClick={onManualEntry}
      >
        <span>✏️</span>
        <span>Add Manually</span>
        <span className="ml-auto">→</span>
      </Button>
    </div>

    {/* Feature List */}
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-white/2 rounded-xl hover:bg-white/4 transition-colors">
        <div className="w-8 h-8 bg-purple-500/15 rounded-lg flex items-center justify-center text-base flex-shrink-0">
          ⚡
        </div>
        <div>
          <div className="font-semibold text-slate-300 text-sm">Instant Sync</div>
          <div className="text-slate-500 text-xs leading-relaxed">Your schedule updates automatically from Mindbody</div>
        </div>
      </div>
      <div className="flex items-start gap-3 p-3 bg-white/2 rounded-xl hover:bg-white/4 transition-colors">
        <div className="w-8 h-8 bg-purple-500/15 rounded-lg flex items-center justify-center text-base flex-shrink-0">
          🎨
        </div>
        <div>
          <div className="font-semibold text-slate-300 text-sm">Custom Designs</div>
          <div className="text-slate-500 text-xs leading-relaxed">Beautiful templates that match your brand</div>
        </div>
      </div>
      <div className="flex items-start gap-3 p-3 bg-white/2 rounded-xl hover:bg-white/4 transition-colors">
        <div className="w-8 h-8 bg-purple-500/15 rounded-lg flex items-center justify-center text-base flex-shrink-0">
          📱
        </div>
        <div>
          <div className="font-semibold text-slate-300 text-sm">Share Anywhere</div>
          <div className="text-slate-500 text-xs leading-relaxed">Export for social media, email, or your website</div>
        </div>
      </div>
    </div>
  </div>
);

const SavedGymsState: React.FC<{
  gyms: SavedGym[];
  defaultGymSlug: string | null;
  onSelectGym: (gym: SavedGym) => void;
  onViewAll: () => void;
}> = ({ gyms, defaultGymSlug, onSelectGym, onViewAll }) => (
  <>
    {/* Divider */}
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <span className="text-xs uppercase tracking-wider text-slate-500">or choose from saved</span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>

    {/* Saved Gyms */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Recent Gyms</h2>
        <button 
          onClick={onViewAll}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded hover:bg-purple-500/10"
        >
          View All
        </button>
      </div>
      <div className="space-y-2">
        {gyms.map((gym) => {
          const isDefault = gym.slug === defaultGymSlug;
          const lastUsedLabel = formatRelativeLastUsed(gym.lastUsedAt);
          return (
          <button
            key={gym.slug}
            onClick={() => onSelectGym(gym)}
            className={cn(
              'w-full flex items-center gap-4 p-4 border rounded-xl transition-all group',
              isDefault
                ? 'bg-purple-500/15 border-purple-500/30 shadow-[0_12px_40px_rgba(139,123,216,0.25)]'
                : 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-purple-500/30',
            )}
          >
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              {isDefault ? '⭐' : '🏋️'}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-slate-50">{gym.name}</div>
              <div className="text-sm text-slate-500">{lastUsedLabel}</div>
            </div>
            <span className="text-slate-500 group-hover:text-purple-400 transition-colors">→</span>
          </button>
        );
        })}
      </div>
    </div>
  </>
);

const formatScheduleDate = (value: string) => {
  if (!value) {
    return '';
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatRelativeLastUsed = (isoDate: string | null | undefined) => {
  if (!isoDate) {
    return 'Last synced recently';
  }
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'Last synced recently';
  }

  const now = Date.now();
  const diffMs = now - parsed.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) {
    return 'Synced moments ago';
  }
  if (minutes < 60) {
    return `Synced ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Synced ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Synced ${days} day${days === 1 ? '' : 's'} ago`;
  }

  return `Synced ${parsed.toLocaleDateString()}`;
};

const GymFinderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const scheduleEndpoint =
    (import.meta.env.VITE_SCHEDULE_ENDPOINT as string | undefined) || '/api/schedule';

  const [gymName, setGymName] = useState('');
  const [suggestions, setSuggestions] = useState<GymLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedGyms, setSavedGyms] = useState<SavedGym[]>([]);
  const [defaultGymSlug, setDefaultGymSlug] = useState<string | null>(null);
  const [hasLoadedGyms, setHasLoadedGyms] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [loadedGymResult, setLoadedGymResult] = useState<{
    gym: GymLocation;
    schedule: Schedule;
    slug: string;
  } | null>(null);
  const [isSavingGym, setIsSavingGym] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const initials = user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';

  useEffect(() => {
    if (!user?.uid) {
      setSavedGyms([]);
      setDefaultGymSlug(null);
      setHasLoadedGyms(true);
      return;
    }

    let isActive = true;
    setHasLoadedGyms(false);
    setSavedGyms([]);

    loadSavedGymsForUser(user.uid)
      .then((state) => {
        if (!isActive) {
          return;
        }
        setSavedGyms(state.gyms);
        setDefaultGymSlug(state.defaultGymSlug);
        setHasLoadedGyms(true);
      })
      .catch((error) => {
        console.error('Failed to load saved gyms:', error);
        if (!isActive) {
          return;
        }
        setSavedGyms([]);
        setDefaultGymSlug(null);
        setHasLoadedGyms(true);
      });

    return () => {
      isActive = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    const trimmed = gymName.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let isActive = true;
    setIsSearching(true);

    const timeoutId = window.setTimeout(() => {
      searchGymLocations(trimmed, { limit: 8 })
        .then((results) => {
          if (!isActive) return;
          setSuggestions(results);
        })
        .catch((error) => {
          console.error('Gym search failed:', error);
          if (!isActive) return;
          setSuggestions([]);
        })
        .finally(() => {
          if (!isActive) return;
          setIsSearching(false);
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [gymName]);

  const loadScheduleForGym = useCallback(
    async (gym: GymLocation) => {
      if (!user?.uid) {
        setScheduleError('Sign in to load and save schedules.');
        setScheduleSuccess(null);
        setLoadedGymResult(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/New_York';

      setIsLoadingSchedule(true);
      setScheduleError(null);
      setScheduleSuccess(null);
      setSaveError(null);
      setSaveSuccess(null);
      setLoadedGymResult(null);

      try {
        const response = await fetch(scheduleEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gymName: gym.name,
            locationSlug: gym.slug,
            date: today,
            radius: 5,
            timezone,
          }),
        });

        if (!response.ok) {
          throw new Error(`Schedule request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const schedule: Schedule | undefined = payload?.schedule;
        if (!schedule) {
          throw new Error('Response did not include a schedule payload.');
        }

        const responseSlug = typeof payload?.slug === 'string' && payload.slug.length > 0 ? payload.slug : gym.slug;
        setLoadedGymResult({
          gym,
          schedule,
          slug: responseSlug,
        });
        const formattedDate = formatScheduleDate(schedule.date);
        const classCountLabel = `${schedule.items.length} ${schedule.items.length === 1 ? 'class' : 'classes'}`;
        setScheduleSuccess(
          `Loaded ${classCountLabel}${formattedDate ? ` for ${formattedDate}` : ''}.`,
        );

        if (savedGyms.some((entry) => entry.slug === responseSlug)) {
          void touchSavedGymForUser(user.uid, responseSlug)
            .then((state) => {
              setSavedGyms(state.gyms);
              setDefaultGymSlug(state.defaultGymSlug);
            })
            .catch((touchError) => {
              console.error('Failed to update saved gym metadata:', touchError);
            });
        }
      } catch (error) {
        console.error('Failed to load schedule:', error);
        setScheduleError('Could not load the schedule for this gym. Please try again.');
      } finally {
        setIsLoadingSchedule(false);
      }
    },
    [savedGyms, scheduleEndpoint, user?.uid],
  );

  const handleSaveGym = useCallback(async () => {
    if (!user?.uid || !loadedGymResult) {
      setSaveError('Load a gym schedule first to save it.');
      return;
    }

    setIsSavingGym(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const savedSlug = await saveSchedule(loadedGymResult.schedule, loadedGymResult.slug, user.uid);
      const existingGym = savedGyms.find((entry) => entry.slug === savedSlug);
      const savedState = await saveGymRecordForUser(
        user.uid,
        {
          name: loadedGymResult.gym.name,
          slug: savedSlug,
          radius: existingGym?.radius ?? 5,
        },
        { setAsDefault: true },
      );
      setSavedGyms(savedState.gyms);
      setDefaultGymSlug(savedState.defaultGymSlug);
      setSaveSuccess(`${loadedGymResult.gym.name} saved successfully.`);
      setLoadedGymResult((prev) => (prev ? { ...prev, slug: savedSlug } : prev));
    } catch (error) {
      console.error('Failed to save schedule:', error);
      setSaveError('Failed to save this gym. Please try again.');
    } finally {
      setIsSavingGym(false);
    }
  }, [loadedGymResult, savedGyms, user?.uid]);

  const handleOpenEditor = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleResetLoadedState = useCallback(() => {
    setLoadedGymResult(null);
    setScheduleSuccess(null);
    setSaveSuccess(null);
    setSaveError(null);
    setGymName('');
    setSuggestions([]);
  }, []);

  const handleSelectSuggestion = (gym: GymLocation) => {
    setGymName(gym.name);
    setSuggestions([]);
    void loadScheduleForGym(gym);
  };

  const handleSelectSavedGym = (gym: SavedGym) => {
    setGymName(gym.name);
    setSuggestions([]);
    void loadScheduleForGym({
      name: gym.name,
      slug: gym.slug,
      city: '',
      state: '',
      country: 'US',
    });
  };

  const handleManualEntry = () => {
    navigate('/gym-finder/manual');
  };

  const handleViewAll = () => {
    // Open saved gyms drawer or navigate to full list
    console.log('View all saved gyms');
  };

  const showSavedState = hasLoadedGyms && savedGyms.length > 0;
  const hasSavedCurrentGym = Boolean(saveSuccess);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50 flex items-center justify-center p-5 overflow-hidden">
      <BackgroundGradients />
      
      <Header initials={initials} />
      
      <div className="w-full max-w-lg relative z-10">
        <HeroSection />
        
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl">
          <SearchSection
            gymName={gymName}
            onGymNameChange={setGymName}
            suggestions={suggestions}
            isSearching={isSearching}
            onSelectSuggestion={handleSelectSuggestion}
          />

          {isLoadingSchedule && (
            <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">
              Loading the latest schedule…
            </div>
          )}
          {scheduleError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {scheduleError}
            </div>
          )}
          {loadedGymResult && (
            <div className="mb-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-emerald-50 shadow-[0_18px_48px_rgba(16,185,129,0.15)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
                    Schedule synced
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-emerald-50">{loadedGymResult.gym.name}</h3>
                  {scheduleSuccess && (
                    <p className="mt-2 text-sm text-emerald-100/80">{scheduleSuccess}</p>
                  )}
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-xl">
                  ✅
                </span>
              </div>

              {loadedGymResult.schedule.items.length > 0 ? (
                <ul className="mt-5 space-y-2">
                  {loadedGymResult.schedule.items.slice(0, 4).map((item, index) => (
                    <li
                      key={`${item.time}-${item.class}-${index}`}
                      className="flex items-start gap-3 rounded-xl bg-emerald-500/10 px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-emerald-200">{item.time}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-emerald-50">{item.class}</div>
                        {item.coach ? (
                          <div className="text-xs text-emerald-200/80">with {item.coach}</div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100/80">
                  No classes were returned for this schedule yet. You can save it now or try another search.
                </div>
              )}
              {loadedGymResult.schedule.items.length > 4 && (
                <p className="mt-2 text-xs text-emerald-200/70">
                  +{loadedGymResult.schedule.items.length - 4} more classes loaded
                </p>
              )}

              {saveError && (
                <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50">
                  {saveSuccess}
                </div>
              )}

              <div className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Button
                  onClick={() => {
                    void handleSaveGym();
                  }}
                  loading={isSavingGym}
                  disabled={hasSavedCurrentGym}
                  className="sm:col-span-1"
                >
                  {hasSavedCurrentGym ? 'Saved' : 'Save Gym'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleOpenEditor}
                  disabled={!hasSavedCurrentGym}
                  className="sm:col-span-1"
                >
                  Open Editor
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleResetLoadedState}
                  className="sm:col-span-2"
                >
                  Search another gym
                </Button>
              </div>
            </div>
          )}

          {!hasLoadedGyms ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-slate-500/40 border-t-slate-500 rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500">Loading saved gyms...</p>
                </div>
              ) : showSavedState ? (
            <SavedGymsState
              gyms={savedGyms}
              defaultGymSlug={defaultGymSlug}
              onSelectGym={handleSelectSavedGym}
              onViewAll={handleViewAll}
            />
          ) : (
            <EmptyState onManualEntry={handleManualEntry} />
              )}
            </Card>
      </div>
    </div>
  );
};

export default GymFinderPage;
