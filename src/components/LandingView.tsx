import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  const canStart = resumeText.trim().length > 0 && targetRole.trim().length > 0 && apiKey.length > 0;

  const handleFile = useCallback(async (file: File) => {
    setIsExtracting(true);
    setFileName(file.name);
    try {
      setResumeText(await extractTextFromFile(file));
      setShowConfigModal(true);
    } catch {
      setResumeText('[Error reading file. Please paste your resume text instead.]');
      setShowPaste(true);
    } finally {
      setIsExtracting(false);
    }
  }, [setResumeText]);

  const handleDrop      = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }, [handleFile]);
  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true);  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handlePasteSubmit = () => {
    if (resumeText.trim().length > 0) {
      setShowConfigModal(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-canvas relative overflow-hidden">
      
      {/* Main minimal UI */}
      <div className="w-full max-w-[440px] flex flex-col items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-[48px] font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
            Hire Frame
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            AI interview panel debate. Get clarity on your readiness.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          {!showPaste ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isExtracting && fileInputRef.current?.click()}
              className={`
                relative rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer
                transition-all duration-300 text-center border border-edge
                ${isDragging ? 'bg-edge-strong/5 scale-[1.02]' : 'bg-surface hover:bg-raised hover:scale-[1.01] hover:shadow-md'}
              `}
            >
              {isExtracting ? (
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-ink opacity-70" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-[14px] font-medium text-ink">Analyzing document...</span>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-ink/5 flex items-center justify-center mb-5 border border-edge">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink)' }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-[17px] font-bold text-ink mb-2">Upload Your Resume</p>
                  <p className="text-[14px] text-muted leading-relaxed">PDF, DOCX, or paste text directly</p>
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
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={8}
                className="clay-input w-full p-5 text-[14px] leading-relaxed resize-none transition-all mb-3"
              />
              <button
                onClick={handlePasteSubmit}
                disabled={!resumeText.trim()}
                className={`py-3 px-5 text-[15px] transition-all duration-200 ${resumeText.trim() ? 'clay-btn-primary' : 'clay-btn opacity-50 cursor-not-allowed'}`}
              >
                Continue
              </button>
            </div>
          )}

          {!showPaste && !isExtracting && (
            <button
              type="button"
              onClick={() => setShowPaste(true)}
              className="mt-6 text-[13px] font-medium text-muted hover:text-ink transition-colors cursor-pointer w-full text-center"
            >
              or paste text instead
            </button>
          )}
          {showPaste && (
            <button
              type="button"
              onClick={() => { setShowPaste(false); setResumeText(''); }}
              className="mt-4 text-[13px] font-medium text-muted hover:text-ink transition-colors cursor-pointer w-full text-center"
            >
              Upload a file instead
            </button>
          )}
        </motion.div>
      </div>

      {/* Configuration Modal Popup */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(230, 230, 230, 0.6)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[500px] p-8 rounded-2xl bg-surface border border-edge shadow-lg"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[24px] font-bold text-ink">Evaluation Settings</h2>
                <button 
                  onClick={() => setShowConfigModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-edge/60 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="space-y-7">
                <div>
                  <p className="font-label mb-3">Target Role</p>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Frontend Engineer at a Series B startup"
                    className="clay-input w-full p-4 text-[15px]"
                    autoFocus
                  />
                </div>

                <div>
                  <p className="font-label mb-4">Evaluation Mode</p>
                  <div className="grid grid-cols-2 gap-3">
                    {EVALUATION_MODES.map(({ mode, label, desc }) => {
                      const active = evaluationMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setEvaluationMode(mode)}
                          className={`text-left p-4 transition-all duration-200 ${active ? 'clay-btn-primary' : 'clay-btn'}`}
                        >
                          <span className="block font-bold text-[13px] mb-1" style={{ color: active ? '#fff' : 'var(--color-ink)' }}>{label}</span>
                          <span className="block text-[11px] leading-snug opacity-70" style={{ color: active ? 'rgba(255,255,255,0.8)' : 'var(--color-muted)' }}>{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setShowConfigModal(false); onStart(); }}
                    disabled={!canStart}
                    className={`w-full py-4 text-[16px] font-semibold flex items-center justify-center gap-2 ${canStart ? 'clay-btn-primary' : 'clay-btn opacity-50 cursor-not-allowed'}`}
                  >
                    Start Evaluation
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  {(!apiKey) && (
                    <p className="text-center text-[12px] text-alex mt-4 font-medium">Missing API key in .env</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
