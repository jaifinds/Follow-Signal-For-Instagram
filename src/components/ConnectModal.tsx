import React, { useState } from 'react';
import { Snapshot } from '../types';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImport: () => void;
  onSnapshotCreated?: (snapshot: Snapshot) => void;
  onAccountConnected?: (username: string) => void;
  onAccountDisconnected?: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onOpenImport,
}) => {
  const [activeTab, setActiveTab] = useState<'GUIDE' | 'SECURITY'>('GUIDE');

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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Instagram Vault Guidance
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#8E909D] hover:text-white transition cursor-pointer p-1"
          >
            &times; Close
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-1 p-0.5 bg-[#0C0D0F] border border-white/[0.08] rounded">
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`flex-1 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
              activeTab === 'GUIDE' ? 'bg-[#1A1C22] text-white font-semibold' : 'text-[#8E909D] hover:text-white'
            }`}
          >
            How to Export Archive
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex-1 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
              activeTab === 'SECURITY' ? 'bg-[#1A1C22] text-white font-semibold' : 'text-[#8E909D] hover:text-white'
            }`}
          >
            Privacy Architecture
          </button>
        </div>

        {activeTab === 'GUIDE' ? (
          <div className="space-y-4 text-xs">
            <p className="text-[#8E909D] leading-relaxed">
              Meta provides your full relationship data directly through the official Instagram app or web client. It takes less than 2 minutes to request:
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded flex items-start space-x-3">
                <span className="text-white font-bold shrink-0">01</span>
                <div>
                  <span className="text-white font-medium block">Open Accounts Center</span>
                  <span className="text-[#8E909D] text-[11px] block mt-0.5">
                    In Instagram &rarr; Settings &rarr; Accounts Center &rarr; Your information and permissions.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded flex items-start space-x-3">
                <span className="text-white font-bold shrink-0">02</span>
                <div>
                  <span className="text-white font-medium block">Select Download Information</span>
                  <span className="text-[#8E909D] text-[11px] block mt-0.5">
                    Click &quot;Download your information&quot; &rarr; Choose &quot;Followers and following&quot; or full export.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded flex items-start space-x-3">
                <span className="text-white font-bold shrink-0">03</span>
                <div>
                  <span className="text-white font-medium block">Choose JSON format</span>
                  <span className="text-[#8E909D] text-[11px] block mt-0.5">
                    Set Format: JSON & Date range: All time. Instagram sends the download link to your email.
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenImport();
              }}
              className="w-full py-3 bg-white hover:bg-neutral-100 text-[#0C0D0F] font-semibold text-xs tracking-wider uppercase rounded transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] shadow-sm"
            >
              <span>I Have My ZIP Archive &rarr; Import Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-[#8E909D] leading-relaxed">
            <h4 className="text-sm font-medium text-white">
              Why Official Archive Export is Superior:
            </h4>

            <ul className="space-y-2 font-mono text-[11px]">
              <li className="flex items-start space-x-2">
                <span className="text-white">&bull;</span>
                <span>Zero Account Risk: No scraping, no bot tokens, no password risk. Your Instagram account is 100% safe.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-white">&bull;</span>
                <span>100% Browser Sandbox: The ZIP archive is extracted and parsed strictly in client-side memory using JSZip.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-white">&bull;</span>
                <span>IndexedDB Storage: Snapshots and notes are saved locally on your device.</span>
              </li>
            </ul>

            <button
              onClick={() => {
                onClose();
                onOpenImport();
              }}
              className="w-full py-3 bg-white hover:bg-neutral-100 text-[#0C0D0F] font-semibold text-xs tracking-wider uppercase rounded transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <span>Open Archive Vault &rarr;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
