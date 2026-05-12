'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send, Plus, Clock, Check, ChevronRight, Sparkles, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  answer: string;
  captured: boolean;
}

interface Session {
  name: string;
  phase: string;
  started: string;
  questionCount?: number;
}

// ── Voice Recognition Hook ────────────────────────────────────────

function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input requires Chrome or Edge. Please type your answers or use macOS dictation (Fn+F2).');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      // Build transcript from ALL results (SpeechRecognitionResultList)
      // This avoids duplication because each result is only added once
      let fullTranscript = '';
      let hasInterim = false;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        fullTranscript += result[0].transcript;
        if (!result.isFinal) hasInterim = true;
      }
      // Add trailing indicator only if we're still listening and the latest result isn't final
      setTranscript(hasInterim ? fullTranscript + ' (...)' : fullTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Don't stop on no-speech, just keep listening
        return;
      }
      if (event.error === 'aborted') return;
      console.error('Speech error:', event.error);
      setListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if user hasn't manually stopped
      // This prevents the mic from dying mid-sentence
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    // Remove trailing (...)
    setTranscript(prev => prev.replace(/\(\.\.\.\)$/, '').trim());
  }, []);

  return { listening, transcript, setTranscript, startListening, stopListening };
}

// ── Main Page ─────────────────────────────────────────────────────

