'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

interface Question {
  question: string;
  options: string[];
  correct: number; // index of correct answer
}

const QUIZ_CATEGORIES = [
  { id: 'top-artist', name: 'Your Top Artist', icon: '&#11088;', description: 'How well do you know your most-played artist?' },
  { id: 'genre-master', name: 'Genre Master', icon: '&#127925;', description: 'Can you identify the genre from the clue?' },
  { id: 'lyrics', name: 'Lyrics Challenge', icon: '&#127908;', description: 'Complete the missing lyrics' },
  { id: 'release-dates', name: 'Release Dates', icon: '&#128197;', description: 'Guess when the album dropped' },
  { id: 'opynx-trivia', name: 'OPYNX Trivia', icon: '&#128293;', description: 'Test your platform knowledge' },
];

const QUIZ_QUESTIONS: Record<string, Question[]> = {
  'top-artist': [
    { question: 'Which album put ZVRA on the map?', options: ['Neon Highway', 'Crystal Waves', 'Phantom Signal', 'Static Dreams'], correct: 0 },
    { question: 'What genre is ZVRA primarily known for?', options: ['Lo-Fi', 'Synthwave', 'Jazz', 'Classical'], correct: 1 },
    { question: 'How many albums has ZVRA released?', options: ['2', '3', '5', '7'], correct: 2 },
    { question: 'Which city is ZVRA from?', options: ['Tokyo', 'Berlin', 'Los Angeles', 'London'], correct: 2 },
    { question: 'What year did ZVRA debut on OPYNX?', options: ['2022', '2023', '2024', '2025'], correct: 1 },
  ],
  'genre-master': [
    { question: 'Which genre features heavy use of analog synthesizers and 80s nostalgia?', options: ['Dubstep', 'Synthwave', 'Trap', 'Bluegrass'], correct: 1 },
    { question: 'What genre is characterized by relaxed beats and vinyl crackle?', options: ['Heavy Metal', 'Lo-Fi Hip Hop', 'Drum & Bass', 'Opera'], correct: 1 },
    { question: 'Which genre originated in Detroit in the 1980s?', options: ['Techno', 'Country', 'Reggae', 'Blues'], correct: 0 },
    { question: 'What genre combines elements of punk and electronic music?', options: ['Folk', 'Electroclash', 'Gospel', 'Swing'], correct: 1 },
    { question: 'Which genre is known for complex time signatures and progressive structures?', options: ['Pop', 'Math Rock', 'Ska', 'Motown'], correct: 1 },
  ],
  lyrics: [
    { question: '"Under the neon skyline, we ___"', options: ['fade away', 'run away', 'fly away', 'drift away'], correct: 0 },
    { question: '"Lost in the frequency, nothing to ___"', options: ['play', 'say', 'pay', 'stay'], correct: 1 },
    { question: '"The city hums a ___ tune"', options: ['lovely', 'broken', 'golden', 'silent'], correct: 1 },
    { question: '"Dancing shadows under a ___ moon"', options: ['silver', 'crimson', 'fractured', 'hollow'], correct: 2 },
    { question: '"In the silence, we let ___"', options: ['go', 'flow', 'grow', 'know'], correct: 0 },
  ],
  'release-dates': [
    { question: 'When did "Neon Highway" by ZVRA release?', options: ['Jan 2023', 'Mar 2024', 'Jun 2023', 'Nov 2024'], correct: 1 },
    { question: 'When did OPYNX launch its streaming platform?', options: ['2021', '2022', '2023', '2024'], correct: 2 },
    { question: '"Crystal Waves" was released in which month?', options: ['February', 'July', 'October', 'December'], correct: 1 },
    { question: 'The Drift\'s debut album came out in:', options: ['Spring 2022', 'Fall 2023', 'Winter 2024', 'Summer 2023'], correct: 1 },
    { question: 'When was the first OPYNX Live event?', options: ['2023', '2024', '2025', '2022'], correct: 1 },
  ],
  'opynx-trivia': [
    { question: 'What color is the OPYNX primary accent?', options: ['Blue', 'Green', 'Red', 'Purple'], correct: 2 },
    { question: 'Which feature lets fans earn points for engagement?', options: ['Fan Credits', 'Rewards', 'Loyalty+', 'StarPoints'], correct: 1 },
    { question: 'What is the name of OPYNX\'s live streaming feature?', options: ['GoLive', 'OPYNX Live', 'StreamNow', 'BroadCast'], correct: 1 },
    { question: 'How many genres does OPYNX currently support?', options: ['10+', '25+', '50+', '100+'], correct: 2 },
    { question: 'Which OPYNX feature lets you listen with friends in real-time?', options: ['GroupPlay', 'Listening Rooms', 'SyncStream', 'PartyMode'], correct: 1 },
  ],
};

