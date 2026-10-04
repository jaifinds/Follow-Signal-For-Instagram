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
        className="w-full max-w-lg bg-[#131418] border border-white/[0.08] rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 min-w-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Vault Configuration & Storage
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#8E909D] hover:text-white transition cursor-pointer p-1"
          >
            &times; Close
          </button>
        </div>

        {/* Setting Groups */}
        <div className="space-y-4 text-xs font-sans">
          {/* Storage & Local Data */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono tracking-widest uppercase text-[#8E909D]">
              Local Device Storage
            </div>
            <div className="p-4 bg-[#0C0D0F] border border-white/[0.08] rounded-lg flex items-center justify-between font-mono">
              <div>
                <span className="text-xs text-white font-medium block">IndexedDB Vault Sandbox</span>
                <span className="text-[11px] text-[#8E909D]">
                  {totalSnapshots} {totalSnapshots === 1 ? 'checkpoint' : 'checkpoints'} stored
                </span>
              </div>
              <span className="text-xs text-white bg-[#1A1C22] px-3 py-1.5 rounded border border-white/[0.08] tabular-nums">
                {storageEstimate}
              </span>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono tracking-widest uppercase text-[#8E909D]">
              Evaluation Rules
            </div>

            <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-lg bg-[#0C0D0F]">
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-white font-medium block">Auto-diff new checkpoints</span>
                  <span className="text-[11px] text-[#8E909D]">
                    Automatically compare newly imported archives against preceding snapshots.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.autoCompareSnapshots}
                  onChange={handleToggleAutoCompare}
                  className="accent-white cursor-pointer w-4 h-4"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-white font-medium block">Verified integrity badges</span>
                  <span className="text-[11px] text-[#8E909D]">
                    Display verification indicators next to accounts with confirmed reciprocal status.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.showConfidenceBadges}
                  onChange={handleToggleBadges}
                  className="accent-white cursor-pointer w-4 h-4"
                />
              </div>
            </div>
          </div>

          {/* Purge Local Data */}
          <div className="pt-2">
            <div className="p-4 bg-[#D94444]/10 border border-[#D94444]/25 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-white font-medium block">Reset Vault Storage</span>
                <span className="text-[11px] text-[#8E909D]">
                  Permanently deletes all locally stored snapshots, notes, and activity history.
                </span>
              </div>

              {confirmPurge ? (
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      onPurgeData();
                      setConfirmPurge(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-[#D94444] text-white text-xs font-mono rounded cursor-pointer"
                  >
                    Confirm Wipe
                  </button>
                  <button
                    onClick={() => setConfirmPurge(false)}
                    className="px-3 py-1.5 bg-[#1A1C22] text-white text-xs font-mono rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmPurge(true)}
                  className="px-3 py-1.5 bg-transparent border border-[#D94444]/40 hover:bg-[#D94444]/20 text-[#D94444] text-xs font-mono rounded transition cursor-pointer shrink-0"
                >
                  Wipe Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
