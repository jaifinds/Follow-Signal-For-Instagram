import React, { useState, useRef } from 'react';
import { Snapshot, RelationshipEvent } from '../types';
import { parseUploadedExport, buildSnapshotFromParseResult } from '../lib/exportParser';
import { compareSnapshots, generateEventsFromComparison } from '../lib/snapshotEngine';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSnapshots: Snapshot[];
  onImportComplete: (newSnapshot: Snapshot, newEvents: RelationshipEvent[]) => void;
}

const MAX_ARCHIVE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB safety limit

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  currentSnapshots,
  onImportComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<'IDLE' | 'READING' | 'PARSING' | 'RESOLVING' | 'BUILDING'>('IDLE');
  const [stageDescription, setStageDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processFile = async (fileOrBlob: File | Blob, fileName: string) => {
    if (fileOrBlob.size > MAX_ARCHIVE_SIZE_BYTES) {
      setErrorMsg(`Archive exceeds maximum supported size (100 MB). Size was ${(fileOrBlob.size / (1024 * 1024)).toFixed(1)} MB.`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentStage('READING');
    setStageDescription('Reading archive in browser memory sandbox...');

    try {
      const parseResult = await parseUploadedExport(fileOrBlob, (_msg, pct) => {
        if (pct < 40) {
          setCurrentStage('PARSING');
          setStageDescription('Decompressing archive and indexing relationship files...');
        } else if (pct < 80) {
          setCurrentStage('RESOLVING');
          setStageDescription('Calculating set differences (mutual bonds, unreciprocated following)...');
        } else {
          setCurrentStage('BUILDING');
          setStageDescription('Finalizing snapshot and compiling verified state...');
        }
      });

      setCurrentStage('BUILDING');
      setStageDescription('Comparing against previous snapshots for historical deltas...');

      const prevSnap =
        currentSnapshots.length > 0 ? currentSnapshots[currentSnapshots.length - 1] : null;
      const isBaseline = prevSnap === null;

      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const label = `Archive · ${dateStr}`;

      const newSnapshot = buildSnapshotFromParseResult(
        parseResult,
        label,
        'local_user',
        fileName,
        isBaseline
      );

      let events: RelationshipEvent[] = [];
      if (!isBaseline && prevSnap) {
        const diff = compareSnapshots(prevSnap, newSnapshot);
        events = generateEventsFromComparison(prevSnap, newSnapshot, diff);
      } else {
        events = [
          {
            id: `evt_init_${Date.now()}`,
            userId: 'local_user',
            subjectUsername: 'workspace',
            eventType: 'SNAPSHOT_IMPORTED',
            detectedAt: new Date().toISOString(),
            effectiveAt: new Date().toISOString(),
            sourceSnapshotId: newSnapshot.id,
            previousState: 'NONE',
            newState: 'NONE',
            confidence: 'CONFIRMED',
            summary: `Baseline snapshot established: ${newSnapshot.followersCount} followers, ${newSnapshot.followingCount} following, ${newSnapshot.mutualCount} mutuals.`,
          },
        ];
      }

      onImportComplete(newSnapshot, events);
      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      console.error('Import failed:', err);
      setIsProcessing(false);
      setCurrentStage('IDLE');
      setErrorMsg(
        err.message ||
          'Failed to parse archive. Ensure this is an authentic Instagram Data Download (ZIP or JSON).'
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file, file.name);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file, file.name);
    }
  };

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
            Archive Vault Ingestion
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#8E909D] hover:text-white transition cursor-pointer p-1"
          >
            &times; Close
          </button>
        </div>

        {/* Process Stages Strip */}
        <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px] border-b border-white/[0.08] pb-4">
          <div className={currentStage === 'READING' ? 'text-white font-semibold' : currentStage !== 'IDLE' ? 'text-[#D1D3DC]' : 'text-[#565866]'}>
            01. Read
          </div>
          <div className={currentStage === 'PARSING' ? 'text-white font-semibold' : currentStage === 'RESOLVING' || currentStage === 'BUILDING' ? 'text-[#D1D3DC]' : 'text-[#565866]'}>
            02. Parse
          </div>
          <div className={currentStage === 'RESOLVING' ? 'text-white font-semibold' : currentStage === 'BUILDING' ? 'text-[#D1D3DC]' : 'text-[#565866]'}>
            03. Resolve
          </div>
          <div className={currentStage === 'BUILDING' ? 'text-white font-semibold' : 'text-[#565866]'}>
            04. Vault
          </div>
        </div>

        {/* Ingestion Target or Active Processing View */}
        {isProcessing ? (
          <div className="py-14 text-center space-y-4 bg-[#0C0D0F] border border-white/[0.08] rounded-lg p-6">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-mono font-medium text-white uppercase tracking-widest">
                Local Memory Evaluation
              </p>
              <p className="text-xs text-[#8E909D]">
                {stageDescription}
              </p>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`py-12 px-6 border border-dashed rounded-lg text-center cursor-pointer transition ${
              isDragging
                ? 'border-white bg-[#1A1C22]'
                : 'border-white/20 hover:border-white/40 bg-[#0C0D0F]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".zip,.json"
              className="hidden"
            />
            <div className="space-y-2">
              <svg className="w-8 h-8 mx-auto text-[#8E909D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs font-medium text-white tracking-wide">
                Drop your official Instagram export (ZIP or JSON)
              </p>
              <p className="text-[11px] text-[#565866]">
                Click to browse files. Evaluated 100% locally in your browser.
              </p>
            </div>
          </div>
        )}

        {/* Error Message if Any */}
        {errorMsg && (
          <div className="p-3 bg-[#D94444]/10 border border-[#D94444]/30 rounded-lg text-xs text-[#D94444] text-left">
            {errorMsg}
          </div>
        )}

        {/* Footer Guidance */}
        <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#8E909D]">
          <span>Supported: ZIP, JSON</span>
          <span>Zero Server Uploads</span>
        </div>
      </div>
    </div>
  );
};
