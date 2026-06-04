'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send, Plus, Clock, Check, Sparkles, Loader2, X } from 'lucide-react';

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
}

// ── Voice Recognition Hook ────────────────────────────────────────

function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  // Track audio activity (any sound detected)
  const [hasSound, setHasSound] = useState(false);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input requires Chrome or Edge. Use macOS dictation (Fn twice) as fallback.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      let hasInterim = false;
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
        if (!event.results[i].isFinal) hasInterim = true;
      }
      setHasSound(true);
      setTranscript(hasInterim ? fullTranscript + ' (...)' : fullTranscript);
    };

    recognition.onaudiostart = () => setHasSound(true);
    recognition.onaudioend = () => setTimeout(() => setHasSound(false), 500);

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setTranscript('');
    setListening(true);
  }, []);

  const stopListening = useCallback((): string => {
    recognitionRef.current?.stop();
    setListening(false);
    setHasSound(false);
    return transcript.replace(/\(\.\.\.\)$/, '').trim();
  }, [transcript]);

  return { listening, hasSound, transcript, setTranscript, startListening, stopListening };
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
  const [justSaved, setJustSaved] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({ totalAnswers: 0, totalChunks: 0 });
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const voice = useVoiceInput();
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/admin/interview-capture')
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); }).catch(e => console.error('Async error in admin/interview/page.tsx:', e));
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const r = await fetch('/api/admin/interview-capture?session=stats');
      const d = await r.json();
      setStats({ totalAnswers: d.total_answers || 0, totalChunks: d.total_voice_chunks || 0 });
    } catch (e: any) { console.error('Unhandled error in admin/interview/page.tsx:', e); }
  };

  const topicCategories = [
    { label: 'Identity & Life', topics: ['Life Story','Childhood & Family','Dutch Roots','Tenerife Life','Relationships','Darkest Moments','Greatest Wins'] },
    { label: 'Faith & Spirit', topics: ['Faith Journey','Prayer & Practice','Worship & Music','Theology & Beliefs','Spiritual Warfare','Faith in Business'] },
    { label: 'Music & Art', topics: ['Music Industry','Songwriting','Electronic Production','Live Performance','Music Tech & Gear','Record Labels','Streaming & Distribution','DJing & Sets'] },
    { label: 'Business & Money', topics: ['Entrepreneurship','Crowdfunding','Startup Failure','Money Mindset','Investing','Sales & Negotiation','Leadership','Business Ethics'] },
    { label: 'Marketing & Growth', topics: ['Marketing Strategy','Email Marketing','Content Creation','Brand Building','Community Building','Growth Hacking','Conversion Optimization'] },
    { label: 'Creator Economy', topics: ['Creator Economy','Platform Algorithms','TikTok Strategy','YouTube Strategy','Instagram Strategy','Spotify for Artists','Monetization Models'] },
    { label: 'Mindset & Growth', topics: ['Personal Development','Resilience','Habits & Discipline','Overcoming Fear','Identity & Self-Worth','Success Redefined','Purpose & Meaning'] },
    { label: 'Tech & Future', topics: ['AI & Technology','Web3 & Crypto','Future of Work','Automation','Digital Nomad Life','Tech Ethics'] },
    { label: 'Philosophy', topics: ['Freedom','Risk & Courage','Legacy & Impact','Truth & Deception','Justice & Fairness','Beauty & Excellence'] },
  ];

  const allTopics = topicCategories.flatMap(c => c.topics);
  const coveredTopics = sessions.map(s => s.phase);
  const uncoveredByCategory = topicCategories.map(cat => {
    const covered = cat.topics.filter(t => coveredTopics.includes(t));
    return { ...cat, covered, uncovered: cat.topics.filter(t => !coveredTopics.includes(t)), pct: Math.round((covered.length / cat.topics.length) * 100) };
  });
  const totalCovered = allTopics.filter(t => coveredTopics.includes(t)).length;
  const totalPct = Math.round((totalCovered / allTopics.length) * 100);

  const blogBatchTopics = [
    'Music Industry','Creator Economy','Marketing Strategy','TikTok Strategy','Money Mindset',
    'Platform Algorithms','Spotify for Artists','Content Creation','Monetization Models',
    'Brand Building','Entrepreneurship','Community Building','Streaming & Distribution',
    'Songwriting','Email Marketing','Personal Development','Success Redefined','AI & Technology',
  ];
  const suggested = blogBatchTopics.filter(t => !coveredTopics.includes(t)).slice(0, 5);

  // ── Generate ────────────────────────────────────────────────────

  const generateQuestions = async () => {
    const activeTopic = topic === 'custom' ? customTopic : topic;
    if (!activeTopic) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/interview-capture', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_questions', topic: activeTopic, count: questionCount }),
      });
      const data = await res.json();
      if (data.questions) {
        const qs: Question[] = data.questions.map((q: string, i: number) => ({
          id: `q-${Date.now()}-${i}`, text: q, answer: '', captured: false,
        }));
        setQuestions(qs); setCurrentQ(0);
        const name = `session-${activeTopic.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${Date.now().toString(36)}`;
        setSessionName(name); setPhase('interviewing');
        await fetch('/api/admin/interview-capture', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start_session', session_name: name, phase: activeTopic }),
        });
      }
    } catch (e: any) { alert('Failed: ' + e.message); }
    setGenerating(false);
  };

  // ── Mic Actions ─────────────────────────────────────────────────

  const doMicAction = () => {
    if (voice.listening) {
      // STOP: capture transcript, append to existing answer
      const cleanedTranscript = voice.stopListening();
      if (cleanedTranscript) {
        const updated = [...questions];
        const existing = updated[currentQ]?.answer || '';
        updated[currentQ] = { ...updated[currentQ], answer: existing ? existing + ' ' + cleanedTranscript : cleanedTranscript };
        setQuestions(updated);
      }
    } else {
      // START
      voice.startListening();
    }
  };

  const clearAnswer = () => {
    if (voice.listening) voice.stopListening();
    voice.setTranscript('');
    const updated = [...questions];
    updated[currentQ] = { ...updated[currentQ], answer: '' };
    setQuestions(updated);
  };

  const captureAnswer = async () => {
    const q = questions[currentQ];
    // Stop mic if still running and capture all text
    let answer = q.answer || '';
    if (voice.listening) {
      const cleaned = voice.stopListening();
      answer = answer ? answer + ' ' + cleaned : cleaned;
      // Update the question state
      const updated = [...questions];
      updated[currentQ] = { ...updated[currentQ], answer };
      setQuestions(updated);
    }
    if (!answer || answer.length < 10) return;

    setSaving(true);
    try {
      await fetch('/api/admin/interview-capture', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'capture_answer', session_name: sessionName, topic: topic === 'custom' ? customTopic : topic, question: q.text, answer }),
      });
      const updated = [...questions];
      updated[currentQ] = { ...q, answer, captured: true };
      setQuestions(updated);
      
      // Flash feedback
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 1500);
      
      voice.setTranscript('');
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        const q = questions[currentQ + 1];
        // Restore any existing answer for the next question
        voice.setTranscript(q?.answer || '');
      } else { setPhase('done'); fetchStats(); }
    } catch (e: any) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const goToQuestion = (idx: number) => {
    if (voice.listening) voice.stopListening();
    voice.setTranscript(questions[idx]?.answer || '');
    setCurrentQ(idx);
  };

  const completed = questions.filter(q => q.captured).length;
  const currentAnswer = (questions[currentQ]?.answer || '') +
    (voice.listening ? (voice.transcript ? ' ' + voice.transcript : '') : '');

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Interview Studio</h1>
            <p className="text-sm text-gray-500 mt-1">
              Voice library: {stats.totalChunks} chunks · {stats.totalAnswers || sessions.length} sessions
            </p>
          </div>
          {phase === 'interviewing' && (
            <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all duration-300 ${
              showSavedFeedback 
                ? 'bg-green-900/30 text-green-400 scale-105' 
                : 'bg-gray-900 text-gray-400'
            }`}>
              {showSavedFeedback ? <Check size={14} /> : null}
              {completed}/{questions.length} saved to database
            </div>
          )}
        </div>

        {phase === 'setup' && (
          <div className="space-y-6">
            {/* Coverage overview */}
            {sessions.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Voice Library Coverage</h2>
                  <span className="text-xs text-gray-500">{totalCovered}/{allTopics.length} topics · {totalPct}%</span>
                </div>
                <div className="space-y-2">
                  {uncoveredByCategory.map(cat => (
                    <div key={cat.label} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 w-28 shrink-0 truncate">{cat.label}</span>
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${cat.pct===100?'bg-green-500':cat.pct>0?'bg-blue-500':'bg-gray-700'}`} style={{width:`${Math.max(cat.pct,3)}%`}}/>
                      </div>
                      <span className="text-[10px] text-gray-600 w-8 text-right">{cat.pct}%</span>
                    </div>
                  ))}
                </div>
                {suggested.length > 0 && (
                  <div className="pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-yellow-500"/>Recommended next — helpful for your blog batch</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggested.map(t => (
                        <button key={t} onClick={()=>{setTopic(t);setCustomTopic('');window.scrollTo({top:500,behavior:'smooth'});}} className="px-2.5 py-1 rounded-md text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800/50 hover:bg-yellow-900/50 transition-all">{t}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Topic + question setup */}
            <div className="bg-gray-900 rounded-2xl p-8 space-y-6">
              <h2 className="text-lg font-semibold">New Interview Session</h2>
              <p className="text-sm text-gray-400">Pick a topic and I'll generate deep interview questions. Answer by speaking (🎤) or typing.</p>

              <div>
                <label className="text-sm text-gray-400 block mb-3">Topic</label>
                <div className="space-y-5">
                  {topicCategories.map(cat => (
                    <div key={cat.label}>
                      <h3 className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">{cat.label}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.topics.map(t => (
                          <button key={t} onClick={()=>{setTopic(t);setCustomTopic('');}} className={`px-3 py-1.5 rounded-md text-xs transition-all ${topic===t?'bg-blue-600 text-white ring-1 ring-blue-400':'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>setTopic('custom')} className={`px-3 py-1.5 rounded-md text-xs transition-all ${topic==='custom'?'bg-blue-600 text-white ring-1 ring-blue-400':'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300 italic'}`}>✏️ Custom topic...</button>
                </div>
                {topic === 'custom' && (
                  <input type="text" placeholder="Enter your topic..." value={customTopic} onChange={e=>setCustomTopic(e.target.value)} className="mt-2 w-full bg-gray-800 rounded-lg p-3 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none" autoFocus/>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Questions</label>
                <div className="flex gap-2">
                  {[3,5,8,10,15].map(n=>(
                    <button key={n} onClick={()=>setQuestionCount(n)} className={`px-4 py-2 rounded-lg text-sm ${questionCount===n?'bg-blue-600 text-white':'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{n}</button>
                  ))}
                </div>
              </div>

              <button onClick={generateQuestions} disabled={!topic||generating} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2">
                {generating?<><Loader2 className="w-5 h-5 animate-spin"/>Generating questions...</>:<><Sparkles className="w-5 h-5"/>Start Interview</>}
              </button>

              {sessions.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Sessions</h3>
                  <div className="space-y-2">
                    {sessions.slice(0,5).map((s,i)=>(
                      <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                        <div><span className="text-sm font-medium">{s.phase}</span><span className="text-xs text-gray-500 ml-2">{new Date(s.started).toLocaleDateString()}</span></div>
                        <Clock className="w-4 h-4 text-gray-600"/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'interviewing' && (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="flex gap-1">
              {questions.map((q,i)=>(
                <button key={q.id} onClick={()=>goToQuestion(i)} className={`h-2 flex-1 rounded-full transition-all ${q.captured?'bg-green-500':i===currentQ?'bg-blue-500':'bg-gray-800'}`} title={q.text.slice(0,60)}/>
              ))}
            </div>

            {/* Question */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span>Question {currentQ+1} of {questions.length}</span><span>·</span><span>{topic==='custom'?customTopic:topic}</span>
              </div>
              <h2 className="text-xl font-semibold mb-6 leading-relaxed">{questions[currentQ]?.text}</h2>

              {/* Answer textarea */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    ref={answerRef}
                    value={currentAnswer}
                    onChange={e=>{
                      const u=[...questions]; u[currentQ]={...u[currentQ], answer: e.target.value}; setQuestions(u);
                    }}
                    placeholder={voice.listening?'🎤 Listening — speak now...':'Type your answer or click the mic...'}
                    className={`w-full bg-gray-800 rounded-xl p-4 text-white text-sm min-h-[160px] resize-y border transition-all focus:outline-none ${
                      voice.listening && voice.hasSound
                        ? 'border-green-500 ring-2 ring-green-500/20' 
                        : voice.listening
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-gray-700 focus:border-blue-500'
                    }`}
                    rows={6}
                  />
                  
                  {/* Mic activity indicator */}
                  {voice.listening && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {voice.hasSound ? (
                        <div className="flex items-center gap-0.5">
                          {[0,1,2,3].map(i => (
                            <div key={i} 
                              className="w-0.5 bg-green-400 rounded-full animate-pulse" 
                              style={{
                                height: `${8 + Math.random() * 12}px`,
                                animationDelay: `${i * 0.15}s`,
                              }} 
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={doMicAction} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      voice.listening
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}>
                      {voice.listening ? <><MicOff size={14}/> Stop & Edit</> : <><Mic size={14}/> Speak Answer</>}
                    </button>
                    {(questions[currentQ]?.answer || voice.transcript) ? (
                      <button onClick={clearAnswer} className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all">
                        <X size={12} /> Clear
                      </button>
                    ) : null}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button onClick={()=>goToQuestion(Math.max(0,currentQ-1))} disabled={currentQ===0} className="px-3 py-2 text-sm text-gray-500 hover:text-white disabled:opacity-30">← Prev</button>
                    <button onClick={captureAnswer} disabled={saving || !currentAnswer.trim()} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-all">
                      {saving?<><Loader2 size={14} className="animate-spin"/> Saving...</>:<><Send size={14}/> Capture & Next</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Question navigator */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q,i)=>(
                <button key={q.id} onClick={()=>goToQuestion(i)} className={`p-2 rounded-lg text-xs text-left transition-all ${
                  i===currentQ?'bg-blue-600 text-white':q.captured?'bg-green-900/50 text-green-400 border border-green-800':'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}>
                  <span className="block font-mono text-[10px] opacity-50">{i+1}</span><span className="line-clamp-2">{q.text.slice(0,50)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="bg-gray-900 rounded-2xl p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-white"/></div>
            <h2 className="text-2xl font-bold">Session Complete</h2>
            <p className="text-gray-400 max-w-md mx-auto">All {questions.length} answers captured. Voice library: {stats.totalChunks} chunks.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={()=>{setPhase('setup');setQuestions([]);setCurrentQ(0);fetchStats();}} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all flex items-center gap-2"><Plus className="w-4 h-4"/>New Session</button>
              <button onClick={()=>{setPhase('interviewing');setCurrentQ(0);}} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all">Review Answers</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
