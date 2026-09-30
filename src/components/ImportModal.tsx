import React, { useState, useRef } from 'react';
import { Snapshot, RelationshipEvent } from '../types';
import { parseUploadedExport, buildSnapshotFromParseResult } from '../lib/exportParser';
import { compareSnapshots, generateEventsFromComparison } from '../lib/snapshotEngine';
import { createOwnerExportZipBlob } from '../fixtures/ownerExportZip';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSnapshots: Snapshot[];
  onImportComplete: (newSnapshot: Snapshot, newEvents: RelationshipEvent[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  currentSnapshots,
  onImportComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processFile = async (fileOrBlob: File | Blob, fileName: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setProgressState('Reading Instagram archive...');

    try {
      const parseResult = await parseUploadedExport(fileOrBlob, (msg, pct) => {
        if (pct < 50) {
          setProgressState('Decompressing and parsing JSON files...');
        } else if (pct < 85) {
          setProgressState('Calculating mutual relationships & sets...');
        } else {
          setProgressState('Finalizing relationship snapshot...');
        }
      });

      setProgressState('Building snapshot...');

      const prevSnap =
        currentSnapshots.length > 0 ? currentSnapshots[currentSnapshots.length - 1] : null;
      const isBaseline = prevSnap === null;

      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const label = `Archive ${dateStr}`;

      const newSnapshot = buildSnapshotFromParseResult(
        parseResult,
        label,
        'my_instagram',
        fileName,
        isBaseline
      );

      const comparison = prevSnap ? compareSnapshots(prevSnap, newSnapshot) : null;
      const newEvents = comparison
        ? generateEventsFromComparison(prevSnap, newSnapshot, comparison)
        : [];

      setProgressState('Done.');

      setTimeout(() => {
        onImportComplete(newSnapshot, newEvents);
        setIsProcessing(false);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Import processing error:', err);
      setIsProcessing(false);
      setErrorMsg(
        err.message ||
          'Could not read archive. Ensure this is an authentic Instagram JSON export ZIP.'
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      processFile(f, f.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      processFile(f, f.name);
    }
  };

  const handleLoadSample = async () => {
    try {
      const blob = await createOwnerExportZipBlob();
      await processFile(blob, 'instagram_verified_sample_export.zip');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate sample archive');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#121212]/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-[#E5E1D8] rounded-xl shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
          <span className="text-xs font-mono font-bold tracking-widest text-[#111111] uppercase">
            IMPORT INSTAGRAM ARCHIVE
          </span>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#6E6A63] hover:text-[#111111] transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Dropzone */}
        {!isProcessing ? (
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition flex flex-col items-center justify-center space-y-3.5 ${
              isDragging
                ? 'border-[#111111] bg-[#FAF8F5]'
                : 'border-[#D5D0C5] hover:border-[#111111] bg-[#FCFBF9]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center font-bold text-sm text-[#111111]">
              ZIP
            </div>

            <div>
              <p className="font-sans font-bold text-sm tracking-tight text-[#111111]">
                Drop your Instagram ZIP archive here
              </p>
              <p className="text-xs text-[#6E6A63] mt-0.5">
                or choose a file from your computer
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".zip,.json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-[#111111] hover:bg-[#2A2A2A] text-white text-xs font-sans font-medium uppercase tracking-wider rounded-lg transition cursor-pointer"
            >
              Choose file
            </button>

            <p className="text-[11px] text-[#99948B] font-mono pt-1">
              Supports official Instagram JSON exports. Processed 100% locally.
            </p>
          </div>
        ) : (
          /* Actual Progress States */
          <div className="p-10 text-center space-y-3 bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl">
            <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs font-bold text-[#111111]">
              {progressState}
            </p>
            <p className="text-xs text-[#6E6A63] font-sans">
              Processing in browser memory...
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 bg-[#FBEBEA] border border-[#E8C2BE] rounded-lg text-xs font-sans text-[#B83A2E] space-y-1">
            <p className="font-bold">COULDN&apos;T READ ARCHIVE</p>
            <p className="text-[11px] leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Quick Sample Trigger */}
        {!isProcessing && (
          <div className="text-center pt-1 border-t border-[#F0ECE1]">
            <button
              onClick={handleLoadSample}
              className="text-xs text-[#6E6A63] hover:text-[#111111] underline underline-offset-4 font-mono transition cursor-pointer"
            >
              Load verified regression archive (163 followers)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
