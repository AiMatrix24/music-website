'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

interface Mentor {
  id: number;
  name: string;
  initial: string;
  genre: string;
  years: number;
  specialties: string[];
  rating: number;
  mentees: number;
  color: string;
}

const MENTORS: Mentor[] = [
  { id: 1, name: 'Cipher', initial: 'C', genre: 'Electronic / IDM', years: 12, specialties: ['Production', 'Sound Design', 'Touring'], rating: 4.9, mentees: 28, color: 'bg-red-600' },
  { id: 2, name: 'VoxQueen', initial: 'V', genre: 'R&B / Soul', years: 8, specialties: ['Songwriting', 'Vocal Production', 'Marketing'], rating: 4.8, mentees: 15, color: 'bg-purple-600' },
  { id: 3, name: 'BeatDropper', initial: 'B', genre: 'Hip-Hop / Trap', years: 10, specialties: ['Production', 'Marketing', 'Branding'], rating: 4.7, mentees: 22, color: 'bg-blue-600' },
  { id: 4, name: 'NeonWave', initial: 'N', genre: 'Synthwave / Pop', years: 6, specialties: ['Marketing', 'Social Media', 'Songwriting'], rating: 4.8, mentees: 19, color: 'bg-pink-600' },
  { id: 5, name: 'IndieStar', initial: 'I', genre: 'Indie Rock / Alt', years: 14, specialties: ['Touring', 'Songwriting', 'Business'], rating: 4.9, mentees: 34, color: 'bg-green-600' },
  { id: 6, name: 'LoopMaster', initial: 'L', genre: 'Lo-Fi / Ambient', years: 7, specialties: ['Production', 'Sound Design', 'Sampling'], rating: 4.6, mentees: 12, color: 'bg-orange-600' },
];

const STEPS = [
  { num: '1', title: 'Apply', desc: 'Fill out your profile, goals, and what you want to learn' },
  { num: '2', title: 'Get Matched', desc: 'Our algorithm pairs you with the perfect mentor based on your goals' },
  { num: '3', title: 'Grow Together', desc: 'Weekly sessions, feedback, and ongoing support from your mentor' },
];

const TESTIMONIALS = [
  { quote: 'My mentor helped me go from 50 monthly listeners to over 10,000 in just 3 months. The marketing strategies were game-changing.', name: 'Alex R.', result: '10K+ monthly listeners', mentorName: 'NeonWave' },
  { quote: 'Cipher taught me production techniques I never would have figured out on my own. My mixes sound professional now.', name: 'Jordan M.', result: 'First label release', mentorName: 'Cipher' },
  { quote: 'IndieStar showed me how to plan a tour on a budget. I just completed my first 12-city run and broke even.', name: 'Sam K.', result: 'Successful first tour', mentorName: 'IndieStar' },
];

const ACTIVE_MATCHES = [
  { mentor: 'Cipher', mentee: 'Alex R.', sessions: 8, nextSession: 'Apr 2, 2026 — 3:00 PM' },
  { mentor: 'VoxQueen', mentee: 'Jordan M.', sessions: 5, nextSession: 'Apr 4, 2026 — 1:00 PM' },
];

const SPECIALTY_COLORS: Record<string, string> = {
  Production: 'bg-purple-600/20 text-purple-400',
  Marketing: 'bg-blue-600/20 text-blue-400',
  Songwriting: 'bg-pink-600/20 text-pink-400',
  Touring: 'bg-green-600/20 text-green-400',
  'Sound Design': 'bg-orange-600/20 text-orange-400',
  'Vocal Production': 'bg-yellow-600/20 text-yellow-400',
  Branding: 'bg-cyan-600/20 text-cyan-400',
  'Social Media': 'bg-indigo-600/20 text-indigo-400',
  Business: 'bg-teal-600/20 text-teal-400',
  Sampling: 'bg-rose-600/20 text-rose-400',
};

