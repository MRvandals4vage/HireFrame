import React from 'react';
import { Copy, AlertTriangle, TrendingUp, Target, Quote } from 'lucide-react';
import { motion } from 'motion/react';

export function DiagnosticsView() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto pb-16">
        {/* Page Header & Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 mt-4 md:mt-8">
          <div>
            <p className="font-label-caps text-primary mb-2 uppercase tracking-widest">Simulation Complete</p>
            <h2 className="font-headline-lg text-on-surface">Post-Interview Diagnostics</h2>
          </div>
          <button className="bg-primary text-on-primary font-label-caps px-6 py-3 rounded-lg hover:bg-primary-container transition-colors flex items-center gap-2 flex-shrink-0 shadow-sm border border-transparent">
            <Copy size={16} />
            Copy my report
          </button>
        </div>

        {/* Primary Score Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest border border-outline-variant p-8 md:p-12 mb-8 rounded-lg relative overflow-hidden flex flex-col items-center md:items-start text-center md:text-left"
        >
          {/* Decorative subtle grid background */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(var(--color-on-surface) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          ></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 mb-6">
            <div className="flex items-baseline">
              <span className="font-display-accent text-on-surface">74</span>
              <span className="font-sans text-2xl text-on-surface-variant ml-1">/100</span>
            </div>
            <div className="hidden md:block w-px h-16 bg-outline-variant"></div>
            <div className="bg-surface-container py-2 px-4 rounded-full border border-outline-variant flex items-center gap-2 mb-2 md:mb-4">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span className="font-label-caps text-on-surface">Solid Baseline</span>
            </div>
          </div>
          <p className="font-sans text-lg italic text-on-surface-variant max-w-2xl border-l-2 border-primary pl-4 relative z-10 text-left">
            "Strong technical foundation, but needs more project 'why'."
          </p>
        </motion.div>

        {/* Three Columns (Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Blockers */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-container-lowest border border-outline-variant border-t-[4px] border-t-tertiary p-6 flex flex-col h-full rounded-b-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
              <AlertTriangle size={20} className="text-tertiary" />
              <h3 className="font-sans text-xl font-bold text-on-surface">Hire Blockers</h3>
            </div>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start gap-3">
                <span className="text-outline-variant text-lg mt-0.5">-</span>
                <span className="font-sans text-sm text-on-surface-variant leading-relaxed">
                  Struggled to articulate the trade-offs between monolithic and microservice architectures under load.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-outline-variant text-lg mt-0.5">-</span>
                <span className="font-sans text-sm text-on-surface-variant leading-relaxed">
                  Interrupted the interviewer twice during the system design constraints gathering phase.
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Accelerators */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-container-lowest border border-outline-variant border-t-[4px] border-t-secondary p-6 flex flex-col h-full rounded-b-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
              <TrendingUp size={20} className="text-secondary" />
              <h3 className="font-sans text-xl font-bold text-on-surface">Hire Accelerators</h3>
            </div>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start gap-3">
                <span className="text-outline-variant text-lg mt-0.5">+</span>
                <span className="font-sans text-sm text-on-surface-variant leading-relaxed">
                  Flawless execution of the algorithmic coding challenge; optimal time complexity achieved rapidly.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-outline-variant text-lg mt-0.5">+</span>
                <span className="font-sans text-sm text-on-surface-variant leading-relaxed">
                  Demonstrated excellent psychological safety awareness when discussing past team failures.
                </span>
              </li>
            </ul>
          </motion.div>

          {/* 30-Day Plan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-container-lowest border border-outline-variant border-t-[4px] border-t-primary p-6 flex flex-col h-full rounded-b-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
              <Target size={20} className="text-primary" />
              <h3 className="font-sans text-xl font-bold text-on-surface">30-Day Plan</h3>
            </div>
            <ul className="space-y-5 flex-1">
              <li className="flex flex-col gap-1">
                <span className="font-label-caps text-primary bg-primary-fixed inline-block self-start px-2 py-0.5 rounded border border-primary-fixed-dim text-[10px]">
                  [High Effort]
                </span>
                <span className="font-sans text-sm text-on-surface-variant leading-relaxed mt-1">
                  Implement a load-balancer in a personal project to grasp horizontal scaling realities.
                </span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-label-caps text-secondary bg-secondary-fixed inline-block self-start px-2 py-0.5 rounded border border-secondary-fixed-dim text-[10px]">
                  [Quick Win]
                </span>
                <span className="font-sans text-sm text-on-surface-variant leading-relaxed mt-1">
                  Format three past project experiences rigidly into the STAR framework.
                </span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-label-caps text-secondary bg-secondary-fixed inline-block self-start px-2 py-0.5 rounded border border-secondary-fixed-dim text-[10px]">
                  [Quick Win]
                </span>
                <span className="font-sans text-sm text-on-surface-variant leading-relaxed mt-1">
                  Practice active listening drills; mandate a 2-second pause before answering.
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Highlight Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-container-high border border-outline-variant p-6 md:p-11 rounded-lg flex items-start gap-4 shadow-sm"
        >
          <Quote className="text-primary opacity-20 mt-1 shrink-0" size={32} />
          <div>
            <p className="font-sans text-xl text-on-surface font-medium leading-relaxed">
              The one thing even Alex couldn't argue with: Your depth of system design knowledge.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Mock icon for consistency with the prompt's warning symbol
function AlertTriangle({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
