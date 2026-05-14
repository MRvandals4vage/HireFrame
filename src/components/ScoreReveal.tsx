import React, { useState, useEffect, useRef } from 'react';
// Main diagnosis and score display component
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
      <div className="w-full max-w-[680px]">

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-8 sm:p-10 mb-5 text-center"
        >
          <p className="font-label mb-6">Readiness Score</p>
          <div className="flex items-baseline justify-center gap-1 mb-3">
            <span className="font-score" style={{ color: scoreColor }}>
              <AnimatedScore target={scoreData.readiness_score} />
            </span>
            <span className="font-score-unit">/100</span>
          </div>

          <div className="w-16 h-px mx-auto mb-5" style={{ backgroundColor: 'var(--color-edge)' }} />

          <p className="text-[15px] leading-relaxed italic" style={{ color: 'var(--color-muted)' }}>
            &ldquo;{scoreData.verdict}&rdquo;
          </p>
        </motion.div>

        {/* Three Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {/* Hire Blockers */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="card p-5"
            style={{ borderLeft: '2px solid #B03A2E' }}
          >
            <p className="font-label mb-4" style={{ color: '#B03A2E' }}>Blockers</p>
            <ul className="space-y-3">
              {scoreData.hire_blockers.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                  <span className="flex-shrink-0 mt-1 w-1 h-1 rounded-full" style={{ background: '#B03A2E', marginTop: '6px' }} />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Hire Accelerators */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.35 }}
            className="card p-5"
            style={{ borderLeft: '2px solid #1A8A65' }}
          >
            <p className="font-label mb-4" style={{ color: '#1A8A65' }}>Quick wins</p>
            <ul className="space-y-3">
              {scoreData.hire_accelerators.map((a, i) => {
                const effortMatch = a.match(/\(([^)]+)\)$/);
                const label = effortMatch ? a.slice(0, a.lastIndexOf('(')).trim() : a;
                const effort = effortMatch ? effortMatch[1] : null;
                return (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                    <span className="flex-shrink-0 w-1 h-1 rounded-full" style={{ background: '#1A8A65', marginTop: '6px' }} />
                    <span>
                      {label}
                      {effort && (
                        <span className="inline-block ml-1.5 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: '#1A8A65', background: 'rgba(26,138,101,0.1)' }}>
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="card p-5"
            style={{ borderLeft: '2px solid #2557A7' }}
          >
            <p className="font-label mb-4" style={{ color: '#2557A7' }}>30-day plan</p>
            <ul className="space-y-4">
              {scoreData.thirty_day_plan.map((p, i) => (
                <li key={i} className="text-[13px]" style={{ color: 'var(--color-ink-2)' }}>
                  <p className="mb-1.5 leading-relaxed">{p.action}</p>
                  <div className="flex gap-1.5">
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: p.impact === 'high' ? '#B03A2E' : '#B45309',
                        background: p.impact === 'high' ? 'rgba(176,58,46,0.08)' : 'rgba(180,83,9,0.08)',
                      }}
                    >
                      {p.impact}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: '#2557A7', background: 'rgba(37,87,167,0.08)' }}>
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="card p-6 mb-8"
          style={{ borderLeft: '2px solid var(--color-ink)', background: 'var(--color-surface)' }}
        >
          <p className="font-label mb-2">The one thing even Alex conceded on:</p>
          <p className="text-[15px] font-medium leading-relaxed" style={{ color: 'var(--color-ink)' }}>
            {scoreData.strongest_asset}
          </p>
        </motion.div>

        {/* Recruiter Verdict Cards */}
        {scoreData.recruiter_verdicts && scoreData.recruiter_verdicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.35 }}
            className="mb-8"
          >
            <h3 className="font-label mb-4 text-center">Committee verdicts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {scoreData.recruiter_verdicts.map(({ recruiter, stance, reasoning }) => {
                const colors: Record<RecruiterName, string> = { ALEX: '#B03A2E', MAYA: '#1A8A65', JIN: '#2557A7' };
                const names: Record<RecruiterName, string>  = { ALEX: 'Alex', MAYA: 'Maya', JIN: 'Jin' };
                const stanceColors: Record<string, string>  = { hire: '#1A8A65', 'no-hire': '#B03A2E', maybe: '#B45309' };
                const stanceLabels: Record<string, string>  = { hire: 'Hire', 'no-hire': 'No hire', maybe: 'Maybe' };
                return (
                  <div key={recruiter} className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-medium flex-shrink-0"
                        style={{ backgroundColor: colors[recruiter] }}
                      >
                        {recruiter === 'ALEX' ? 'AX' : recruiter === 'MAYA' ? 'MY' : 'JN'}
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: 'var(--color-ink)' }}>{names[recruiter]}</span>
                      <span
                        className="ml-auto text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: stanceColors[stance], background: stanceColors[stance] + '18' }}
                      >
                        {stanceLabels[stance]}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>{reasoning}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Predicted Interview Questions */}
        {scoreData.predicted_questions && scoreData.predicted_questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.35 }}
            className="mb-10"
          >
            <h3 className="font-label mb-4 text-center">Expect these questions</h3>
            <div className="space-y-2">
              {scoreData.predicted_questions.map(({ question, recruiter, difficulty }, i) => {
                const colors: Record<RecruiterName, string> = { ALEX: '#B03A2E', MAYA: '#1A8A65', JIN: '#2557A7' };
                const diffColors: Record<string, string>    = { easy: '#1A8A65', medium: '#B45309', hard: '#B03A2E' };
                return (
                  <div key={i} className="card px-4 py-3 flex gap-3 items-start">
                    <span
                      className="mt-[3px] flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider w-5 text-center"
                      style={{ color: colors[recruiter] }}
                    >
                      {recruiter === 'ALEX' ? 'AX' : recruiter === 'MAYA' ? 'MY' : 'JN'}
                    </span>
                    <p className="text-[13px] flex-1 leading-relaxed" style={{ color: 'var(--color-ink)' }}>{question}</p>
                    <span
                      className="flex-shrink-0 text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5"
                      style={{ color: diffColors[difficulty], background: diffColors[difficulty] + '18' }}
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
          className="flex justify-center pb-8"
        >
          <button
            onClick={handleCopy}
            className="clay-btn-primary flex items-center justify-center gap-2 px-8 py-3 text-[14px]"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy report
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
