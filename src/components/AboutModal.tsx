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
        className="w-full max-w-lg bg-[#131418] border border-white/[0.08] rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 text-white min-w-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Protocol Overview
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#8E909D] hover:text-white transition cursor-pointer p-1"
          >
            &times; Close
          </button>
        </div>

        <div className="space-y-4 text-xs text-[#8E909D] leading-relaxed">
          <h3 className="text-xl font-light text-white tracking-tight">
            Client-Side Confidential Architecture
          </h3>

          <p>
            Follow Signal is engineered on a zero-knowledge local architecture. Your relationship data, follower rosters, and raw archives remain strictly inside your browser sandbox.
          </p>

          <div className="space-y-2 border-t border-b border-white/[0.08] py-3 text-xs font-mono text-[#D1D3DC]">
            <p className="flex items-center space-x-2">
              <span className="text-white">&bull;</span>
              <span>In-Browser Evaluation: Archives parsed locally via JSZip.</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-white">&bull;</span>
              <span>Zero Credentials: We never request or store your Instagram credentials.</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-white">&bull;</span>
              <span>IndexedDB Persistence: Snapshots saved locally on your machine.</span>
            </p>
          </div>

          <p className="text-[11px] text-[#565866]">
            All relationship snapshots are stored locally in IndexedDB. You can wipe all local records at any time.
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
                className="py-1.5 px-3 bg-[#D94444] text-white rounded text-xs font-mono cursor-pointer"
              >
                Confirm Delete All Records
              </button>
              <button
                onClick={() => setConfirmingPurge(false)}
                className="py-1.5 px-3 bg-[#1A1C22] text-white text-xs font-mono rounded cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingPurge(true)}
              className="text-xs font-mono text-[#D94444] hover:underline transition cursor-pointer"
            >
              Wipe Local Vault Storage
            </button>
          )}

          <span className="text-[10px] font-mono text-[#565866]">Follow Signal</span>
        </div>
      </div>
    </div>
  );
};
