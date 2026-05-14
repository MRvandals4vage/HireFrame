import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import type { EvaluationMode } from '../types';

interface Props {
  resumeText: string;
  setResumeText: (text: string) => void;
  targetRole: string;
  setTargetRole: (role: string) => void;
  evaluationMode: EvaluationMode;
  setEvaluationMode: (mode: EvaluationMode) => void;
  onStart: () => void;
}

const EVALUATION_MODES: { mode: EvaluationMode; label: string; desc: string }[] = [
  { mode: 'FAANG',               label: 'FAANG',               desc: 'Algorithms, scale, systems'   },
  { mode: 'Startup',             label: 'Startup',             desc: 'Velocity, ownership, product'  },
  { mode: 'Research Lab',        label: 'Research Lab',        desc: 'Depth, rigor, publications'    },
  { mode: 'Fintech',             label: 'Fintech',             desc: 'Reliability, compliance, data'  },
  { mode: 'ML Engineering',      label: 'ML Engineering',      desc: 'Models, pipelines, benchmarks' },
  { mode: 'Frontend Engineering',label: 'Frontend',            desc: 'UX depth, perf, architecture'  },
];

const recruiters = [
  { initials: 'AX', name: 'Alex',  role: 'Staff Engineer', color: '#B03A2E' },
  { initials: 'MY', name: 'Maya',  role: 'Eng Manager',    color: '#1A8A65' },
  { initials: 'JN', name: 'Jin',   role: 'VP Engineering', color: '#2557A7' },
];

function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) { resolve((window as any).pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      } else reject(new Error('pdf.js failed to load'));
    };
    script.onerror = () => reject(new Error('Failed to load pdf.js'));
    document.head.appendChild(script);
  });
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return text.trim();
    } catch (e) {
      return '[Error extracting PDF. Please paste your resume text instead.]';
    }
  }
  return file.text();
}

export function LandingView({
  resumeText,
  setResumeText,
  targetRole,
  setTargetRole,
  evaluationMode,
  setEvaluationMode,
  onStart,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName]     = useState('');
  const [showPaste, setShowPaste]   = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  const canStart = resumeText.trim().length > 0 && targetRole.trim().length > 0 && apiKey.length > 0;

  const handleFile = useCallback(async (file: File) => {
    setIsExtracting(true);
    setFileName(file.name);
    try {
      setResumeText(await extractTextFromFile(file));
    } catch {
      setResumeText('[Error reading file. Please paste your resume text instead.]');
    } finally {
      setIsExtracting(false);
    }
  }, [setResumeText]);

  const handleDrop      = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }, [handleFile]);
  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true);  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[480px]">

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <p className="font-label mb-4" style={{ color: 'var(--color-muted)' }}>HireFrame</p>
          <h1 className="font-display" style={{ color: 'var(--color-ink)' }}>
            Three opinions.<br />One honest verdict.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Drop your resume. A senior engineering panel debates it live.
          </p>
        </motion.div>

        {/* Recruiter chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-5 mb-12"
        >
          {recruiters.map((r, i) => (
            <motion.div
              key={r.initials}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}
              className="flex items-center gap-2.5"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold tracking-wide flex-shrink-0"
                style={{ backgroundColor: r.color }}
              >
                {r.initials}
              </div>
              <div>
                <p className="text-[13px] font-medium leading-tight" style={{ color: 'var(--color-ink)' }}>{r.name}</p>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>{r.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >

          {/* Resume upload */}
          <div>
            <p className="font-label mb-2">Resume</p>
            {!showPaste ? (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border rounded-lg p-7 flex flex-col items-center justify-center cursor-pointer
                    transition-all duration-200 text-center
                    ${isDragging
                      ? 'border-ink bg-edge/30'
                      : fileName
                        ? 'border-edge bg-surface'
                        : 'border-dashed border-edge-strong bg-surface hover:border-ink hover:bg-canvas'
                    }
                  `}
                >
                  {isExtracting ? (
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Extracting text…
                    </div>
                  ) : fileName ? (
                    <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: 'var(--color-maya)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {fileName}
                    </div>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2.5" style={{ color: 'var(--color-faint)' }}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
                        Drop PDF or click to browse
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx,.md"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowPaste(true)}
                  className="mt-2 text-[12px] transition-colors cursor-pointer"
                  style={{ color: 'var(--color-muted)' }}
                >
                  or paste text instead
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume here…"
                  rows={7}
                  className="w-full rounded-lg p-4 text-[13px] leading-relaxed resize-none transition-all outline-none border"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-edge)',
                    color: 'var(--color-ink)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-ink)'; }}
                  onBlur={(e)  => { e.target.style.borderColor = 'var(--color-edge)'; }}
                />
                <button
                  type="button"
                  onClick={() => { setShowPaste(false); setResumeText(''); }}
                  className="mt-2 text-[12px] transition-colors cursor-pointer"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Upload a file instead
                </button>
              </>
            )}
          </div>

          {/* Target role */}
          <div>
            <p className="font-label mb-2">Target Role</p>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Frontend Engineer at a Series B startup"
              className="w-full py-2.5 px-0 text-[15px] bg-transparent border-0 border-b outline-none transition-colors"
              style={{
                borderColor: 'var(--color-edge)',
                color: 'var(--color-ink)',
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--color-ink)'; }}
              onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = 'var(--color-edge)'; }}
            />
          </div>

          {/* Evaluation mode */}
          <div>
            <p className="font-label mb-2">Evaluation Mode</p>
            <div className="grid grid-cols-3 gap-1.5">
              {EVALUATION_MODES.map(({ mode, label, desc }) => {
                const active = evaluationMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setEvaluationMode(mode)}
                    className="text-left p-3 rounded-lg border text-[12px] transition-all duration-150 cursor-pointer"
                    style={{
                      borderColor: active ? 'var(--color-ink)' : 'var(--color-edge)',
                      background:  active ? 'var(--color-ink)' : 'var(--color-surface)',
                      color:       active ? '#fff'             : 'var(--color-muted)',
                    }}
                  >
                    <span className="block font-medium mb-0.5" style={{ color: active ? '#fff' : 'var(--color-ink-2)' }}>{label}</span>
                    <span className="block text-[11px] leading-snug opacity-70">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onStart}
            disabled={!canStart}
            className="w-full py-3 px-5 rounded-lg text-[14px] font-medium tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: canStart ? 'var(--color-ink)' : 'var(--color-edge)',
              color:      canStart ? '#fff'             : 'var(--color-muted)',
              cursor:     canStart ? 'pointer'          : 'not-allowed',
            }}
          >
            Begin evaluation
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
