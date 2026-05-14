import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Message, ScoreData, CoverageTopic, RecruiterName, RecruiterConfidence, EvaluationMode } from '../types';

interface Props {
  resumeText: string;
  targetRole: string;
  evaluationMode: EvaluationMode;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  coverageTopics: Set<CoverageTopic>;
  setCoverageTopics: React.Dispatch<React.SetStateAction<Set<CoverageTopic>>>;
  onComplete: (data: ScoreData) => void;
}

const RECRUITER_CONFIG: Record<RecruiterName, { name: string; role: string; color: string; tint: string }> = {
  ALEX: { name: 'Alex', role: 'Staff Engineer', color: '#B03A2E', tint: 'rgba(176,58,46,0.06)'  },
  MAYA: { name: 'Maya', role: 'Eng Manager',    color: '#1A8A65', tint: 'rgba(26,138,101,0.06)' },
  JIN:  { name: 'Jin',  role: 'VP Engineering', color: '#2557A7', tint: 'rgba(37,87,167,0.06)'  },
};

const COVERAGE_TOPICS: CoverageTopic[] = ['Technical', 'Communication', 'Depth', 'Wildcard'];
const COVERAGE_COLORS: Record<CoverageTopic, string> = {
  Technical: '#2C6FBF',
  Communication: '#1D9E75',
  Depth: '#C0392B',
  Wildcard: '#D97706',
};

const MODE_CONTEXT: Record<EvaluationMode, string> = {
  'FAANG': 'Evaluation context: FAANG-style. Alex hammers on algorithmic complexity, O-notation, and distributed systems at scale (millions of QPS). Maya looks for evidence of shipping real features, not just LeetCode prep. Jin cares about the candidate\'s ability to navigate ambiguity at scale.',
  'Startup': 'Evaluation context: Early-stage Startup. Alex is skeptical of over-engineering and academic abstractions — he wants to see velocity and pragmatic tradeoffs. Maya champions product intuition and ownership mentality. Jin weighs learning curve vs. time-to-productivity.',
  'Research Lab': 'Evaluation context: Research Lab (e.g. DeepMind, FAIR, MSR). Alex probes the depth of prior research, novel methodologies, and publication record. Maya looks for intellectual curiosity and ability to bridge theory to engineering. Jin evaluates research potential and scientific rigor.',
  'Fintech': 'Evaluation context: Fintech/Financial Systems. Alex scrutinizes system reliability, data integrity guarantees, and compliance-awareness. Maya champions velocity within regulated environments. Jin considers risk tolerance, auditability, and domain knowledge.',
  'ML Engineering': 'Evaluation context: ML Engineering. Alex dissects model architecture choices, training pipeline efficiency, and benchmark credibility. Maya defends practical ML engineering (data pipelines, inference latency, model serving). Jin evaluates the end-to-end ML lifecycle understanding.',
  'Frontend Engineering': 'Evaluation context: Senior Frontend Engineering. Alex questions performance bottlenecks, bundle size strategy, and component architecture tradeoffs. Maya celebrates strong product instincts, accessibility awareness, and design systems experience. Jin evaluates cross-functional collaboration and web platform depth.',
};

