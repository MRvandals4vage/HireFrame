import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LandingView } from './components/LandingView';
import { DebateView } from './components/DebateView';
import { ScoreReveal } from './components/ScoreReveal';
import type { Screen, Message, ScoreData, CoverageTopic } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [coverageTopics, setCoverageTopics] = useState<Set<CoverageTopic>>(new Set());
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);

  const handleStart = () => {
    setMessages([]);
    setCoverageTopics(new Set());
    setScoreData(null);
    setScreen('debate');
  };

  const handleDebateComplete = (data: ScoreData) => {
    setScoreData(data);
    setScreen('reveal');
  };

  const handleRestart = () => {
    setResumeText('');
    setTargetRole('');
    setMessages([]);
    setCoverageTopics(new Set());
    setScoreData(null);
    setScreen('landing');
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink flex">
      <AnimatePresence>
        {screen !== 'landing' && (
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-64 border-r border-edge bg-surface flex flex-col p-6 sticky top-0 h-screen shrink-0 z-10"
          >
            <div className="flex items-center gap-2 font-semibold text-lg mb-8 tracking-tight text-dark">
              <div className="w-6 h-6 rounded-md bg-dark" />
              SignalForge
            </div>
            
            <nav className="flex flex-col gap-2 flex-1">
              <button 
                onClick={() => setScreen('debate')}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${screen === 'debate' ? 'bg-dark text-white shadow-sm' : 'text-muted hover:bg-edge/50'}`}
              >
                Live Evaluation
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => { if (scoreData) setScreen('reveal') }}
                  disabled={!scoreData}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${screen === 'reveal' ? 'bg-dark text-white shadow-sm' : !scoreData ? 'opacity-50 cursor-not-allowed text-muted/50' : 'text-muted hover:bg-edge/50'}`}
                >
                  Diagnostics Report
                </button>
                {!scoreData && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-edge animate-pulse" />
                )}
              </div>
            </nav>

            <button 
              onClick={handleRestart}
              className="text-left px-4 py-2.5 text-sm text-alex hover:bg-alex/10 rounded-lg transition-colors font-medium mt-auto"
            >
              End Session
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 bg-canvas overflow-x-hidden">
        <AnimatePresence mode="wait">
          {screen === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LandingView
                resumeText={resumeText}
                setResumeText={setResumeText}
                targetRole={targetRole}
                setTargetRole={setTargetRole}
                onStart={handleStart}
              />
            </motion.div>
          )}

          {screen === 'debate' && (
            <motion.div
              key="debate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-screen"
            >
              <DebateView
                resumeText={resumeText}
                targetRole={targetRole}
                messages={messages}
                setMessages={setMessages}
                coverageTopics={coverageTopics}
                setCoverageTopics={setCoverageTopics}
                onComplete={handleDebateComplete}
              />
            </motion.div>
          )}

          {screen === 'reveal' && scoreData && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-screen"
            >
              <ScoreReveal
                scoreData={scoreData}
                messages={messages}
                targetRole={targetRole}
                onRestart={() => {}}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
