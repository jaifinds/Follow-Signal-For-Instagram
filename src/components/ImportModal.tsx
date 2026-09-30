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
  const [currentStage, setCurrentStage] = useState<'IDLE' | 'READING' | 'PARSING' | 'RESOLVING' | 'BUILDING'>('IDLE');
  const [stageDescription, setStageDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processFile = async (fileOrBlob: File | Blob, fileName: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentStage('READING');
    setStageDescription('Reading archive in browser memory...');

    try {
      const parseResult = await parseUploadedExport(fileOrBlob, (msg, pct) => {
        if (pct < 40) {
          setCurrentStage('PARSING');
          setStageDescription('Decompressing and parsing JSON relationship files...');
        } else if (pct < 80) {
          setCurrentStage('RESOLVING');
          setStageDescription('Executing mathematical set operations (mutuals, unreciprocated)...');
        } else {
          setCurrentStage('BUILDING');
          setStageDescription('Compiling verified snapshot and metadata...');
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
        className="w-full max-w-xl bg-[#0A0A0A] border border-[#1C1C1A] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-7 text-[#F5F5F2]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1C1C1A] pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FF3048]" />
            <span className="text-xs font-mono tracking-widest text-[#9A9A96] uppercase">
              LOCAL ARCHIVE INGESTION
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#5F5F5B] hover:text-[#F5F5F2] transition cursor-pointer"
          >
            [Close]
          </button>
        </div>

        {/* Process Stages Indicator */}
        <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
          <div
            className={`p-2 rounded border ${
              currentStage === 'READING'
                ? 'bg-[#141414] border-[#FF3048] text-[#F5F5F2]'
                : currentStage !== 'IDLE'
                ? 'bg-[#050505] border-[#1C1C1A] text-[#2E9E60]'
                : 'bg-[#050505] border-[#141414] text-[#5F5F5B]'
            }`}
          >
            01 READ
          </div>
          <div
            className={`p-2 rounded border ${
              currentStage === 'PARSING'
                ? 'bg-[#141414] border-[#FF3048] text-[#F5F5F2]'
                : currentStage === 'RESOLVING' || currentStage === 'BUILDING'
                ? 'bg-[#050505] border-[#1C1C1A] text-[#2E9E60]'
                : 'bg-[#050505] border-[#141414] text-[#5F5F5B]'
            }`}
          >
            02 PARSE
          </div>
          <div
            className={`p-2 rounded border ${
              currentStage === 'RESOLVING'
                ? 'bg-[#141414] border-[#FF3048] text-[#F5F5F2]'
                : currentStage === 'BUILDING'
                ? 'bg-[#050505] border-[#1C1C1A] text-[#2E9E60]'
                : 'bg-[#050505] border-[#141414] text-[#5F5F5B]'
            }`}
          >
            03 RESOLVE
          </div>
          <div
            className={`p-2 rounded border ${
              currentStage === 'BUILDING'
                ? 'bg-[#141414] border-[#FF3048] text-[#F5F5F2]'
                : 'bg-[#050505] border-[#141414] text-[#5F5F5B]'
            }`}
          >
            04 SNAPSHOT
          </div>
        </div>

        {/* Drag & Drop Target or Active Processing View */}
        {isProcessing ? (
          <div className="py-14 text-center space-y-4 bg-[#050505] border border-[#1C1C1A] rounded-xl p-6">
            <div className="w-7 h-7 border-2 border-[#FF3048] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-mono font-bold text-[#F5F5F2] uppercase">
                Executing Local Analysis
              </p>
              <p className="text-xs font-sans text-[#9A9A96]">
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
            className={`py-12 px-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
              isDragging
                ? 'border-[#FF3048] bg-[#141414]'
                : 'border-[#1C1C1A] hover:border-[#262624] bg-[#050505]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".zip,.json,.html,.csv"
              className="hidden"
            />
            <div className="space-y-2.5">
              <div className="text-2xl font-mono text-[#5F5F5B]">↓</div>
              <p className="text-sm font-sans font-semibold text-[#F5F5F2]">
                Select Instagram Export ZIP or JSON
              </p>
              <p className="text-xs font-sans text-[#5F5F5B]">
                Drag and drop your file here, or click to browse.
              </p>
            </div>
          </div>
        )}

        {/* Error Message if Any */}
        {errorMsg && (
          <div className="p-3.5 bg-[#2A0B0E] border border-[#4A141A] rounded-xl text-xs font-sans text-[#FF3048] text-left">
            {errorMsg}
          </div>
        )}

        {/* Instructions & Secondary Options */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#5F5F5B]">
          <span>Supports: ZIP, JSON, HTML, CSV</span>

          <button
            onClick={handleLoadBaselineFixture}
            disabled={isProcessing}
            className="hover:text-[#9A9A96] underline cursor-pointer disabled:opacity-50"
          >
            Load verified sample (163 accounts) →
          </button>
        </div>
      </div>
    </div>
  );
};
