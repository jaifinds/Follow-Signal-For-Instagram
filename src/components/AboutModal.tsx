import React from 'react';

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
  const [confirmingPurge, setConfirmingPurge] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#121212]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FBF9F5] border border-[#E8E4DC] p-8 sm:p-10 shadow-2xl space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E8E4DC] pb-4">
          <span className="text-xs font-mono tracking-widest text-[#6E6A63] uppercase">
            ABOUT FOLLOW SIGNAL
          </span>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#6E6A63] hover:text-[#121212] transition cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs font-sans text-[#6E6A63] leading-relaxed">
          <p className="text-base font-serif italic text-[#121212]">
            Quiet. Private by default.
          </p>

          <p>
            FOLLOW SIGNAL is a client-side relationship ledger designed for people who value privacy and clarity over algorithmic noise.
          </p>

          <div className="space-y-2 border-t border-b border-[#E8E4DC] py-4 font-mono text-[11px] text-[#121212]">
            <p>· Zero cloud servers: all ZIP files are parsed in browser memory.</p>
            <p>· Zero telemetry, analytics, or behavioral trackers.</p>
            <p>· Snapshots and relationship diffs are stored strictly on this device.</p>
          </div>

          <p>
            You can purge your local database at any time. When purged, all records are permanently deleted from your browser&apos;s storage.
          </p>
        </div>

        <div className="pt-4 border-t border-[#E8E4DC] flex justify-between items-center">
          {confirmingPurge ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono text-[#B83A2E] font-semibold">
                Delete all local records?
              </span>
              <button
                onClick={() => {
                  onPurgeData();
                  onClose();
                }}
                className="px-2.5 py-1 bg-[#B83A2E] text-white text-xs font-mono cursor-pointer hover:bg-[#962A20] transition"
              >
                Yes, purge
              </button>
              <button
                onClick={() => setConfirmingPurge(false)}
                className="text-xs font-mono text-[#6E6A63] hover:text-[#121212] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingPurge(true)}
              className="text-xs font-mono text-[#B83A2E] hover:underline cursor-pointer"
            >
              Purge local database
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#121212] text-[#FBF9F5] text-xs font-sans uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