const SYSTEM_PROMPT = (role: string, mode: EvaluationMode) => `You are simulating a rigorous hiring committee debate for the role of: ${role}

${MODE_CONTEXT[mode]}

Three senior engineering leaders conduct this debate:
- ALEX (The Skeptic / Staff Engineer): Extremely technical and sharply critical. Dissects architectural choices, spots inflated claims instantly, quantifies everything. Uses domain-specific jargon naturally. Never generic.
- MAYA (The Champion / Eng Manager): Focuses on pragmatic engineering decisions, product velocity, and team fit. Finds the strongest possible interpretation of each resume claim and connects it to real business value.
- JIN (The Neutral / VP Engineering): Philosophical, market-aware, and strictly evidence-driven. Synthesizes both perspectives, references industry benchmarks, and delivers high-signal verdict statements.

DEBATE RULES:
- Produce exactly 8 exchanges total (interleaved naturally, not evenly distributed).
- Each message must cite a SPECIFIC, VERBATIM phrase or detail from the resume.
- Recruiters MUST reference each other by name: "As Alex just pointed out…", "I'd push back on Maya's read here…"
- Recruiters update their confidence in the candidate after each exchange.
- Make it intellectually intense — argue about architecture, tradeoffs, evidence of mastery vs. cargo-cult.

OUTPUT FORMAT (follow EXACTLY, one per recruiter turn):
CONFIDENCE: ALEX=<0-100>, MAYA=<0-100>, JIN=<0-100>
[RECRUITER_NAME]: message text
COVERAGE: comma-separated from [Technical, Communication, Depth, Wildcard]

Example:
CONFIDENCE: ALEX=40, MAYA=70, JIN=50
ALEX: Your claim about microservices is interesting, but I'm skeptical about the scale.
COVERAGE: Technical, Depth

After all exchanges, output a JSON block EXACTLY like:
\`\`\`json
{
  "readiness_score": <0-100>,
  "verdict": "<one sharp, specific sentence — no generic language>",
  "hire_blockers": ["<specific technical blocker>", "<specific gap>"],
  "hire_accelerators": ["<specific 1-day fix>", "<specific 1-week improvement>"],
  "strongest_asset": "<the one thing even Alex conceded on>",
  "thirty_day_plan": [
    {"action": "<concrete action>", "impact": "high", "effort": "1hr"},
    {"action": "<concrete action>", "impact": "medium", "effort": "1day"},
    {"action": "<concrete action>", "impact": "high", "effort": "1week"}
  ],
  "predicted_questions": [
    {"question": "<realistic technical interview question referencing a resume claim>", "recruiter": "ALEX", "difficulty": "hard"},
    {"question": "<behavioral question targeting a gap>", "recruiter": "MAYA", "difficulty": "medium"},
    {"question": "<system design or leadership question>", "recruiter": "JIN", "difficulty": "hard"}
  ],
  "recruiter_verdicts": [
    {"recruiter": "ALEX", "stance": "<hire|no-hire|maybe>", "reasoning": "<one sentence>"},
    {"recruiter": "MAYA", "stance": "<hire|no-hire|maybe>", "reasoning": "<one sentence>"},
    {"recruiter": "JIN", "stance": "<hire|no-hire|maybe>", "reasoning": "<one sentence>"}
  ]
}
\`\`\``;

const DEFAULT_CONFIDENCE: RecruiterConfidence = { ALEX: 50, MAYA: 50, JIN: 50 };

// Safely extract fenced JSON even if stream ends abruptly
function extractJSON(text: string): string | null {
  const match = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
  if (!match) return null;
  return match[1].trim();
}

