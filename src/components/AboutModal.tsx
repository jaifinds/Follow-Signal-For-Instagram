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
        className="w-full max-w-lg bg-[#0A0A0A] border border-[#1C1C1A] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-[#F5F5F2]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1C1C1A] pb-3.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#FF3048]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#9A9A96] uppercase">
              ABOUT FOLLOW SIGNAL
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#5F5F5B] hover:text-[#F5F5F2] transition cursor-pointer"
          >
            [Close]
          </button>
        </div>

        <div className="space-y-4 text-xs font-sans text-[#9A9A96] leading-relaxed">
          <p className="text-xl font-serif italic text-[#F5F5F2]">
            Quiet. Private by default.
          </p>

          <p>
            Follow Signal is a private relationship intelligence tool engineered for individuals who value mathematical transparency, data sovereignty, and privacy over algorithmically manipulated feeds.
          </p>

          <div className="space-y-2.5 bg-[#050505] border border-[#1C1C1A] rounded-xl p-4 font-mono text-[11px] text-[#F5F5F2]">
            <p className="flex items-center space-x-2">
              <span className="text-[#2E9E60]">✓</span>
              <span>100% In-Browser Archive Processing via Web Workers & JSZip.</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-[#2E9E60]">✓</span>
              <span>Zero credential scraping, passwords, or bot automations.</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-[#2E9E60]">✓</span>
              <span>Official Meta OAuth 2.0 integration for verified totals.</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-[#2E9E60]">✓</span>
              <span>Compliant with GDPR & CCPA Data Portability Standards.</span>
            </p>
          </div>

          <p className="text-[11px] text-[#5F5F5B]">
            All archive files are decrypted and stored locally in your browser&apos;s sandboxed storage. You retain complete ownership and can permanently wipe records at any time.
          </p>
        </div>

        <div className="pt-3 border-t border-[#1C1C1A] flex justify-between items-center">
          {confirmingPurge ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onPurgeData();
                  setConfirmingPurge(false);
                  onClose();
                }}
                className="py-1.5 px-3 bg-[#FF3048] hover:bg-[#E62E40] text-white rounded-lg text-xs font-mono font-bold cursor-pointer"
              >
                Permanently delete all data
              </button>
              <button
                onClick={() => setConfirmingPurge(false)}
                className="py-1.5 px-3 border border-[#262624] text-[#9A9A96] text-xs font-mono rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingPurge(true)}
              className="text-xs font-mono text-[#5F5F5B] hover:text-[#FF3048] transition cursor-pointer"
            >
              Wipe local storage records
            </button>
          )}

          <span className="text-[10px] font-mono text-[#5F5F5B]">v2.5.0 · Production</span>
        </div>
      </div>
    </div>
  );
};
