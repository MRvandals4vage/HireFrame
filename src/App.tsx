import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LandingView } from './components/LandingView';
import { DebateView } from './components/DebateView';
import { ScoreReveal } from './components/ScoreReveal';
import { InterviewView } from './components/InterviewView';
import type { Screen, Message, ScoreData, CoverageTopic, EvaluationMode, InterviewState } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('FAANG');
  const [messages, setMessages] = useState<Message[]>([]);
  const [coverageTopics, setCoverageTopics] = useState<Set<CoverageTopic>>(new Set());
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [interviewState, setInterviewState] = useState<InterviewState>({
    questionIndex: 0,
    answers: {},
    feedbacks: {},
  });

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
    setEvaluationMode('FAANG');
    setMessages([]);
    setCoverageTopics(new Set());
    setScoreData(null);
    setInterviewState({ questionIndex: 0, answers: {}, feedbacks: {} });
    setScreen('landing');
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink flex">
      <AnimatePresence>
        {screen !== 'landing' && (
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="w-56 border-r border-edge bg-surface flex flex-col py-8 px-5 sticky top-0 h-screen shrink-0 z-10"
          >
            {/* Wordmark */}
            <div className="mb-10">
              <span className="text-[14px] font-bold tracking-tight text-ink">Hire Frame</span>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-0.5 flex-1">
              <button
                onClick={() => setScreen('debate')}
                className={`nav-item ${screen === 'debate' ? 'active' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${screen === 'debate' ? 'bg-ink' : 'bg-edge-strong'}`} />
                Evaluation
              </button>

              <button
                onClick={() => { if (scoreData) setScreen('reveal'); }}
                disabled={!scoreData}
                className={`nav-item ${screen === 'reveal' ? 'active' : ''} ${!scoreData ? 'disabled' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${screen === 'reveal' ? 'bg-ink' : !scoreData ? 'bg-edge' : 'bg-edge-strong'}`} />
                Diagnostics
                {!scoreData && (
                  <span className="ml-auto text-[10px] text-faint font-normal">pending</span>
                )}
              </button>
              <button
                onClick={() => { if (scoreData) setScreen('interview'); }}
                disabled={!scoreData}
                className={`nav-item ${screen === 'interview' ? 'active' : ''} ${!scoreData ? 'disabled' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${screen === 'interview' ? 'bg-ink' : !scoreData ? 'bg-edge' : 'bg-edge-strong'}`} />
                Mock Interview
                {!scoreData && (
                  <span className="ml-auto text-[10px] text-faint font-normal">pending</span>
                )}
              </button>
            </nav>

            {/* End session */}
            <button
              onClick={handleRestart}
              className="nav-item text-muted hover:text-alex mt-4"
            >
              End session
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
                evaluationMode={evaluationMode}
                setEvaluationMode={setEvaluationMode}
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
                evaluationMode={evaluationMode}
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

          {screen === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <InterviewView
                scoreData={scoreData}
                targetRole={targetRole}
                evaluationMode={evaluationMode}
                interviewState={interviewState}
                setInterviewState={setInterviewState}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