export function DebateView({
  resumeText,
  targetRole,
  evaluationMode,
  messages,
  setMessages,
  coverageTopics,
  setCoverageTopics,
  onComplete,
}: Props) {
  const [currentSpeaker, setCurrentSpeaker] = useState<RecruiterName | null>(null);
  const [currentPartialText, setCurrentPartialText] = useState('');
  const [statusText, setStatusText] = useState('Convening the hiring committee…');
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [confidence, setConfidence] = useState<RecruiterConfidence>(DEFAULT_CONFIDENCE);

  const abortRef = useRef<AbortController | null>(null);
  const columnRefs = useRef<Record<RecruiterName, HTMLDivElement | null>>({ ALEX: null, MAYA: null, JIN: null });

  // Use refs for values needed inside the stream loop to avoid stale closures
  const fullTextRef = useRef('');
  const isStreamingRef = useRef(false);

  const scrollToBottom = useCallback((recruiter: RecruiterName) => {
    const el = columnRefs.current[recruiter];
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const STATUS_LINES: Record<RecruiterName, string[]> = {
    ALEX: ['Alex is dissecting your claims…', 'Alex is probing for gaps…', 'Alex is stress-testing the architecture…'],
    MAYA: ['Maya is finding your strongest angle…', 'Maya is championing your work…', 'Maya is making the case for you…'],
    JIN:  ['Jin is weighing the evidence…', 'Jin is consulting market data…', 'Jin is forming the final synthesis…'],
  };

  const getStatusLabel = (name: RecruiterName) => {
    const arr = STATUS_LINES[name];
    return arr[Math.floor(Math.random() * arr.length)];
  };

  // Core stream parser - runs on the entire accumulated text on every chunk
  const processStreamBuffer = useCallback(
    (text: string, isFinal = false) => {
      const lines = text.split(/\r?\n/);
      const parsedMessages: Message[] = [];
      const topics = new Set<CoverageTopic>();
      let currentMsg: { recruiter: RecruiterName; text: string } | null = null;
      let inJson = false;
      let jsonLines: string[] = [];
      let jsonDone = false;
      let latestConfidence: RecruiterConfidence | null = null;

      for (const line of lines) {
        const trimmed = line.trim();

        // Fenced JSON block detection
        if (trimmed.startsWith('```json')) {
          inJson = true;
          jsonLines = [];
          continue;
        }
        if (inJson) {
          if (trimmed === '```') {
            inJson = false;
            jsonDone = true;
            const jsonStr = jsonLines.join('\n');
            if (isFinal) {
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.readiness_score !== undefined) {
                  if (currentMsg) {
                    parsedMessages.push({ recruiter: currentMsg.recruiter, text: currentMsg.text.trim(), timestamp: Date.now() });
                  }
                  setMessages([...parsedMessages]);
                  setCurrentPartialText('');
                  setCurrentSpeaker(null);
                  setStatusText('Committee has reached a decision.');
                  setTimeout(() => onComplete(parsed), 700);
                  return;
                }
              } catch {
                // Try lenient extraction as last resort
                const fallback = extractJSON('```json\n' + jsonStr + '\n```');
                if (fallback) {
                  try {
                    const parsed = JSON.parse(fallback);
                    if (parsed.readiness_score !== undefined) {
                      if (currentMsg) {
                        parsedMessages.push({ recruiter: currentMsg.recruiter, text: currentMsg.text.trim(), timestamp: Date.now() });
                      }
                      setMessages([...parsedMessages]);
                      setCurrentPartialText('');
                      setCurrentSpeaker(null);
                      setStatusText('Committee has reached a decision.');
                      setTimeout(() => onComplete(parsed), 700);
                      return;
                    }
                  } catch { /* still malformed */ }
                }
              }
            }
            continue;
          }
          jsonLines.push(line);
          continue;
        }
        if (jsonDone) continue;

        // CONFIDENCE line parsing
        if (trimmed.startsWith('CONFIDENCE:')) {
          const conf: RecruiterConfidence = { ALEX: 50, MAYA: 50, JIN: 50 };
          const parts = trimmed.slice(11).split(',');
          parts.forEach((p) => {
            const [name, val] = p.trim().split('=');
            const n = name?.trim() as RecruiterName;
            const v = parseInt(val ?? '50', 10);
            if ((n === 'ALEX' || n === 'MAYA' || n === 'JIN') && !isNaN(v)) {
              conf[n] = Math.min(100, Math.max(0, v));
            }
          });
          latestConfidence = conf;
          continue;
        }

        // Recruiter turn detection (supports standard, bolding, parentheticals, or RECRUITER prefix)
        const recruiterMatch = trimmed.match(/^(?:\*\*?)?(?:RECRUITER:\s*)?(ALEX|MAYA|JIN)(?:[^\:]*):\s*(.*)/i);
        if (recruiterMatch) {
          if (currentMsg) {
            parsedMessages.push({ recruiter: currentMsg.recruiter, text: currentMsg.text.trim(), timestamp: Date.now() });
          }
          const r = recruiterMatch[1].toUpperCase() as RecruiterName;
          currentMsg = { recruiter: r, text: recruiterMatch[2] };
          setCurrentSpeaker(r);
          setStatusText(getStatusLabel(r));
        } else if (trimmed.startsWith('COVERAGE:')) {
          const parts = trimmed.slice(9).split(',').map((s) => s.trim()).filter(Boolean) as CoverageTopic[];
          parts.forEach((t) => { if (COVERAGE_TOPICS.includes(t)) topics.add(t); });
        } else if (currentMsg && trimmed.length > 0) {
          currentMsg.text += ' ' + trimmed;
        }
      }

      // Flush confidence update to state
      if (latestConfidence) setConfidence(latestConfidence);

      // Flush coverage
      setCoverageTopics((prev) => {
        const next = new Set(prev);
        topics.forEach((t) => next.add(t));
        return next;
      });

      // Commit completed messages
      setMessages([...parsedMessages]);

      // Stream the in-progress message
      if (currentMsg) {
        setCurrentPartialText(currentMsg.text.trim());
        setCurrentSpeaker(currentMsg.recruiter);
        scrollToBottom(currentMsg.recruiter);
      }
    },
    [onComplete, scrollToBottom, setMessages, setCoverageTopics],
  );

  const startDebate = useCallback(async () => {
    if (isStreamingRef.current) return;
    isStreamingRef.current = true;
    setIsStreaming(true);
    setHasStarted(true);
    setError(null);
    setMessages([]);
    setCoverageTopics(new Set());
    setCurrentPartialText('');
    setCurrentSpeaker(null);
    setConfidence(DEFAULT_CONFIDENCE);
    fullTextRef.current = '';

    const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const groqKey   = (import.meta as any).env?.VITE_GROQ_API_KEY   || '';
    const controller = new AbortController();
    abortRef.current = controller;

    const prompt = SYSTEM_PROMPT(targetRole, evaluationMode);
    // Truncate resume text to ~8000 characters to prevent API limits (Groq has 8000 TPM limit on on-demand tier)
    const truncatedResume = resumeText.slice(0, 8000);
    const userMsg = `Resume:\n${truncatedResume}\n\nTarget role: ${targetRole}\nEvaluation mode: ${evaluationMode}`;

    try {
      let response: Response | undefined;

      // --- Try Gemini first ---
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: prompt }] },
              contents: [{ role: 'user', parts: [{ text: userMsg }] }],
              generationConfig: { maxOutputTokens: 8192 },
            }),
            signal: controller.signal,
          }
        );
        if (r.ok) response = r;
        else throw new Error(`Gemini ${r.status}`);
      } catch (geminiErr) {
        if ((geminiErr as Error).name === 'AbortError') throw geminiErr;
        // --- Fallback to Groq ---
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: prompt },
              { role: 'user',   content: userMsg },
            ],
            temperature: 1,
            max_tokens: 2000,
            stream: true,
          }),
          signal: controller.signal,
        });
        if (!r.ok) {
          const body = await r.text();
          throw new Error(`API error ${r.status}: ${body}`);
        }
        response = r;
      }

      if (!response) throw new Error('No API response received.');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const rawLine = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);

          if (!rawLine.startsWith('data: ')) continue;
          const payload = rawLine.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            let chunk = '';
            if (payload.includes('"candidates"')) {
              chunk = JSON.parse(payload)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            } else if (payload.includes('"choices"')) {
              chunk = JSON.parse(payload)?.choices?.[0]?.delta?.content ?? '';
            }
            if (chunk) {
              fullTextRef.current += chunk;
              processStreamBuffer(fullTextRef.current);
            }
          } catch { /* skip malformed chunk */ }
        }
      }

      // Final pass — commit everything and fire onComplete
      processStreamBuffer(fullTextRef.current, true);

    } catch (err: any) {
      console.error("Debate stream failed:", err);
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      isStreamingRef.current = false;
      setIsStreaming(false);
    }
  }, [resumeText, targetRole, evaluationMode, processStreamBuffer, setMessages, setCoverageTopics]);

  useEffect(() => {
    if (messages.length > 0 && hasStarted) {
      if (!isStreamingRef.current) setStatusText('Committee has reached a decision.');
      return;
    }
    if (!hasStarted) startDebate();
    return () => { abortRef.current?.abort(); };
  }, []);

  const columnData: { recruiter: RecruiterName; msgs: Message[] }[] = [
    { recruiter: 'ALEX', msgs: messages.filter((m) => m.recruiter === 'ALEX') },
    { recruiter: 'MAYA', msgs: messages.filter((m) => m.recruiter === 'MAYA') },
    { recruiter: 'JIN',  msgs: messages.filter((m) => m.recruiter === 'JIN')  },
  ];

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full gap-4">

      {/* Header bar */}
      <div className="card p-5 flex-shrink-0">
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="font-label mb-0.5">Live Evaluation</p>
            <p className="text-[15px] font-medium" style={{ color: 'var(--color-ink)' }}>
              {targetRole}
              <span className="ml-2 text-[13px] font-normal" style={{ color: 'var(--color-muted)' }}>· {evaluationMode}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--color-maya)' }} />}
            <span className="font-label">{isStreaming ? 'Active' : 'Complete'}</span>
          </div>
        </div>

        {/* Coverage bar */}
        <div className="flex gap-1 h-[3px] w-full rounded-full overflow-hidden mb-3">
          {COVERAGE_TOPICS.map((topic) => (
            <div
              key={topic}
              className="flex-1 coverage-segment"
              style={{
                backgroundColor: coverageTopics.has(topic) ? COVERAGE_COLORS[topic] : 'var(--color-edge)',
                opacity: coverageTopics.has(topic) ? 1 : 1,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {COVERAGE_TOPICS.map((topic) => (
            <span
              key={topic}
              className="font-label transition-colors duration-300"
              style={{ color: coverageTopics.has(topic) ? COVERAGE_COLORS[topic] : 'var(--color-faint)' }}
            >
              {topic}
            </span>
          ))}
        </div>

        {/* Recruiter confidence bars */}
        <div className="mt-5 grid grid-cols-3 gap-4 pt-4 border-t border-edge">
          {(Object.keys(RECRUITER_CONFIG) as RecruiterName[]).map((r) => {
            const cfg = RECRUITER_CONFIG[r];
            const pct = confidence[r];
            const label = pct >= 70 ? 'Leaning yes' : pct >= 40 ? 'Undecided' : 'Skeptical';
            return (
              <div key={r}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--color-ink)' }}>{cfg.name}</span>
                  <span className="text-[11px]" style={{ color: cfg.color }}>{pct}%</span>
                </div>
                <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: 'var(--color-edge)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: cfg.color }}
                    initial={{ width: '50%' }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--color-faint)' }}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 flex flex-col sm:flex-row items-center gap-4"
          style={{ borderColor: 'rgba(176,58,46,0.3)' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(176,58,46,0.08)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B03A2E" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[13px] font-medium" style={{ color: 'var(--color-ink)' }}>Something went wrong</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-muted)' }}>{error}</p>
          </div>
          <button
            onClick={() => { setError(null); setHasStarted(false); isStreamingRef.current = false; setTimeout(() => startDebate(), 100); }}
            className="clay-btn text-[13px] px-4 py-2"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Three-column debate */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
        {columnData.map(({ recruiter, msgs }) => {
          const config = RECRUITER_CONFIG[recruiter];
          const isCurrentSpeaker = currentSpeaker === recruiter && isStreaming;
          return (
            <div
              key={recruiter}
              className="flex flex-col card overflow-hidden min-h-[300px] md:min-h-0 transition-all duration-300"
              style={{
                boxShadow: isCurrentSpeaker ? `0 0 0 2px ${config.color}50, 8px 8px 16px rgba(18, 42, 66, 0.06), -8px -8px 16px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(255, 255, 255, 0.5)` : undefined,
              }}
            >
              {/* Column header */}
              <div className="border-b px-4 py-3 flex items-center gap-2.5 flex-shrink-0" style={{ borderColor: 'var(--color-edge)' }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                  style={{ backgroundColor: config.color }}
                >
                  {recruiter === 'ALEX' ? 'AX' : recruiter === 'MAYA' ? 'MY' : 'JN'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--color-ink)' }}>{config.name}</p>
                  <p className="text-[11px] leading-tight" style={{ color: config.color }}>{config.role}</p>
                </div>
                {isCurrentSpeaker && (
                  <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: config.color }} />
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: config.color }}>typing</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div
                ref={(el) => { columnRefs.current[recruiter] = el; }}
                className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 debate-scroll"
              >
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="rounded-lg p-3.5 text-[13px] leading-relaxed"
                      style={{ background: config.tint, color: 'var(--color-ink)' }}
                    >
                      {msg.text}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isCurrentSpeaker && currentPartialText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg p-3.5 text-[13px] leading-relaxed"
                    style={{ background: config.tint, color: 'var(--color-ink)' }}
                  >
                    {currentPartialText}
                    <span
                      className="animate-blink ml-0.5 inline-block w-[1.5px] h-[13px] align-middle"
                      style={{ backgroundColor: config.color }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="card px-5 py-3 flex items-center gap-3 flex-shrink-0">
        {isStreaming && (
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot flex-shrink-0" style={{ background: 'var(--color-maya)' }} />
        )}
        <span className="text-[13px] truncate" style={{ color: 'var(--color-muted)' }}>{statusText}</span>
      </div>
    </div>
  );
}
