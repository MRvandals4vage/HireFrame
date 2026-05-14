import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Message, ScoreData, CoverageTopic, RecruiterName } from '../types';

interface Props {
  resumeText: string;
  targetRole: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  coverageTopics: Set<CoverageTopic>;
  setCoverageTopics: React.Dispatch<React.SetStateAction<Set<CoverageTopic>>>;
  onComplete: (data: ScoreData) => void;
}

const RECRUITER_CONFIG: Record<RecruiterName, { name: string; role: string; color: string; tint: string; textColor: string }> = {
  ALEX: { name: 'Alex', role: 'The Skeptic', color: '#C0392B', tint: 'rgba(192,57,43,0.08)', textColor: 'text-alex' },
  MAYA: { name: 'Maya', role: 'Your Champion', color: '#1D9E75', tint: 'rgba(29,158,117,0.08)', textColor: 'text-maya' },
  JIN:  { name: 'Jin',  role: 'The Verdict',  color: '#2C6FBF', tint: 'rgba(44,111,191,0.08)', textColor: 'text-jin'  },
};

const COVERAGE_TOPICS: CoverageTopic[] = ['Technical', 'Communication', 'Depth', 'Wildcard'];
const COVERAGE_COLORS: Record<CoverageTopic, string> = {
  Technical: '#2C6FBF',
  Communication: '#1D9E75',
  Depth: '#C0392B',
  Wildcard: '#D97706',
};

const SYSTEM_PROMPT = (role: string) => `You are simulating a hiring panel debate for the role of: ${role}

Three recruiters evaluate the candidate's profile:
- ALEX (Skeptic): finds gaps, questions vague claims, pushes on anything unquantified. Direct, not cruel.
- MAYA (Champion): finds the strongest read of every line, connects dots, argues for the hire. Enthusiastic but grounded.
- JIN (Neutral): weighs both, brings market context, gives final verdict. Measured, data-informed.

Produce exactly 6 exchanges total (2 per recruiter, interleaved naturally).
Format each message EXACTLY as:
RECRUITER: message text
COVERAGE: Technical|Communication|Depth|Wildcard (comma-separated topics this message covers)

Each message must cite a SPECIFIC line or detail from the resume.
After all 6 exchanges output a JSON block:
\`\`\`json
{
  "readiness_score": 0-100,
  "verdict": "one sentence",
  "hire_blockers": ["specific blocker 1", "specific blocker 2"],
  "hire_accelerators": ["specific fix 1 (1 day)", "specific fix 2 (1 week)"],
  "strongest_asset": "the one thing even Alex couldn't argue with",
  "thirty_day_plan": [
    {"action": "specific action", "impact": "high", "effort": "1hr"},
    {"action": "specific action", "impact": "medium", "effort": "1day"},
    {"action": "specific action", "impact": "high", "effort": "1week"}
  ]
}
\`\`\``;

