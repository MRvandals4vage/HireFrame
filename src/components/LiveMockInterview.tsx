import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Metric {
  label: string;
  value: number;
  status: 'good' | 'average' | 'critical';
}

export function LiveMockInterview({ onComplete }: { onComplete: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'Speaking Rate', value: 78, status: 'good' },
    { label: 'Eye Contact', value: 92, status: 'good' },
    { label: 'Confidence', value: 64, status: 'average' },
    { label: 'Filler Words', value: 12, status: 'critical' },
  ]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error("Camera access denied", err));

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        // Randomize metrics slightly for "live" feel
        setMetrics(prev => prev.map(m => ({
          ...m,
          value: Math.max(10, Math.min(100, m.value + (Math.random() * 4 - 2)))
        })));
      };
    }

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-7xl mx-auto w-full gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-label mb-1">Live Simulation</p>
          <h1 className="text-2xl font-bold tracking-tight">AI Behavior Analysis</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-maya/10 border border-maya/20">
            <span className="w-2 h-2 rounded-full bg-maya animate-pulse" />
            <span className="text-[11px] font-bold text-maya uppercase tracking-wider">AI Observer Active</span>
          </div>
          <button 
            onClick={onComplete}
            className="clay-btn bg-ink text-canvas px-6 py-2.5"
          >
            End Interview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-[600px]">
        {/* Video Feed */}
        <div className="lg:col-span-2 relative card overflow-hidden bg-black flex items-center justify-center group">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-80"
          />
          
          {/* Mannerism Overlays */}
          <div className="absolute inset-0 pointer-events-none p-6">
            <div className="w-full h-full border border-white/10 rounded-lg relative">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-maya/40" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-maya/40" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-maya/40" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-maya/40" />

              {/* Scanning line animation */}
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-maya/30 to-transparent z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              />

              {/* Face Tracking Box Sim */}
              <motion.div 
                animate={{ 
                  x: [0, 10, -5, 0],
                  y: [0, -5, 8, 0],
                  scale: [1, 1.02, 0.98, 1]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border border-[#5DADE2]/60 rounded-xl"
              >
                <span className="absolute -top-6 left-0 text-[10px] font-mono text-maya uppercase bg-black/40 px-2 py-0.5 rounded">
                  subject_identified: primary
                </span>
                <span className="absolute -bottom-6 right-0 text-[10px] font-mono text-maya/60 uppercase">
                  tracking_loss: 0.02%
                </span>
              </motion.div>
            </div>
          </div>

          {/* Transcript overlay */}
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
            <p className="text-[10px] font-mono text-white/40 uppercase mb-2 tracking-widest">Real-time Transcription</p>
            <p className="text-white/90 text-[15px] leading-snug line-clamp-2 italic">
              {transcript || (isRecording ? "Listening..." : "Click microphone to start...")}
            </p>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 right-10 flex flex-col gap-3">
             <button 
              onClick={toggleRecording}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-alex shadow-[0_0_20px_rgba(176,58,46,0.5)]' : 'bg-white hover:bg-white/90'
              }`}
             >
               {isRecording ? (
                 <div className="w-5 h-5 bg-white rounded-sm" />
               ) : (
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-ink">
                   <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                   <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                 </svg>
               )}
             </button>
          </div>
        </div>

        {/* Behavior Metrics */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 flex-1">
            <h3 className="font-label mb-6">Behavioral Analysis</h3>
            <div className="space-y-8">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[13px] font-medium">{m.label}</span>
                    <span className={`text-[11px] font-bold ${
                      m.status === 'good' ? 'text-jin' : m.status === 'average' ? 'text-maya' : 'text-alex'
                    }`}>
                      {Math.round(m.value)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-edge rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.value}%` }}
                      className={`h-full rounded-full ${
                        m.status === 'good' ? 'bg-jin' : m.status === 'average' ? 'bg-maya' : 'bg-alex'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 p-4 rounded-lg bg-canvas border border-edge">
              <p className="text-[11px] font-mono text-faint uppercase mb-2">AI Observation</p>
              <p className="text-[13px] italic leading-relaxed">
                "Subject shows high engagement but frequent use of 'um' and 'like'. Confidence levels fluctuating during architectural questions."
              </p>
            </div>
          </div>

          <div className="card p-5 bg-ink text-canvas">
            <p className="text-[11px] font-mono text-white/40 uppercase mb-3 tracking-widest">Current Persona</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-alex flex items-center justify-center text-[12px] font-bold">AX</div>
              <div>
                <p className="text-[14px] font-bold">Alex (The Skeptic)</p>
                <p className="text-[11px] text-white/50">Probing your system design claims...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
