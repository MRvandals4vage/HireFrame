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
  const [apiKey, setApiKey] = useState('');

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
    <div className="min-h-screen bg-canvas font-sans text-ink">
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
              apiKey={apiKey}
              setApiKey={setApiKey}
              onStart={handleStart}
            />
          </motion.div>
        )}

        {screen === 'debate' && (
          <motion.div
            key="debate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            <DebateView
              resumeText={resumeText}
              targetRole={targetRole}
              apiKey={apiKey}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            <ScoreReveal
              scoreData={scoreData}
              messages={messages}
              targetRole={targetRole}
              onRestart={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
