import React from 'react';
import type { SavedGym } from '../services/savedGyms';
import { useStaggerAnimation } from '../hooks/useStaggerAnimation';

export type SavedGymsDrawerProps = {
  isOpen: boolean;
  gyms: SavedGym[];
  defaultGymSlug: string | null;
  onClose: () => void;
  onSelectGym: (gym: SavedGym) => void;
  onSetDefault: (gym: SavedGym) => void;
  onRemove: (gym: SavedGym) => void;
};

const SavedGymsDrawer: React.FC<SavedGymsDrawerProps> = ({
  isOpen,
  gyms,
  defaultGymSlug,
  onClose,
  onSelectGym,
  onSetDefault,
  onRemove,
}) => {
  const cardAnimations = useStaggerAnimation(gyms.length, 80);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900/95 border-l border-white/10 shadow-[0_20px_80px_rgba(15,23,42,0.6)]">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/60">Owners</p>
            <h2 className="text-xl font-semibold text-white">Saved gyms</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition-all duration-200 transform-gpu touch-manipulation hover:-translate-y-0.5 hover:border-white/40 hover:text-white active:translate-y-0"
          >
            Close
          </button>
        </div>

        <div className="h-[calc(100%-92px)] overflow-y-auto px-4 py-6 space-y-4 touch-scroll sm:px-6">
          {gyms.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
              You haven’t saved any gyms yet. Load a schedule to add it here for quick switching.
            </div>
          ) : (
            gyms.map((gym, index) => {
              const isDefault = gym.slug === defaultGymSlug;
              const lastUsedDate = new Date(gym.lastUsedAt);
              const lastUsedLabel = Number.isNaN(lastUsedDate.getTime())
                ? 'recently'
                : lastUsedDate.toLocaleString();
              return (
                <div
                  key={gym.slug}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3 transition-all duration-200 ease-out transform-gpu hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_16px_40px_rgba(15,23,42,0.45)] animate-fade-in"
                  style={cardAnimations[index]?.style}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{gym.name}</p>
                      <p className="text-xs text-slate-400">Slug: {gym.slug}</p>
                      <p className="text-xs text-slate-500 mt-1">Last used {lastUsedLabel}</p>
                    </div>
                    {isDefault && (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/40">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectGym(gym)}
                      className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 transform-gpu touch-manipulation hover:-translate-y-0.5 hover:bg-indigo-400 active:translate-y-0"
                    >
                      Load this gym
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetDefault(gym)}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-200 transition-all duration-200 transform-gpu touch-manipulation hover:-translate-y-0.5 hover:border-white/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isDefault}
                    >
                      {isDefault ? 'Default selected' : 'Set as default'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(gym)}
                      className="rounded-full border border-rose-500/40 px-4 py-2 text-xs font-semibold text-rose-200 transition-all duration-200 transform-gpu touch-manipulation hover:-translate-y-0.5 hover:border-rose-400 hover:text-rose-100 active:translate-y-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};

export default SavedGymsDrawer;
