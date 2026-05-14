import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

interface Props {
  resumeText: string;
  setResumeText: (text: string) => void;
  targetRole: string;
  setTargetRole: (role: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  onStart: () => void;
}

const recruiters = [
  { initials: 'AX', name: 'Alex', role: 'The Skeptic', colorClass: 'bg-alex' },
  { initials: 'MY', name: 'Maya', role: 'Your Champion', colorClass: 'bg-maya' },
  { initials: 'JN', name: 'Jin', role: 'The Verdict', colorClass: 'bg-jin' },
];

function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      } else {
        reject(new Error('pdf.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load pdf.js script'));
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
      console.error('PDF parse error:', e);
      return '[Error extracting PDF text. Please paste your resume text instead.]';
    }
  }
  return file.text();
}

export function LandingView({
  resumeText,
  setResumeText,
  targetRole,
  setTargetRole,
  apiKey,
  setApiKey,
  onStart,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const envKey = typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_ANTHROPIC_API_KEY || ''
    : '';
  const effectiveApiKey = apiKey || envKey;

  const handleFile = useCallback(async (file: File) => {
    setIsExtracting(true);
    setFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
    } catch {
      setResumeText('[Error reading file. Please paste your resume text instead.]');
    } finally {
      setIsExtracting(false);
    }
  }, [setResumeText]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const canStart =
    resumeText.trim().length > 0 &&
    targetRole.trim().length > 0 &&
    effectiveApiKey.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center text-center max-w-2xl w-full">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <h1 className="font-headline text-ink">
            Three recruiters. Your one shot.
          </h1>
        </motion.div>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base text-muted mb-12 max-w-md"
        >
          Drop your resume. Watch them debate. Find out if you'd get hired.
        </motion.p>

        {/* Avatar chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-6 sm:gap-10 mb-14"
        >
          {recruiters.map((r, i) => (
            <motion.div
              key={r.initials}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 300 }}
              className="flex flex-col items-center gap-2.5"
            >
              <div
                className={`w-14 h-14 rounded-full ${r.colorClass} flex items-center justify-center text-white text-sm font-medium tracking-wide`}
              >
                {r.initials}
              </div>
              <span className="text-xs text-muted font-medium">
                {r.name} · <span className="font-normal">{r.role}</span>
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full max-w-lg bg-surface border border-edge rounded-xl p-8 space-y-6 text-left shadow-sm"
        >
          {/* Resume upload zone */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted uppercase tracking-wider block">
              Resume
            </label>

            {!showPasteArea ? (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                      ? 'border-jin bg-jin-tint'
                      : fileName
                        ? 'border-maya bg-maya-tint'
                        : 'border-edge hover:border-muted bg-canvas'
                    }
                  `}
                >
                  {isExtracting ? (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Extracting text…
                    </div>
                  ) : fileName ? (
                    <div className="flex items-center gap-2 text-sm text-maya font-medium">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {fileName}
                    </div>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="text-sm text-muted">
                        Drop PDF or text file, or click to browse
                      </span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx,.md"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasteArea(true)}
                  className="text-xs text-jin hover:text-ink transition-colors cursor-pointer underline underline-offset-2"
                >
                  Or paste resume text
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={6}
                  className="w-full bg-canvas border border-edge rounded-lg p-4 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-jin focus:ring-1 focus:ring-jin/20 resize-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPasteArea(false);
                    setResumeText('');
                  }}
                  className="text-xs text-jin hover:text-ink transition-colors cursor-pointer underline underline-offset-2"
                >
                  Upload a file instead
                </button>
              </>
            )}
          </div>

          {/* Target role input */}
          <div className="space-y-2">
            <label htmlFor="target-role" className="text-xs font-medium text-muted uppercase tracking-wider block">
              Target Role
            </label>
            <input
              id="target-role"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Frontend Engineer at a startup"
              className="w-full bg-transparent border-0 border-b border-edge focus:border-ink focus:ring-0 text-base text-ink placeholder:text-muted/40 py-2.5 px-0 transition-colors outline-none"
            />
          </div>

          {/* API key input (only if no env var) */}
          {!envKey && (
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-xs font-medium text-muted uppercase tracking-wider block">
                Anthropic API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-transparent border-0 border-b border-edge focus:border-ink focus:ring-0 text-sm text-ink placeholder:text-muted/40 py-2.5 px-0 transition-colors outline-none font-mono"
              />
              <p className="text-[11px] text-muted/60">
                Your key stays in-browser. Never sent anywhere except Anthropic's API.
              </p>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`
              w-full py-3.5 px-6 rounded-lg text-sm font-medium tracking-wide
              flex items-center justify-center gap-2
              transition-all duration-200
              ${canStart
                ? 'bg-dark text-white hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer'
                : 'bg-edge text-muted cursor-not-allowed'
              }
            `}
          >
            Start the debate
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