export default function InterviewStudio() {
  const [phase, setPhase] = useState<'setup' | 'interviewing' | 'done'>('setup');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [sessionName, setSessionName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({ totalAnswers: 0, totalChunks: 0 });

  const voice = useVoiceInput();
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions on mount
  useEffect(() => {
    fetch('/api/admin/interview-capture')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSessions(data);
      })
      .catch(() => {});
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/interview-capture?session=stats');
      const data = await res.json();
      setStats({ totalAnswers: data.total_answers || 0, totalChunks: data.total_voice_chunks || 0 });
    } catch {}
  };

  const topicCategories = [
    {
      label: 'Identity & Life',
      topics: ['Life Story', 'Childhood & Family', 'Dutch Roots', 'Tenerife Life', 'Relationships', 'Darkest Moments', 'Greatest Wins'],
    },
    {
      label: 'Faith & Spirit',
      topics: ['Faith Journey', 'Prayer & Practice', 'Worship & Music', 'Theology & Beliefs', 'Spiritual Warfare', 'Faith in Business'],
    },
    {
      label: 'Music & Art',
      topics: ['Music Industry', 'Songwriting', 'Electronic Production', 'Live Performance', 'Music Tech & Gear', 'Record Labels', 'Streaming & Distribution', 'DJing & Sets'],
    },
    {
      label: 'Business & Money',
      topics: ['Entrepreneurship', 'Crowdfunding', 'Startup Failure', 'Money Mindset', 'Investing', 'Sales & Negotiation', 'Leadership', 'Business Ethics'],
    },
    {
      label: 'Marketing & Growth',
      topics: ['Marketing Strategy', 'Email Marketing', 'Content Creation', 'Brand Building', 'Community Building', 'Growth Hacking', 'Conversion Optimization'],
    },
    {
      label: 'Creator Economy',
      topics: ['Creator Economy', 'Platform Algorithms', 'TikTok Strategy', 'YouTube Strategy', 'Instagram Strategy', 'Spotify for Artists', 'Monetization Models'],
    },
    {
      label: 'Mindset & Growth',
      topics: ['Personal Development', 'Resilience', 'Habits & Discipline', 'Overcoming Fear', 'Identity & Self-Worth', 'Success Redefined', 'Purpose & Meaning'],
    },
    {
      label: 'Tech & Future',
      topics: ['AI & Technology', 'Web3 & Crypto', 'Future of Work', 'Automation', 'Digital Nomad Life', 'Tech Ethics'],
    },
    {
      label: 'Philosophy',
      topics: ['Freedom', 'Risk & Courage', 'Legacy & Impact', 'Truth & Deception', 'Justice & Fairness', 'Beauty & Excellence'],
    },
  ];

  // ── Generate Questions ──────────────────────────────────────────

  const generateQuestions = async () => {
    const activeTopic = topic === 'custom' ? customTopic : topic;
    if (!activeTopic) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/interview-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_questions',
          topic: activeTopic,
          count: questionCount,
        }),
      });
      const data = await res.json();

      if (data.questions) {
        const qs: Question[] = data.questions.map((q: string, i: number) => ({
          id: `q-${Date.now()}-${i}`,
          text: q,
          answer: '',
          captured: false,
        }));
        setQuestions(qs);
        setCurrentQ(0);
        const name = `session-${activeTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
        setSessionName(name);
        setPhase('interviewing');

        // Start the session on the server
        await fetch('/api/admin/interview-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start_session',
            session_name: name,
            phase: activeTopic,
          }),
        });
      }
    } catch (e: any) {
      alert('Failed to generate questions: ' + e.message);
    }
    setGenerating(false);
  };

  // ── Capture Answer ──────────────────────────────────────────────

  const captureAnswer = async () => {
    const q = questions[currentQ];
    const answer = voice.transcript || q.answer;
    if (!answer || answer.length < 10) return;

    setSaving(true);
    try {
      await fetch('/api/admin/interview-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'capture_answer',
          session_name: sessionName,
          topic: topic === 'custom' ? customTopic : topic,
          question: q.text,
          answer: answer,
        }),
      });

      // Mark as captured
      const updated = [...questions];
      updated[currentQ] = { ...q, answer, captured: true };
      setQuestions(updated);

      // Move to next
      voice.setTranscript('');
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setTimeout(() => answerRef.current?.focus(), 100);
      } else {
        setPhase('done');
        fetchStats();
      }
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    }
    setSaving(false);
  };

  const goToQuestion = (idx: number) => {
    voice.stopListening();
    voice.setTranscript('');
    setCurrentQ(idx);
  };

  // ── Render ──────────────────────────────────────────────────────

  const completed = questions.filter(q => q.captured).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Interview Studio</h1>
            <p className="text-sm text-gray-500 mt-1">
              Voice library: {stats.totalChunks} chunks · {stats.totalAnswers || sessions.length} sessions
            </p>
          </div>
          {phase === 'interviewing' && (
            <div className="text-sm text-gray-400 bg-gray-900 px-4 py-2 rounded-lg">
              {completed}/{questions.length} captured
            </div>
          )}
        </div>

        {/* ── SETUP PHASE ──────────────────────────────────────── */}
        {phase === 'setup' && (
          <div className="bg-gray-900 rounded-2xl p-8 space-y-6">
            <h2 className="text-lg font-semibold">New Interview Session</h2>
            <p className="text-sm text-gray-400">
              Pick a topic and I'll generate deep interview questions. Answer by speaking (🎤) or typing.
            </p>

            {/* Topic selector — categorized */}
            <div>
              <label className="text-sm text-gray-400 block mb-3">Topic</label>
              <div className="space-y-5">
                {topicCategories.map(cat => (
                  <div key={cat.label}>
                    <h3 className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">{cat.label}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.topics.map(t => (
                        <button
                          key={t}
                          onClick={() => { setTopic(t); setCustomTopic(''); }}
                          className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                            topic === t
                              ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <button
                    onClick={() => setTopic('custom')}
                    className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                      topic === 'custom'
                        ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                        : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300 italic'
                    }`}
                  >
                    ✏️ Custom topic...
                  </button>
                </div>
              </div>
              {topic === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter your topic..."
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  className="mt-2 w-full bg-gray-800 rounded-lg p-3 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              )}
            </div>

            {/* Question count */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Questions</label>
              <div className="flex gap-2">
                {[3, 5, 8, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      questionCount === n
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateQuestions}
              disabled={!topic || generating}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating questions...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Start Interview</>
              )}
            </button>

            {/* Recent sessions */}
            {sessions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Sessions</h3>
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                      <div>
                        <span className="text-sm font-medium">{s.phase}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(s.started).toLocaleDateString()}
                        </span>
                      </div>
                      <Clock className="w-4 h-4 text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INTERVIEWING PHASE ────────────────────────────────── */}
        {phase === 'interviewing' && (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="flex gap-1">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    q.captured ? 'bg-green-500' : i === currentQ ? 'bg-blue-500' : 'bg-gray-800'
                  }`}
                  title={q.text.slice(0, 60)}
                />
              ))}
            </div>

            {/* Question card */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span>Question {currentQ + 1} of {questions.length}</span>
                <span>·</span>
                <span>{topic === 'custom' ? customTopic : topic}</span>
              </div>

              <h2 className="text-xl font-semibold mb-6 leading-relaxed">
                {questions[currentQ]?.text}
              </h2>

              {/* Answer input with voice */}
              <div className="space-y-3">
                <textarea
                  ref={answerRef}
                  value={voice.listening ? voice.transcript : questions[currentQ]?.answer || ''}
                  onChange={e => {
                    if (voice.listening) return;
                    const updated = [...questions];
                    updated[currentQ] = { ...updated[currentQ], answer: e.target.value };
                    setQuestions(updated);
                  }}
                  onFocus={() => voice.stopListening()}
                  placeholder={voice.listening ? 'Listening...' : 'Type your answer or click the mic...'}
                  className={`w-full bg-gray-800 rounded-xl p-4 text-white text-sm min-h-[160px] resize-y border transition-all focus:outline-none ${
                    voice.listening ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700 focus:border-blue-500'
                  }`}
                  rows={6}
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => voice.listening ? voice.stopListening() : voice.startListening()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      voice.listening
                        ? 'bg-red-600 hover:bg-red-500 animate-pulse'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {voice.listening ? (
                      <><MicOff className="w-4 h-4" /> Stop Recording</>
                    ) : (
                      <><Mic className="w-4 h-4" /> Speak Answer</>
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => goToQuestion(Math.max(0, currentQ - 1))}
                      disabled={currentQ === 0}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-white disabled:opacity-30"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={captureAnswer}
                      disabled={saving || (!voice.transcript && !questions[currentQ]?.answer)}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-all"
                    >
                      {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : questions[currentQ]?.captured ? (
                        <><Check className="w-4 h-4" /> Captured ✓</>
                      ) : (
                        <><Send className="w-4 h-4" /> Capture & Next</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Question navigator */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={`p-2 rounded-lg text-xs text-left transition-all ${
                    i === currentQ
                      ? 'bg-blue-600 text-white'
                      : q.captured
                      ? 'bg-green-900/50 text-green-400 border border-green-800'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                  }`}
                >
                  <span className="block font-mono text-[10px] opacity-50">{i + 1}</span>
                  <span className="line-clamp-2">{q.text.slice(0, 50)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE PHASE ────────────────────────────────────────── */}
        {phase === 'done' && (
          <div className="bg-gray-900 rounded-2xl p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Session Complete</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              All {questions.length} answers captured. Your voice library now has {stats.totalChunks} chunks.
              These will be used to write more authentic blog posts.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setPhase('setup');
                  setQuestions([]);
                  setCurrentQ(0);
                  fetchStats();
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Session
              </button>
              <button
                onClick={() => {
                  setPhase('interviewing');
                  setCurrentQ(0);
                }}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all"
              >
                Review Answers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