export default function MentorshipPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [genre, setGenre] = useState('');
  const [experience, setExperience] = useState('Beginner');
  const [goals, setGoals] = useState('');
  const [area, setArea] = useState('Production');
  const [hours, setHours] = useState('2');

  useEffect(() => { setLoaded(true); }, []);

  if (status === 'loading' || !loaded) {
    return (
      <div className="min-h-screen bg-brand-950 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-brand-800/30 rounded-xl w-2/3" />
            <div className="h-8 bg-brand-800/30 rounded-xl w-1/3" />
            <div className="grid grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-brand-800/30 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-brand-950 pt-24 pb-16 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black mb-3">Sign In Required</h1>
          <p className="text-gray-400 mb-6">You need to be signed in to access the mentorship program.</p>
          <Link href="/auth/login" className="inline-block px-8 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Application submitted! We\'ll match you soon.', 'success');
  };

  const handleRequestMentor = (name: string) => {
    toast(`Mentorship request sent to ${name}!`, 'success');
  };

  return (
    <div className="min-h-screen bg-brand-950 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Connect with a <span className="text-red-500">Mentor</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Get matched with established creators who can help accelerate your music career. Personalized guidance from those who have been there.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {STEPS.map((step, i) => (
            <div key={i} className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Available Mentors */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Available Mentors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MENTORS.map((mentor) => (
              <div key={mentor.id} className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-6 hover:border-red-500/30 transition">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-full ${mentor.color} flex items-center justify-center text-xl font-bold`}>
                    {mentor.initial}
                  </div>
                  <div>
                    <h3 className="font-bold">{mentor.name}</h3>
                    <p className="text-sm text-gray-400">{mentor.genre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                  <span>{mentor.years} years exp</span>
                  <span className="text-gray-600">|</span>
                  <span>{mentor.mentees} mentees</span>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className={`w-4 h-4 ${s <= Math.floor(mentor.rating) ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm text-gray-400 ml-1">{mentor.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {mentor.specialties.map((s) => (
                    <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SPECIALTY_COLORS[s] || 'bg-gray-600/20 text-gray-400'}`}>
                      {s}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleRequestMentor(mentor.name)}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition"
                >
                  Request Mentorship
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6">Apply for Mentorship</h2>
          <form onSubmit={handleApply} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Genre</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Hip-Hop, Electronic, Indie..."
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-red-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Experience Level</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 text-sm"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Goals</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="What do you hope to achieve through mentorship?"
                rows={4}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-red-500/50 text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Preferred Mentorship Area</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 text-sm"
                >
                  <option value="Production">Production</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Songwriting">Songwriting</option>
                  <option value="Touring">Touring</option>
                  <option value="Business">Business</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Availability (weekly hours)</label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition"
            >
              Submit Application
            </button>
          </form>
        </div>

        {/* Current Mentorships */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Current Mentorships</h2>
          <div className="space-y-4">
            {ACTIVE_MATCHES.map((match, i) => (
              <div key={i} className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">
                    {match.mentor.charAt(0)}
                  </div>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                    {match.mentee.charAt(0)}
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{match.mentor} & {match.mentee}</p>
                    <p className="text-xs text-gray-400">{match.sessions} sessions completed</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-xs text-gray-500">Next:</span> {match.nextSession}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">What Mentees Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-6">
                <svg className="w-8 h-8 text-red-500/30 mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
                </svg>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">{t.quote}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">Mentored by {t.mentorName}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-600/20 text-green-400 font-medium">
                    {t.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Become a Mentor */}
        <div className="bg-gradient-to-br from-red-600/10 to-purple-600/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Become a Mentor</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-6">
            Share your experience and help the next generation of creators grow. Mentors earn OPYNX credits and build their reputation.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm text-gray-400">
            {['2+ years music experience', 'Active OPYNX profile', 'Consistent availability', 'Passion for teaching'].map((req) => (
              <span key={req} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {req}
              </span>
            ))}
          </div>
          <button className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition">
            Apply to Mentor
          </button>
        </div>
      </div>
    </div>
  );
}
