import React, { useState, useEffect } from 'react';
import { UserPreference } from '../types';
import { getDefaultPreferences } from '../lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurgeData: () => void;
  totalSnapshots: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onPurgeData,
  totalSnapshots,
}) => {
  const [prefs, setPrefs] = useState<UserPreference>(() => {
    try {
      const saved = localStorage.getItem('chronograph_preferences');
      return saved ? JSON.parse(saved) : getDefaultPreferences();
    } catch {
      return getDefaultPreferences();
    }
  });

  const [confirmPurge, setConfirmPurge] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<string>('Calculating...');

  useEffect(() => {
    if (!isOpen) return;
    setConfirmPurge(false);

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        const usageKb = Math.round((estimate.usage || 0) / 1024);
        if (usageKb > 1024) {
          setStorageEstimate(`${(usageKb / 1024).toFixed(2)} MB`);
        } else {
          setStorageEstimate(`${usageKb} KB`);
        }
      }).catch(() => {
        setStorageEstimate('Local IndexedDB');
      });
    } else {
      setStorageEstimate('Local IndexedDB');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleAutoCompare = () => {
    const updated = { ...prefs, autoCompareSnapshots: !prefs.autoCompareSnapshots };
    setPrefs(updated);
    localStorage.setItem('chronograph_preferences', JSON.stringify(updated));
  };

  const handleToggleBadges = () => {
    const updated = { ...prefs, showConfidenceBadges: !prefs.showConfidenceBadges };
    setPrefs(updated);
    localStorage.setItem('chronograph_preferences', JSON.stringify(updated));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-white"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 min-w-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="text-xs font-mono tracking-wider text-neutral-400 uppercase">
            Settings & Storage
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer p-1"
          >
            &times; Close
          </button>
        </div>

        {/* Setting Groups */}
        <div className="space-y-4 text-xs font-sans">
          {/* Storage & Local Data */}
          <div className="space-y-2">
            <div className="text-xs font-mono tracking-wider uppercase text-neutral-400">
              Local Device Storage
            </div>
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between font-mono">
              <div>
                <span className="text-xs text-white font-medium block">IndexedDB Sandbox</span>
                <span className="text-xs text-neutral-500">
                  {totalSnapshots} {totalSnapshots === 1 ? 'snapshot' : 'snapshots'} stored
                </span>
              </div>
              <span className="text-xs text-white bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700 tabular-nums">
                {storageEstimate}
              </span>
            </div>
          </div>

          {/* Analysis Preferences */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-mono tracking-wider uppercase text-neutral-400">
              Preferences
            </div>
            
            <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="pr-4">
                <span className="text-xs font-medium text-white block">
                  Automatic Check-in Comparison
                </span>
                <span className="text-xs text-neutral-500 leading-relaxed">
                  Automatically calculate differences when a second archive is added.
                </span>
              </div>
              <button
                onClick={handleToggleAutoCompare}
                className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 relative shrink-0 ${
                  prefs.autoCompareSnapshots ? 'bg-white' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full transition transform ${
                    prefs.autoCompareSnapshots ? 'translate-x-5 bg-black' : 'translate-x-0 bg-neutral-400'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="pr-4">
                <span className="text-xs font-medium text-white block">
                  Source Confidence Badges
                </span>
                <span className="text-xs text-neutral-500 leading-relaxed">
                  Show badges distinguishing export archives from API syncs.
                </span>
              </div>
              <button
                onClick={handleToggleBadges}
                className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 relative shrink-0 ${
                  prefs.showConfidenceBadges ? 'bg-white' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full transition transform ${
                    prefs.showConfidenceBadges ? 'translate-x-5 bg-black' : 'translate-x-0 bg-neutral-400'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          {confirmPurge ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onPurgeData();
                  setConfirmPurge(false);
                  onClose();
                }}
                className="py-1.5 px-3 bg-red-600 text-white text-xs font-mono rounded transition cursor-pointer"
              >
                Confirm Delete All Data
              </button>
              <button
                onClick={() => setConfirmPurge(false)}
                className="py-1.5 px-3 bg-neutral-800 text-white text-xs font-mono rounded transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmPurge(true)}
              className="text-xs font-mono text-red-400 hover:underline transition cursor-pointer"
            >
              Wipe Local Records
            </button>
          )}

          <span className="text-xs font-mono text-neutral-500">
            Follow Signal
          </span>
        </div>
      </div>
    </div>
  );
};
