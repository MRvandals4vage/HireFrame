import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ScoreData, EvaluationMode, InterviewState, InterviewFeedback, RecruiterName } from '../types';

interface Props {
  scoreData: ScoreData | null;
  targetRole: string;
  evaluationMode: EvaluationMode;
  interviewState: InterviewState;
  setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>;
}

const RECRUITER_CONFIG: Record<RecruiterName, { name: string; role: string; color: string; tint: string }> = {
  ALEX: { name: 'Alex', role: 'Staff Engineer', color: '#B03A2E', tint: 'rgba(176,58,46,0.06)'  },
  MAYA: { name: 'Maya', role: 'Eng Manager',    color: '#1A8A65', tint: 'rgba(26,138,101,0.06)' },
  JIN:  { name: 'Jin',  role: 'VP Engineering', color: '#2557A7', tint: 'rgba(37,87,167,0.06)'  },
};

function extractJSON(text: string): string | null {
  const match = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
  if (!match) return null;
  return match[1].trim();
}

export function InterviewView({
  scoreData,
  targetRole,
  evaluationMode,
  interviewState,
  setInterviewState,
}: Props) {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = scoreData?.predicted_questions || [];
  const currentIndex = interviewState.questionIndex;
  const currentQuestion = questions[currentIndex];

  const hasQuestions = questions.length > 0;
  const isFinished = currentIndex >= questions.length;

  useEffect(() => {
    // When navigating back to a question, populate the textarea if they haven't submitted yet
    // Actually, if they already submitted, we show the feedback and hide the textarea
    if (!interviewState.feedbacks[currentIndex]) {
      setCurrentAnswer(interviewState.answers[currentIndex] || '');
    }
  }, [currentIndex, interviewState.answers, interviewState.feedbacks]);

  const handleSubmit = useCallback(async () => {
    if (!currentAnswer.trim() || isSubmitting || !currentQuestion) return;

    setIsSubmitting(true);
    setError(null);

    // Save answer to state
    setInterviewState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentIndex]: currentAnswer },
    }));

    const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const groqKey   = (import.meta as any).env?.VITE_GROQ_API_KEY   || '';
    
    const config = RECRUITER_CONFIG[currentQuestion.recruiter];

    const prompt = `You are simulating a senior hiring leader evaluating an interview response.
Recruiter persona: ${config.name} (${config.role}). 
Make your critique embody their specific persona (e.g. Alex is highly critical and technical, Maya is product/velocity focused, Jin is balanced and architectural).

Target role: ${targetRole}
Evaluation mode: ${evaluationMode}

Question asked: ${currentQuestion.question}
Candidate's answer: ${currentAnswer}

Provide an honest, highly specific, and constructive evaluation of the candidate's answer.
Return the output EXACTLY as a JSON block:
\`\`\`json
{
  "overall_score": <0-100>,
  "critique": "<one detailed paragraph of feedback from the perspective of the recruiter>",
  "metrics": [
    {"name": "<Metric 1 (e.g., Clarity, Depth, Architecture)>", "score": <0-100>, "feedback": "<short sentence>"},
    {"name": "<Metric 2>", "score": <0-100>, "feedback": "<short sentence>"},
    {"name": "<Metric 3>", "score": <0-100>, "feedback": "<short sentence>"}
  ],
  "better_answer": "<how the candidate should have answered to get a 100>"
}
\`\`\``;

    try {
      let responseBody = '';

      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7 },
            }),
          }
        );
        if (!r.ok) throw new Error(`Gemini ${r.status}`);
        const data = await r.json();
        responseBody = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (geminiErr) {
        // Fallback to Groq
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });
        if (!r.ok) throw new Error(`Groq ${r.status}`);
        const data = await r.json();
        responseBody = data.choices?.[0]?.message?.content || '';
      }

      const jsonStr = extractJSON(responseBody) || responseBody;
      const parsed = JSON.parse(jsonStr) as InterviewFeedback;

      if (parsed.overall_score === undefined || !parsed.critique) {
        throw new Error('Malformed feedback received.');
      }

      setInterviewState((prev) => ({
        ...prev,
        feedbacks: { ...prev.feedbacks, [currentIndex]: parsed },
      }));

    } catch (err: any) {
      setError(err.message || 'Failed to generate feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentAnswer, isSubmitting, currentQuestion, currentIndex, setInterviewState, targetRole, evaluationMode]);

  if (!hasQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-10 text-center max-w-md">
          <p className="font-label mb-2">No Questions Available</p>
          <p className="text-[14px] text-muted leading-relaxed">
            Please run the live evaluation first to generate specific interview questions based on your resume.
          </p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setInterviewState((prev) => ({ ...prev, questionIndex: prev.questionIndex + 1 }));
      setError(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setInterviewState((prev) => ({ ...prev, questionIndex: prev.questionIndex - 1 }));
      setError(null);
    }
  };

  const currentFeedback = interviewState.feedbacks[currentIndex];

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 max-w-3xl mx-auto w-full gap-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <h2 className="text-[20px] font-medium" style={{ color: 'var(--color-ink)' }}>Mock Interview</h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--color-muted)' }}>{targetRole} · {evaluationMode}</p>
        </div>
        <div className="flex gap-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className="w-8 h-1.5 rounded-full transition-colors"
              style={{
                background: idx === currentIndex ? 'var(--color-ink)' : interviewState.feedbacks[idx] ? 'var(--color-edge-strong)' : 'var(--color-edge)',
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
          {/* Question Card */}
          {currentQuestion && (
            <div className="card p-6 border-l-4" style={{ borderLeftColor: RECRUITER_CONFIG[currentQuestion.recruiter].color }}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                  style={{ backgroundColor: RECRUITER_CONFIG[currentQuestion.recruiter].color }}
                >
                  {currentQuestion.recruiter === 'ALEX' ? 'AX' : currentQuestion.recruiter === 'MAYA' ? 'MY' : 'JN'}
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--color-ink)' }}>
                    {RECRUITER_CONFIG[currentQuestion.recruiter].name}
                  </p>
                  <p className="text-[11px] leading-tight" style={{ color: RECRUITER_CONFIG[currentQuestion.recruiter].color }}>
                    {RECRUITER_CONFIG[currentQuestion.recruiter].role}
                  </p>
                </div>
                <span
                  className="ml-auto text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    color: currentQuestion.difficulty === 'hard' ? '#B03A2E' : currentQuestion.difficulty === 'medium' ? '#B45309' : '#1A8A65',
                    background: currentQuestion.difficulty === 'hard' ? 'rgba(176,58,46,0.08)' : currentQuestion.difficulty === 'medium' ? 'rgba(180,83,9,0.08)' : 'rgba(26,138,101,0.08)',
                  }}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>
              <p className="text-[16px] leading-relaxed" style={{ color: 'var(--color-ink)' }}>
                {currentQuestion.question}
              </p>
            </div>
          )}

          {/* Answer Area */}
          {!currentFeedback ? (
            <div className="space-y-4">
              <p className="font-label">Your Answer</p>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your response here... (Be as detailed as you would in a real interview)"
                rows={8}
                disabled={isSubmitting}
                className="clay-input w-full p-4 text-[14px] leading-relaxed resize-none transition-all"
                style={{
                  color: 'var(--color-ink)',
                }}
              />
              
              {error && (
                <div className="text-[13px] p-3 rounded-lg" style={{ color: '#B03A2E', background: 'rgba(176,58,46,0.08)' }}>
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0 || isSubmitting}
                  className="text-[13px] font-medium text-muted hover:text-ink disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!currentAnswer.trim() || isSubmitting}
                  className={`flex items-center gap-2 px-6 py-2.5 text-[14px] ${(!currentAnswer.trim() || isSubmitting) ? 'clay-btn opacity-50 cursor-not-allowed' : 'clay-btn-primary'}`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'currentColor' }} />
                      Evaluating...
                    </>
                  ) : 'Submit Answer'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Feedback Breakdown */}
              <div>
                <p className="font-label mb-3">Evaluation</p>
                <div className="card p-6 space-y-5">
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border-[3px] flex items-center justify-center flex-shrink-0" style={{ borderColor: currentFeedback.overall_score >= 70 ? '#1A8A65' : currentFeedback.overall_score >= 40 ? '#B45309' : '#B03A2E' }}>
                      <span className="text-[15px] font-semibold" style={{ color: 'var(--color-ink)' }}>{currentFeedback.overall_score}</span>
                    </div>
                    <p className="text-[14px] leading-relaxed italic" style={{ color: 'var(--color-ink-2)' }}>
                      &ldquo;{currentFeedback.critique}&rdquo;
                    </p>
                  </div>

                  <div className="w-full h-px" style={{ backgroundColor: 'var(--color-edge)' }} />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {currentFeedback.metrics.map((m, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[12px] font-medium" style={{ color: 'var(--color-ink)' }}>{m.name}</span>
                          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{m.score}/100</span>
                        </div>
                        <div className="h-1 w-full rounded-full overflow-hidden mb-2" style={{ background: 'var(--color-edge)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${m.score}%`,
                              backgroundColor: m.score >= 70 ? '#1A8A65' : m.score >= 40 ? '#B45309' : '#B03A2E'
                            }}
                          />
                        </div>
                        <p className="text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>{m.feedback}</p>
                      </div>
                    ))}
                  </div>

                  <div className="w-full h-px" style={{ backgroundColor: 'var(--color-edge)' }} />

                  <div>
                    <span className="inline-block text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded mb-2 text-maya bg-maya/10" style={{ color: '#1A8A65', background: 'rgba(26,138,101,0.08)' }}>
                      How to get a 100
                    </span>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>{currentFeedback.better_answer}</p>
                  </div>

                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="text-[13px] font-medium text-muted hover:text-ink disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="clay-btn px-6 py-2.5 text-[14px]"
                  >
                    Next Question
                  </button>
                ) : (
                  <span className="text-[13px] font-medium text-muted">Interview Complete</span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
