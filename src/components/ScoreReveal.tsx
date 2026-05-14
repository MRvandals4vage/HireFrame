import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { ScoreData, Message, RecruiterName } from '../types';

interface Props {
  scoreData: ScoreData;
  messages: Message[];
  targetRole: string;
  onRestart: () => void;
}

function AnimatedScore({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target]);

  return <span>{current}</span>;
}

function getScoreColor(score: number): string {
  if (score < 50) return '#C0392B';
  if (score < 75) return '#D97706';
  return '#1D9E75';
}

export function ScoreReveal({ scoreData, messages, targetRole, onRestart }: Props) {
  const [copied, setCopied] = useState(false);
  const scoreColor = getScoreColor(scoreData.readiness_score);

  const handleCopy = () => {
    const report = `
SignalForge Interview Readiness Report
=======================================
Role: ${targetRole}
Score: ${scoreData.readiness_score}/100
Verdict: ${scoreData.verdict}

Hire Blockers:
${scoreData.hire_blockers.map((b) => `  • ${b}`).join('\n')}

Hire Accelerators:
${scoreData.hire_accelerators.map((a) => `  • ${a}`).join('\n')}

30-Day Plan:
${scoreData.thirty_day_plan.map((p) => `  • ${p.action} (Impact: ${p.impact}, Effort: ${p.effort})`).join('\n')}

Strongest Asset: ${scoreData.strongest_asset}

Debate Transcript:
${messages.map((m) => `  [${m.recruiter}] ${m.text}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-12 sm:py-16">
      <div className="w-full max-w-[720px]">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface border border-edge rounded-xl p-8 sm:p-10 mb-6 text-center"
        >
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="font-score text-ink">
              <AnimatedScore target={scoreData.readiness_score} />
            </span>
            <span className="font-score-unit text-muted">/100</span>
          </div>

          {/* Colored line under score */}
          <div className="w-24 h-[3px] rounded-full mx-auto mb-5" style={{ backgroundColor: scoreColor }} />

          <p className="text-base italic text-muted max-w-lg mx-auto leading-relaxed">
            "{scoreData.verdict}"
          </p>
        </motion.div>

        {/* Three Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Hire Blockers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-surface border border-edge rounded-xl p-5 border-l-[3px]"
            style={{ borderLeftColor: '#C0392B' }}
          >
            <h3 className="text-sm font-medium text-ink mb-4">Hire blockers</h3>
            <ul className="space-y-3">
              {scoreData.hire_blockers.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                  <span className="text-alex mt-0.5 flex-shrink-0">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Hire Accelerators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-surface border border-edge rounded-xl p-5 border-l-[3px]"
            style={{ borderLeftColor: '#1D9E75' }}
          >
            <h3 className="text-sm font-medium text-ink mb-4">Hire accelerators</h3>
            <ul className="space-y-3">
              {scoreData.hire_accelerators.map((a, i) => {
                const effortMatch = a.match(/\(([^)]+)\)$/);
                const label = effortMatch ? a.slice(0, a.lastIndexOf('(')).trim() : a;
                const effort = effortMatch ? effortMatch[1] : null;
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                    <span className="text-maya mt-0.5 flex-shrink-0">+</span>
                    <span>
                      {label}
                      {effort && (
                        <span className="inline-block ml-1.5 text-[10px] font-medium uppercase tracking-wider text-maya bg-maya/10 px-1.5 py-0.5 rounded">
                          {effort}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* 30-Day Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="bg-surface border border-edge rounded-xl p-5 border-l-[3px]"
            style={{ borderLeftColor: '#2C6FBF' }}
          >
            <h3 className="text-sm font-medium text-ink mb-4">30-day plan</h3>
            <ul className="space-y-4">
              {scoreData.thirty_day_plan.map((p, i) => (
                <li key={i} className="text-sm text-muted leading-relaxed">
                  <p className="mb-1.5">{p.action}</p>
                  <div className="flex gap-1.5">
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: p.impact === 'high' ? '#C0392B' : '#D97706',
                        backgroundColor: p.impact === 'high' ? 'rgba(192,57,43,0.08)' : 'rgba(217,119,6,0.08)',
                      }}
                    >
                      {p.impact}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-jin bg-jin/10 px-1.5 py-0.5 rounded">
                      {p.effort}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Strongest Asset Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="bg-highlight border border-edge rounded-xl p-6 mb-8 border-l-[3px]"
          style={{ borderLeftColor: '#D97706' }}
        >
          <p className="text-xs font-medium text-amber uppercase tracking-wider mb-2">
            The one thing even Alex couldn't argue with:
          </p>
          <p className="text-base font-semibold text-ink leading-relaxed">
            {scoreData.strongest_asset}
          </p>
        </motion.div>

        {/* Recruiter Verdict Cards */}
        {scoreData.recruiter_verdicts && scoreData.recruiter_verdicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mb-6"
          >
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Committee verdicts</h3>
            <div className="grid grid-cols-3 gap-3">
              {scoreData.recruiter_verdicts.map(({ recruiter, stance, reasoning }) => {
                const colors: Record<RecruiterName, string> = { ALEX: '#C0392B', MAYA: '#1D9E75', JIN: '#2C6FBF' };
                const names: Record<RecruiterName, string>  = { ALEX: 'Alex', MAYA: 'Maya', JIN: 'Jin' };
                const stanceColors: Record<string, string>  = { hire: '#1D9E75', 'no-hire': '#C0392B', maybe: '#D97706' };
                const stanceLabels: Record<string, string>  = { hire: 'Hire ✓', 'no-hire': 'No hire ✗', maybe: 'Maybe ?' };
                return (
                  <div key={recruiter} className="bg-surface border border-edge rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0"
                        style={{ backgroundColor: colors[recruiter] }}
                      >
                        {recruiter === 'ALEX' ? 'AX' : recruiter === 'MAYA' ? 'MY' : 'JN'}
                      </div>
                      <span className="text-xs font-medium text-ink">{names[recruiter]}</span>
                    </div>
                    <span
                      className="inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded mb-2"
                      style={{ color: stanceColors[stance], backgroundColor: stanceColors[stance] + '18' }}
                    >
                      {stanceLabels[stance]}
                    </span>
                    <p className="text-xs text-muted leading-relaxed">{reasoning}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Predicted Interview Questions */}
        {scoreData.predicted_questions && scoreData.predicted_questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.4 }}
            className="mb-8"
          >
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Expect these questions</h3>
            <div className="space-y-2">
              {scoreData.predicted_questions.map(({ question, recruiter, difficulty }, i) => {
                const colors: Record<RecruiterName, string> = { ALEX: '#C0392B', MAYA: '#1D9E75', JIN: '#2C6FBF' };
                const names: Record<RecruiterName, string>  = { ALEX: 'Alex', MAYA: 'Maya', JIN: 'Jin' };
                const diffColors: Record<string, string>    = { easy: '#1D9E75', medium: '#D97706', hard: '#C0392B' };
                return (
                  <div key={i} className="bg-surface border border-edge rounded-lg px-4 py-3 flex gap-3 items-start">
                    <span
                      className="mt-0.5 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider w-5 text-center"
                      style={{ color: colors[recruiter] }}
                    >
                      {recruiter === 'ALEX' ? 'AX' : recruiter === 'MAYA' ? 'MY' : 'JN'}
                    </span>
                    <p className="text-sm text-ink flex-1 leading-relaxed">{question}</p>
                    <span
                      className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ color: diffColors[difficulty], backgroundColor: diffColors[difficulty] + '18' }}
                    >
                      {difficulty}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Bottom Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-3 justify-center"
        >
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto bg-dark text-white text-sm font-medium px-6 py-3 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy my report
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
