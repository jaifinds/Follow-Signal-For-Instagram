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
        setStorageEstimate('Unavailable');
      });
    } else {
      setStorageEstimate('Local-only');
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0A0A0A] border border-[#1C1C1A] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-[#F5F5F2]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1C1C1A] pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FF3048]" />
            <span className="text-xs font-mono tracking-widest text-[#9A9A96] uppercase">
              SETTINGS & PREFERENCES
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#5F5F5B] hover:text-[#F5F5F2] transition cursor-pointer"
          >
            [Close]
          </button>
        </div>

        {/* Setting Groups */}
        <div className="space-y-5 text-xs font-sans">
          {/* Storage & Local Data */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono tracking-wider uppercase text-[#9A9A96]">
              Local Device Storage
            </h4>
            <div className="p-3.5 bg-[#050505] border border-[#1C1C1A] rounded-xl flex items-center justify-between font-mono">
              <div>
                <span className="text-xs text-[#F5F5F2] block">Sandboxed IndexedDB</span>
                <span className="text-[11px] text-[#5F5F5B]">
                  {totalSnapshots} {totalSnapshots === 1 ? 'snapshot' : 'snapshots'} stored locally
                </span>
              </div>
              <span className="text-xs text-[#9A9A96] bg-[#141414] px-2.5 py-1 rounded border border-[#1C1C1A]">
                {storageEstimate}
              </span>
            </div>
          </div>

          {/* Relationship Analysis Automation */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono tracking-wider uppercase text-[#9A9A96]">
              Relationship Engine
            </h4>
            
            <div className="flex items-center justify-between p-3.5 bg-[#050505] border border-[#1C1C1A] rounded-xl">
              <div className="pr-4">
                <span className="text-xs font-medium text-[#F5F5F2] block">
                  Automatic Snapshot Comparison
                </span>
                <span className="text-[11px] text-[#5F5F5B] leading-relaxed">
                  Automatically calculate mathematical diffs against baseline on import.
                </span>
              </div>
              <button
                onClick={handleToggleAutoCompare}
                className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 relative shrink-0 ${
                  prefs.autoCompareSnapshots ? 'bg-[#FF3048]' : 'bg-[#222220]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition transform ${
                    prefs.autoCompareSnapshots ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#050505] border border-[#1C1C1A] rounded-xl">
              <div className="pr-4">
                <span className="text-xs font-medium text-[#F5F5F2] block">
                  Show Source Confidence Indicators
                </span>
                <span className="text-[11px] text-[#5F5F5B] leading-relaxed">
                  Display whether relationship metadata originates from export archive or Graph API.
                </span>
              </div>
              <button
                onClick={handleToggleBadges}
                className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 relative shrink-0 ${
                  prefs.showConfidenceBadges ? 'bg-[#FF3048]' : 'bg-[#222220]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition transform ${
                    prefs.showConfidenceBadges ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy & Architecture Note */}
          <div className="p-3.5 bg-[#080808] border border-[#1C1C1A] rounded-xl space-y-1.5 text-[11px] text-[#9A9A96] leading-relaxed">
            <span className="text-[#F5F5F2] font-semibold block">Privacy Architecture</span>
            <p>
              Follow Signal does not possess a cloud relationship database. All ZIP decompressions, parsing heuristics, and identity records exist solely in your client browser memory.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#1C1C1A] flex items-center justify-between">
          {confirmPurge ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onPurgeData();
                  setConfirmPurge(false);
                  onClose();
                }}
                className="py-1.5 px-3 bg-[#FF3048] hover:bg-[#E62E40] text-white text-xs font-mono font-bold rounded-lg transition cursor-pointer"
              >
                Confirm permanent wipe
              </button>
              <button
                onClick={() => setConfirmPurge(false)}
                className="py-1.5 px-3 border border-[#262624] text-[#9A9A96] text-xs font-mono rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmPurge(true)}
              className="text-xs font-mono text-[#5F5F5B] hover:text-[#FF3048] transition cursor-pointer"
            >
              Wipe all local records
            </button>
          )}

          <span className="text-[10px] font-mono text-[#5F5F5B]">
            Build v2.5 · Follow Signal
          </span>
        </div>
      </div>
    </div>
  );
};
