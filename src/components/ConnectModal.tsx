import React, { useState, useEffect } from 'react';
import { InstagramClient } from '../lib/instagramClient';
import { InstagramConnectionState } from '../providers/instagram/instagramTypes';
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
  onSnapshotCreated,
  onAccountConnected,
  onAccountDisconnected,
}) => {
  const [connection, setConnection] = useState<InstagramConnectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string>('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setIsUnavailable(false);

    InstagramClient.getStatus()
      .then(conn => {
        if (isMounted) {
          setConnection(conn);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartOAuth = async () => {
    setConnecting(true);
    setIsUnavailable(false);

    try {
      const auth = await InstagramClient.getAuthUrl();
      if (auth.configured && auth.url) {
        window.location.href = auth.url;
      } else {
        setConnecting(false);
        setIsUnavailable(true);
        setUnavailableMessage(
          auth.message ||
            'Instagram connection is currently in developer sandbox mode. Use archive import for full analysis.'
        );
      }
    } catch {
      setConnecting(false);
      setIsUnavailable(true);
      setUnavailableMessage(
        'Instagram service unreachable. Use archive import for full analysis.'
      );
    }
  };

  const handleSyncLatest = async () => {
    setSyncing(true);
    try {
      const result = await InstagramClient.syncLatest();
      setConnection(prev =>
        prev ? ({ ...prev, account: result.account, lastSynced: result.lastSynced } as any) : null
      );
      if (onSnapshotCreated && result.snapshot) {
        onSnapshotCreated(result.snapshot);
      }
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await InstagramClient.disconnect();
      setConnection({
        connected: false,
        account: null,
        permissions: [],
        limitations: { hasFollowerRosters: false, reason: 'Disconnected' },
      });
      setConfirmDisconnect(false);
      if (onAccountDisconnected) {
        onAccountDisconnected();
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 text-white min-w-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="text-xs font-mono tracking-wider text-neutral-400 uppercase">
            Instagram Connection
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer p-1"
          >
            &times; Close
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-neutral-400">Checking connection status...</p>
          </div>
        ) : isUnavailable ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2 text-center">
              <h3 className="text-base font-semibold text-white">
                Archive Import Available
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                {unavailableMessage ||
                  'You can import your Instagram archive for complete relationship and unfollower analysis.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-lg transition cursor-pointer text-center"
              >
                Import Archive Instead &rarr;
              </button>
              <button
                onClick={handleStartOAuth}
                className="w-full py-2 px-4 text-neutral-400 hover:text-white bg-white/[0.04] rounded-lg text-xs font-mono transition cursor-pointer text-center"
              >
                Try Direct Connect Again
              </button>
            </div>
          </div>
        ) : connection?.connected && connection.account ? (
          /* Connected State */
          <div className="space-y-4">
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center space-x-3">
                {connection.account.profilePictureUrl ? (
                  <img
                    src={connection.account.profilePictureUrl}
                    alt={connection.account.username}
                    className="w-9 h-9 rounded-full border border-emerald-500 object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-xs font-mono">
                    {connection.account.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-white font-mono">
                      @{connection.account.username}
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {connection.account.accountType || 'Professional Account'}
                  </p>
                </div>
              </div>

              {/* Verified Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-800 text-center font-mono">
                <div>
                  <div className="text-sm font-bold text-white tabular-nums">
                    {connection.account.followersCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-500">Followers</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-white tabular-nums">
                    {connection.account.followsCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-500">Following</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-white tabular-nums">
                    {connection.account.mediaCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-500">Media</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSyncLatest}
                disabled={syncing}
                className="w-full py-2.5 px-4 bg-white text-black font-semibold text-xs rounded-lg transition cursor-pointer disabled:opacity-50 hover:bg-neutral-200"
              >
                {syncing ? 'Syncing...' : 'Sync Latest Metrics'}
              </button>

              {confirmDisconnect ? (
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 py-2 px-3 bg-red-600 text-white text-xs font-medium rounded-lg cursor-pointer"
                  >
                    Confirm Disconnect
                  </button>
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    className="py-2 px-3 bg-neutral-800 text-white text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDisconnect(true)}
                  className="w-full py-2 px-4 text-red-400 hover:underline text-xs font-mono transition cursor-pointer text-center"
                >
                  Disconnect Account
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Not Connected State */
          <div className="space-y-4 py-2">
            <div className="space-y-2 text-center">
              <h3 className="text-base font-semibold text-white">
                Direct Instagram Sync
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Authorize directly with Instagram to confirm official account metrics and ownership.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={handleStartOAuth}
                disabled={connecting}
                className="w-full py-2.5 px-5 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-lg transition cursor-pointer text-center disabled:opacity-50"
              >
                {connecting ? 'Redirecting...' : 'Connect With Instagram'}
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-white/[0.04] border border-white/[0.1] text-white text-xs font-medium rounded-lg transition cursor-pointer text-center"
              >
                Import Archive Instead
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 font-mono text-center pt-1 leading-relaxed">
              Meta Graph API provides verified totals. For individual unfollower handles, use Archive Import.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