const LEADERBOARD = [
  { rank: 1, name: 'QuizWhiz', score: 48, initial: 'Q' },
  { rank: 2, name: 'BrainBox', score: 46, initial: 'B' },
  { rank: 3, name: 'MusicNerd', score: 44, initial: 'M' },
  { rank: 4, name: 'NeonWave', score: 42, initial: 'N' },
  { rank: 5, name: 'SynthLover', score: 40, initial: 'S' },
  { rank: 6, name: 'AudioPhile', score: 38, initial: 'A' },
  { rank: 7, name: 'VinylHead', score: 36, initial: 'V' },
  { rank: 8, name: 'BeatDropper', score: 34, initial: 'B' },
  { rank: 9, name: 'ChillVibes', score: 32, initial: 'C' },
  { rank: 10, name: 'GigGoer', score: 30, initial: 'G' },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function QuizPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timer, setTimer] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleNextQuestion = useCallback(() => {
    const questions = activeCategory ? QUIZ_QUESTIONS[activeCategory] : [];
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnsweredCorrectly(null);
      setTimer(15);
      setTimerActive(true);
    } else {
      setQuizComplete(true);
      setTimerActive(false);
      toast('+50 XP earned!', 'success');
    }
  }, [activeCategory, currentQuestion, toast]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timer <= 0) {
      if (timer <= 0 && timerActive && selectedAnswer === null) {
        setShowResult(true);
        setTimerActive(false);
        setAnsweredCorrectly(false);
        setTimeout(() => handleNextQuestion(), 2000);
      }
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timer, selectedAnswer, handleNextQuestion]);

  const startQuiz = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizComplete(false);
    setTimer(15);
    setTimerActive(true);
    setAnsweredCorrectly(null);
  };

  const handleAnswer = (index: number) => {
    if (showResult || selectedAnswer !== null) return;
    const questions = activeCategory ? QUIZ_QUESTIONS[activeCategory] : [];
    const isCorrect = index === questions[currentQuestion].correct;
    setSelectedAnswer(index);
    setShowResult(true);
    setTimerActive(false);
    setAnsweredCorrectly(isCorrect);
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => handleNextQuestion(), 2000);
  };

  const getBadge = () => {
    const questions = activeCategory ? QUIZ_QUESTIONS[activeCategory] : [];
    const total = questions.length;
    const pct = score / total;
    if (pct >= 0.8) return { name: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-400/20 border-yellow-400/40' };
    if (pct >= 0.6) return { name: 'Silver', color: 'text-gray-300', bg: 'bg-gray-300/20 border-gray-300/40' };
    return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/20 border-orange-400/40' };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-2xl bg-[#15151f] h-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl bg-[#15151f] h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Sign in to take quizzes and compete on the leaderboard.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Results Screen ---- */
  if (quizComplete && activeCategory) {
    const questions = QUIZ_QUESTIONS[activeCategory];
    const badge = getBadge();
    const categoryName = QUIZ_CATEGORIES.find((c) => c.id === activeCategory)?.name;

    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <button onClick={() => setActiveCategory(null)} className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
            &larr; Back to Quizzes
          </button>

          <div className="rounded-2xl bg-[#15151f] border border-white/5 p-8">
            <h1 className="text-3xl font-black mb-2">Quiz Complete!</h1>
            <p className="text-gray-400 mb-6">{categoryName}</p>

            <div className="text-6xl font-black mb-2">
              {score}/{questions.length}
            </div>
            <p className="text-gray-400 mb-6">correct answers</p>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${badge.bg} mb-6`}>
              <span className={`text-lg font-bold ${badge.color}`}>{badge.name} Badge Earned!</span>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400">
                +50 XP earned! &middot;{' '}
                <Link href="/rewards" className="text-red-400 hover:text-red-300 transition">
                  View Rewards
                </Link>
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startQuiz(activeCategory)}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
              >
                Play Again
              </button>
              <button
                onClick={() => toast('Score shared!', 'success')}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition"
              >
                Share Score
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Active Quiz ---- */
  if (activeCategory) {
    const questions = QUIZ_QUESTIONS[activeCategory];
    const q = questions[currentQuestion];
    const categoryName = QUIZ_CATEGORIES.find((c) => c.id === activeCategory)?.name;

    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setActiveCategory(null)} className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
            &larr; Back to Quizzes
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">{categoryName}</h2>
              <p className="text-sm text-gray-400">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                {score}/{questions.length} <span className="text-sm text-gray-400 font-normal">correct</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
            />
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center mb-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-2 transition-colors ${
              timer <= 5 ? 'border-red-500 text-red-400' : 'border-white/20 text-white'
            }`}>
              {timer}
            </div>
          </div>

          {/* Question */}
          <div className="rounded-2xl bg-[#15151f] border border-white/5 p-8 mb-6">
            <h3 className="text-xl font-bold text-center">{q.question}</h3>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {q.options.map((option, i) => {
              const letter = ['A', 'B', 'C', 'D'][i];
              let cardClass = 'rounded-xl p-4 border transition cursor-pointer ';

              if (showResult) {
                if (i === q.correct) {
                  cardClass += 'bg-green-600/20 border-green-500 text-green-300';
                } else if (i === selectedAnswer && i !== q.correct) {
                  cardClass += 'bg-red-600/20 border-red-500 text-red-300';
                } else {
                  cardClass += 'bg-[#15151f] border-white/5 text-gray-500';
                }
              } else {
                cardClass += 'bg-[#15151f] border-white/5 hover:border-red-600/50 hover:bg-red-600/5';
              }

              return (
                <button key={i} onClick={() => handleAnswer(i)} className={cardClass} disabled={showResult}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                      {letter}
                    </span>
                    <span className="font-medium text-left">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && answeredCorrectly !== null && (
            <div className={`mt-4 text-center text-sm font-semibold ${answeredCorrectly ? 'text-green-400' : 'text-red-400'}`}>
              {answeredCorrectly ? 'Correct!' : `Wrong! The answer was: ${q.options[q.correct]}`}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---- Category Selection ---- */
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-600/30 p-8 mb-8">
          <h1 className="text-3xl font-black mb-2">&#129504; Music Quiz</h1>
          <p className="text-gray-400">How well do you know your music?</p>
        </div>

        {/* Categories */}
        <h2 className="text-xl font-bold mb-4">Choose a Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {QUIZ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => startQuiz(cat.id)}
              className="rounded-2xl bg-[#15151f] border border-white/5 p-6 text-left hover:border-red-600/30 transition group"
            >
              <div className="text-2xl mb-2" dangerouslySetInnerHTML={{ __html: cat.icon }} />
              <h3 className="font-bold text-lg mb-1 group-hover:text-red-400 transition">{cat.name}</h3>
              <p className="text-sm text-gray-400">{cat.description}</p>
              <p className="text-xs text-gray-600 mt-3">5 questions &middot; 15s each</p>
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
        <div className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden">
          {LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 px-5 py-3 border-b border-white/5 last:border-b-0 ${
                entry.rank <= 3 ? 'bg-red-600/5' : ''
              }`}
            >
              <span className={`w-8 text-center font-bold ${
                entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-gray-300' : entry.rank === 3 ? 'text-orange-400' : 'text-gray-500'
              }`}>
                {entry.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-xs font-bold text-red-400">
                {entry.initial}
              </div>
              <span className="font-medium flex-1">{entry.name}</span>
              <span className="text-sm text-gray-400">{entry.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
