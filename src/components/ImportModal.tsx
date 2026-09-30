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
    // Security check: File size limit to prevent memory exhaustion
    if (fileOrBlob.size > MAX_ARCHIVE_SIZE_BYTES) {
      setErrorMsg(`Archive exceeds maximum supported size (100 MB). Size was ${(fileOrBlob.size / (1024 * 1024)).toFixed(1)} MB.`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentStage('READING');
    setStageDescription('Reading archive in browser memory sandbox...');

    try {
      const parseResult = await parseUploadedExport(fileOrBlob, (msg, pct) => {
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

  const handleLoadBaselineFixture = async () => {
    try {
      setIsProcessing(true);
      const zipBlob = await createOwnerExportZipBlob();
      await processFile(zipBlob, 'verified_baseline_export.zip');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load baseline dataset.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-white min-w-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="text-xs font-mono tracking-wider text-neutral-400 uppercase">
            Archive Import
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer p-1"
          >
            &times; Close
          </button>
        </div>

        {/* Process Stages Strip */}
        <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs border-b border-white/[0.08] pb-4">
          <div className={currentStage === 'READING' ? 'text-white font-bold' : currentStage !== 'IDLE' ? 'text-neutral-300' : 'text-neutral-600'}>
            01. Read
          </div>
          <div className={currentStage === 'PARSING' ? 'text-white font-bold' : currentStage === 'RESOLVING' || currentStage === 'BUILDING' ? 'text-neutral-300' : 'text-neutral-600'}>
            02. Parse
          </div>
          <div className={currentStage === 'RESOLVING' ? 'text-white font-bold' : currentStage === 'BUILDING' ? 'text-neutral-300' : 'text-neutral-600'}>
            03. Resolve
          </div>
          <div className={currentStage === 'BUILDING' ? 'text-white font-bold' : 'text-neutral-600'}>
            04. Snapshot
          </div>
        </div>

        {/* Ingestion Target or Active Processing View */}
        {isProcessing ? (
          <div className="py-14 text-center space-y-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-mono font-medium text-white uppercase tracking-wider">
                In-Browser Processing
              </p>
              <p className="text-xs font-sans text-neutral-400">
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
            className={`py-12 px-6 border border-dashed rounded-xl text-center cursor-pointer transition ${
              isDragging
                ? 'border-white bg-neutral-900'
                : 'border-neutral-700 hover:border-neutral-500 bg-neutral-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".zip,.json,.html,.csv"
              className="hidden"
            />
            <div className="space-y-2">
              <p className="text-sm font-sans font-medium text-white">
                Select your Instagram export (ZIP or JSON)
              </p>
              <p className="text-xs font-sans text-neutral-500">
                Drag and drop here, or click to browse. Max 100 MB.
              </p>
            </div>
          </div>
        )}

        {/* Error Message if Any */}
        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs font-sans text-red-300 text-left">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-neutral-400">
          <span>Formats: ZIP, JSON, HTML, CSV</span>

          <button
            onClick={handleLoadBaselineFixture}
            disabled={isProcessing}
            className="text-white hover:underline transition cursor-pointer disabled:opacity-50"
          >
            Load sample dataset (163 accounts) &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
