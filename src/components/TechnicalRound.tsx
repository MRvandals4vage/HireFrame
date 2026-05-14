import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  starterCode: string;
  testCases: { input: string; output: string }[];
}

const PROBLEMS: Problem[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    starterCode: 'function twoSum(nums, target) {\n  // Your code here\n}',
    testCases: [{ input: '[2,7,11,15], 9', output: '[0,1]' }]
  },
  {
    id: '2',
    title: 'Validate Binary Search Tree',
    difficulty: 'Medium',
    description: 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).',
    starterCode: 'function isValidBST(root) {\n  // Your code here\n}',
    testCases: [{ input: '[2,1,3]', output: 'true' }]
  }
];

export function TechnicalRound({ onComplete }: { onComplete: () => void }) {
  const [selectedProblem, setSelectedProblem] = useState<Problem>(PROBLEMS[0]);
  const [code, setCode] = useState(selectedProblem.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setOutput('Test cases passed: 1/1\nRuntime: 52ms (Beats 88%)\nMemory: 42.1MB');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-7xl mx-auto w-full gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-label mb-1">Technical Round</p>
          <h1 className="text-2xl font-bold tracking-tight">Data Structures & Algorithms</h1>
        </div>
        <button 
          onClick={onComplete}
          className="clay-btn bg-ink text-canvas px-6 py-2.5"
        >
          Submit Round
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px]">
        {/* Problem Description */}
        <div className="card p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex gap-2">
            {PROBLEMS.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProblem(p);
                  setCode(p.starterCode);
                  setOutput('');
                }}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  selectedProblem.id === p.id 
                    ? 'bg-ink text-canvas shadow-sm' 
                    : 'bg-edge/50 text-muted hover:bg-edge'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold">{selectedProblem.title}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                selectedProblem.difficulty === 'Easy' ? 'bg-maya/10 text-maya' : 'bg-alex/10 text-alex'
              }`}>
                {selectedProblem.difficulty}
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-muted whitespace-pre-wrap">
              {selectedProblem.description}
            </p>
          </div>

          <div className="mt-auto pt-6 border-t border-edge">
            <h3 className="font-label mb-3">Example Test Cases</h3>
            {selectedProblem.testCases.map((tc, i) => (
              <div key={i} className="bg-canvas p-3 rounded border border-edge text-[13px] font-mono">
                <p className="text-faint mb-1">// Input</p>
                <p className="mb-3">{tc.input}</p>
                <p className="text-faint mb-1">// Output</p>
                <p>{tc.output}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Code Editor */}
        <div className="card overflow-hidden flex flex-col bg-[#1A1A1A]">
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-[#242424]">
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">JavaScript (Node.js)</span>
            <button 
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-1 rounded bg-maya hover:bg-maya/90 text-white text-[12px] font-bold transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
          
          <div className="flex-1 relative group">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full bg-transparent text-maya/90 font-mono text-[14px] p-6 focus:outline-none resize-none leading-relaxed"
              spellCheck="false"
            />
            {/* Visual Editor Decorations */}
            <div className="absolute left-0 top-0 w-12 h-full bg-black/20 border-r border-white/5 flex flex-col items-center pt-6 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <span key={i} className="text-[11px] text-white/10 font-mono leading-relaxed h-[21px]">{i + 1}</span>
              ))}
            </div>
          </div>

          <div className={`p-4 border-t border-white/5 transition-all ${output ? 'h-40' : 'h-10'} overflow-y-auto bg-[#121212]`}>
            {!output ? (
              <span className="text-[11px] text-white/20 font-mono">Console output will appear here...</span>
            ) : (
              <div className="font-mono text-[13px] text-maya/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-white/40 mb-2 uppercase tracking-tighter text-[10px]">Test Results:</p>
                <pre className="whitespace-pre-wrap">{output}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
