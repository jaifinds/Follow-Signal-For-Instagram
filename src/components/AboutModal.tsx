import React, { useState } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurgeData: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onPurgeData,
}) => {
  const [confirmingPurge, setConfirmingPurge] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 text-white min-w-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="text-xs font-mono tracking-wider text-neutral-400 uppercase">
            About Follow Signal
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer p-1"
          >
            &times; Close
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-neutral-300 leading-relaxed">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Client-Side Privacy Architecture
          </h3>

          <p>
            Follow Signal is built on a zero-knowledge local architecture. Your relationship data, follower rosters, and raw archives remain strictly inside your browser sandbox.
          </p>

          <div className="space-y-2 border-t border-b border-white/[0.08] py-3 text-xs font-mono text-white">
            <p className="flex items-center space-x-2">
              <span className="text-emerald-400">&bull;</span>
              <span>In-Browser Evaluation: Archives parsed using Web Workers.</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-emerald-400">&bull;</span>
              <span>Zero Passwords: We never request or store your Instagram credentials.</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-emerald-400">&bull;</span>
              <span>IndexedDB Persistence: Snapshots saved locally on your device.</span>
            </p>
          </div>

          <p className="text-xs text-neutral-500">
            All relationship snapshots are stored locally in IndexedDB. You can delete all local data at any time.
          </p>
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex justify-between items-center">
          {confirmingPurge ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onPurgeData();
                  setConfirmingPurge(false);
                  onClose();
                }}
                className="py-1.5 px-3 bg-red-600 text-white rounded text-xs font-mono cursor-pointer"
              >
                Confirm Delete All Data
              </button>
              <button
                onClick={() => setConfirmingPurge(false)}
                className="py-1.5 px-3 bg-neutral-800 text-white text-xs font-mono rounded cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingPurge(true)}
              className="text-xs font-mono text-red-400 hover:underline transition cursor-pointer"
            >
              Wipe Local Storage
            </button>
          )}

          <span className="text-xs font-mono text-neutral-500">Follow Signal</span>
        </div>
      </div>
    </div>
  );
};