export function DebateView({
  resumeText,
  targetRole,
  messages,
  setMessages,
  coverageTopics,
  setCoverageTopics,
  onComplete,
}: Props) {
  const [currentSpeaker, setCurrentSpeaker] = useState<RecruiterName | null>(null);
  const [currentPartialText, setCurrentPartialText] = useState('');
  const [statusText, setStatusText] = useState('Starting the debate…');
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const columnRefs = useRef<Record<RecruiterName, HTMLDivElement | null>>({
    ALEX: null,
    MAYA: null,
    JIN: null,
  });

  const scrollToBottom = useCallback((recruiter: RecruiterName) => {
    const el = columnRefs.current[recruiter];
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const getStatusLabel = (name: RecruiterName) => {
    const labels: Record<RecruiterName, string[]> = {
      ALEX: ['Alex is questioning your experience…', 'Alex is probing for gaps…'],
      MAYA: ['Maya is defending your project experience…', 'Maya is championing your strengths…'],
      JIN:  ['Jin is weighing the evidence…', 'Jin is forming the verdict…'],
    };
    const arr = labels[name];
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const startDebate = useCallback(async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setHasStarted(true);
    setError(null);
    setMessages([]);
    setCoverageTopics(new Set());
    setCurrentPartialText('');
    setCurrentSpeaker(null);

    const envKey = typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
      : '';
    const key = envKey;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse&key=\${key}\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT(targetRole) }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: \`Resume:\\n\${resumeText}\\n\\nTarget role: \${targetRole}\` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 4096,
          }
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(\`API error \${response.status}: \${errBody}\`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      let sseBuffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop()!;

        for (const event of events) {
          const lines = event.split('\n');
          const dataLine = lines.find((l) => l.startsWith('data: '));
          if (!dataLine) continue;

          try {
            const data = JSON.parse(dataLine.slice(6));
            if (data.candidates && data.candidates[0].content.parts[0].text) {
              fullText += data.candidates[0].content.parts[0].text;
              processStreamBuffer(fullText);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      // Final processing
      processStreamBuffer(fullText, true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsStreaming(false);
    }
  }, [resumeText, targetRole, isStreaming]);

  const processStreamBuffer = useCallback(
    (text: string, isFinal = false) => {
      const lines = text.split('\n');
      const parsedMessages: Message[] = [];
      const topics = new Set<CoverageTopic>();
      let currentMsg: { recruiter: RecruiterName; text: string } | null = null;
      let inJson = false;
      let jsonStr = '';
      let jsonDone = false;

      for (const line of lines) {
        const trimmed = line.trim();

        // JSON block detection
        if (trimmed.startsWith('```json')) {
          inJson = true;
          jsonStr = '';
          continue;
        }
        if (inJson) {
          if (trimmed === '```') {
            inJson = false;
            jsonDone = true;
            try {
              const parsed = JSON.parse(jsonStr);
              if (isFinal && parsed.readiness_score !== undefined) {
                // Push final current message if any
                if (currentMsg) {
                  parsedMessages.push({
                    recruiter: currentMsg.recruiter,
                    text: currentMsg.text.trim(),
                    timestamp: Date.now(),
                  });
                }
                setMessages([...parsedMessages]);
                setCurrentPartialText('');
                setCurrentSpeaker(null);
                setStatusText('Debate complete.');
                setTimeout(() => onComplete(parsed), 600);
                return;
              }
            } catch {
              // incomplete JSON, continue
            }
            continue;
          }
          jsonStr += line + '\n';
          continue;
        }
        if (jsonDone) continue;

        // Recruiter message detection
        if (trimmed.startsWith('ALEX:')) {
          if (currentMsg) {
            parsedMessages.push({
              recruiter: currentMsg.recruiter,
              text: currentMsg.text.trim(),
              timestamp: Date.now(),
            });
          }
          currentMsg = { recruiter: 'ALEX', text: trimmed.slice(5).trim() };
          setCurrentSpeaker('ALEX');
          setStatusText(getStatusLabel('ALEX'));
        } else if (trimmed.startsWith('MAYA:')) {
          if (currentMsg) {
            parsedMessages.push({
              recruiter: currentMsg.recruiter,
              text: currentMsg.text.trim(),
              timestamp: Date.now(),
            });
          }
          currentMsg = { recruiter: 'MAYA', text: trimmed.slice(5).trim() };
          setCurrentSpeaker('MAYA');
          setStatusText(getStatusLabel('MAYA'));
        } else if (trimmed.startsWith('JIN:')) {
          if (currentMsg) {
            parsedMessages.push({
              recruiter: currentMsg.recruiter,
              text: currentMsg.text.trim(),
              timestamp: Date.now(),
            });
          }
          currentMsg = { recruiter: 'JIN', text: trimmed.slice(4).trim() };
          setCurrentSpeaker('JIN');
          setStatusText(getStatusLabel('JIN'));
        } else if (trimmed.startsWith('COVERAGE:')) {
          const parts = trimmed
            .slice(9)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean) as CoverageTopic[];
          parts.forEach((t) => {
            if (COVERAGE_TOPICS.includes(t)) topics.add(t);
          });
        } else if (currentMsg && trimmed.length > 0) {
          currentMsg.text += ' ' + trimmed;
        }
      }

      // Update coverage
      setCoverageTopics((prev) => {
        const next = new Set(prev);
        topics.forEach((t) => next.add(t));
        return next;
      });

      // Update completed messages
      setMessages([...parsedMessages]);

      // Update partial text for current in-progress message
      if (currentMsg) {
        setCurrentPartialText(currentMsg.text.trim());
        setCurrentSpeaker(currentMsg.recruiter);
        scrollToBottom(currentMsg.recruiter);
      }
    },
    [onComplete, scrollToBottom],
  );

  // Start debate on mount
  useEffect(() => {
    if (!hasStarted) {
      startDebate();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const alexMessages = messages.filter((m) => m.recruiter === 'ALEX');
  const mayaMessages = messages.filter((m) => m.recruiter === 'MAYA');
  const jinMessages = messages.filter((m) => m.recruiter === 'JIN');

  const columnData: { recruiter: RecruiterName; msgs: Message[] }[] = [
    { recruiter: 'ALEX', msgs: alexMessages },
    { recruiter: 'MAYA', msgs: mayaMessages },
    { recruiter: 'JIN', msgs: jinMessages },
  ];

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full gap-4">
      {/* Coverage Bar */}
      <div className="bg-surface border border-edge rounded-xl p-5 shadow-sm flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium text-ink">Live Evaluation</h2>
            <p className="text-sm text-muted mt-0.5">{targetRole}</p>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && <span className="w-2 h-2 rounded-full bg-maya animate-pulse-dot" />}
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              {isStreaming ? 'Session Active' : 'Complete'}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 h-2 w-full">
          {COVERAGE_TOPICS.map((topic, i) => (
            <div
              key={topic}
              className={`flex-1 coverage-segment ${i === 0 ? 'rounded-l' : ''} ${i === 3 ? 'rounded-r' : ''}`}
              style={{
                backgroundColor: coverageTopics.has(topic) ? COVERAGE_COLORS[topic] : '#E5E4E0',
                opacity: coverageTopics.has(topic) ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {COVERAGE_TOPICS.map((topic) => (
            <span
              key={topic}
              className="text-[10px] uppercase tracking-wider font-medium transition-colors duration-300"
              style={{ color: coverageTopics.has(topic) ? COVERAGE_COLORS[topic] : '#6B6B66' }}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-alex/20 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-alex/10 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-ink mb-1">Something went wrong</p>
            <p className="text-xs text-muted">{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setHasStarted(false);
              setTimeout(() => startDebate(), 100);
            }}
            className="bg-dark text-white text-sm px-5 py-2.5 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Three Column Debate */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {columnData.map(({ recruiter, msgs }) => {
          const config = RECRUITER_CONFIG[recruiter];
          const isCurrentSpeaker = currentSpeaker === recruiter && isStreaming;
          return (
            <div
              key={recruiter}
              className="flex flex-col bg-surface border border-edge rounded-xl overflow-hidden min-h-[300px] md:min-h-0"
            >
              {/* Column Header */}
              <div className="border-b border-edge px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: config.color }}
                >
                  {recruiter === 'ALEX' ? 'AX' : recruiter === 'MAYA' ? 'MY' : 'JN'}
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{config.name}</div>
                  <div className="text-[11px] font-medium" style={{ color: config.color }}>
                    {config.role}
                  </div>
                </div>
                {isCurrentSpeaker && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: config.color }} />
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: config.color }}>
                      typing
                    </span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div
                ref={(el) => { columnRefs.current[recruiter] = el; }}
                className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 debate-scroll"
              >
                {/* Loading skeleton */}
                {msgs.length === 0 && !isCurrentSpeaker && isStreaming && (
                  <div className="space-y-3">
                    <div className="skeleton h-16 w-full" />
                    <div className="skeleton h-12 w-4/5" />
                  </div>
                )}

                <AnimatePresence>
                  {msgs.map((msg, i) => (
                    <motion.div
                      key={`${recruiter}-${i}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="rounded-lg p-3.5 text-sm leading-relaxed text-ink"
                      style={{ backgroundColor: config.tint }}
                    >
                      {msg.text}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Partial / streaming message */}
                {isCurrentSpeaker && currentPartialText && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg p-3.5 text-sm leading-relaxed text-ink"
                    style={{ backgroundColor: config.tint }}
                  >
                    {currentPartialText}
                    <span className="animate-blink ml-0.5 inline-block w-[2px] h-[14px] align-middle" style={{ backgroundColor: config.color }} />
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="bg-surface border border-edge rounded-xl px-5 py-3.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
        {isStreaming && (
          <span className="w-2.5 h-2.5 rounded-full bg-maya animate-pulse-dot flex-shrink-0" />
        )}
        <span className="text-sm text-muted truncate">{statusText}</span>
      </div>
    </div>
  );
}
