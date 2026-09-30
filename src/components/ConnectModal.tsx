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
            'Instagram connection is temporarily unavailable. You can still import your Instagram archive.'
        );
      }
    } catch {
      setConnecting(false);
      setIsUnavailable(true);
      setUnavailableMessage(
        'Instagram connection is temporarily unavailable. You can still import your Instagram archive.'
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
        className="w-full max-w-md bg-[#0A0A0A] border border-[#1C1C1A] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 text-[#F5F5F2]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1C1C1A] pb-3.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#FF3048]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#9A9A96] uppercase">
              INSTAGRAM CONNECTION
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#5F5F5B] hover:text-[#F5F5F2] transition cursor-pointer"
          >
            [Close]
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-[#FF3048] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#5F5F5B]">Checking connection status...</p>
          </div>
        ) : isUnavailable ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#2A0B0E] border border-[#4A141A] mx-auto flex items-center justify-center text-sm text-[#FF3048]">
                !
              </div>
              <h3 className="text-base font-sans font-bold text-[#F5F5F2]">
                Instagram connection is temporarily unavailable.
              </h3>
              <p className="text-xs text-[#9A9A96] leading-relaxed max-w-sm mx-auto">
                {unavailableMessage ||
                  'You can still import your Instagram archive for complete relationship analysis.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="w-full py-3 px-4 bg-[#F5F5F2] hover:bg-white text-black text-xs font-sans font-semibold rounded-xl transition cursor-pointer text-center"
              >
                Import archive instead
              </button>
              <button
                onClick={handleStartOAuth}
                className="w-full py-2.5 px-4 text-[#5F5F5B] hover:text-[#F5F5F2] text-xs font-mono transition cursor-pointer text-center"
              >
                Try again
              </button>
            </div>
          </div>
        ) : connection?.connected && connection.account ? (
          /* Connected State */
          <div className="space-y-5">
            <div className="p-4 bg-[#050505] border border-[#1C1C1A] rounded-xl space-y-4">
              <div className="flex items-center space-x-3.5">
                {connection.account.profilePictureUrl ? (
                  <img
                    src={connection.account.profilePictureUrl}
                    alt={connection.account.username}
                    className="w-12 h-12 rounded-full border border-[#262624] object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#262624] text-[#F5F5F2] flex items-center justify-center font-bold text-sm font-mono">
                    {connection.account.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-base font-bold text-[#F5F5F2] font-mono">
                      @{connection.account.username}
                    </h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E9E60]" />
                  </div>
                  <p className="text-xs text-[#9A9A96]">
                    {connection.account.accountType || 'Professional Account'}
                  </p>
                  <p className="text-[10px] font-mono text-[#5F5F5B] mt-0.5">
                    Last synced: {new Date(connection.account.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Verified Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1C1C1A] text-center font-mono">
                <div className="bg-[#0A0A0A] p-2 rounded-lg border border-[#141414]">
                  <div className="text-sm font-bold text-[#F5F5F2]">
                    {connection.account.followersCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#5F5F5B]">Followers</div>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded-lg border border-[#141414]">
                  <div className="text-sm font-bold text-[#F5F5F2]">
                    {connection.account.followsCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#5F5F5B]">Following</div>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded-lg border border-[#141414]">
                  <div className="text-sm font-bold text-[#F5F5F2]">
                    {connection.account.mediaCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#5F5F5B]">Media</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSyncLatest}
                disabled={syncing}
                className="w-full py-2.5 px-4 bg-[#F5F5F2] hover:bg-white text-black text-xs font-sans font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync latest metrics'}
              </button>

              {confirmDisconnect ? (
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 py-2 px-3 bg-[#FF3048] hover:bg-[#E62E40] text-white text-xs font-sans rounded-xl cursor-pointer"
                  >
                    Confirm disconnect
                  </button>
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    className="py-2 px-3 border border-[#262624] text-[#9A9A96] text-xs font-sans rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDisconnect(true)}
                  className="w-full py-2.5 px-4 text-[#FF3048] hover:bg-[#2A0B0E] text-xs font-sans font-medium rounded-xl transition cursor-pointer"
                >
                  Disconnect account
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Not Connected State */
          <div className="space-y-5 py-2">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-sans font-bold text-[#F5F5F2] tracking-tight">
                Connect your Instagram
              </h3>
              <p className="text-xs text-[#9A9A96] leading-relaxed max-w-sm mx-auto">
                Authorize directly with Instagram to sync verified account totals and confirm official ownership.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                onClick={handleStartOAuth}
                disabled={connecting}
                className="w-full py-3.5 px-5 bg-[#F5F5F2] hover:bg-white text-black text-xs font-sans font-semibold tracking-wider uppercase rounded-xl transition cursor-pointer text-center disabled:opacity-50 shadow-sm"
              >
                {connecting ? 'Redirecting to Instagram...' : 'Connect Instagram'}
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="w-full py-2.5 px-4 border border-[#1C1C1A] hover:bg-[#141414] hover:border-[#262624] text-[#F5F5F2] text-xs font-sans font-medium rounded-xl transition cursor-pointer text-center"
              >
                Import archive instead
              </button>
            </div>

            <p className="text-[11px] text-[#5F5F5B] font-mono text-center pt-1 leading-relaxed">
              Meta Graph API provides aggregate totals. For granular individual follower rosters, use Archive Import.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
