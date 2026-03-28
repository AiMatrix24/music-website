'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type Category = 'Production' | 'Business' | 'Marketing' | 'Performance' | 'Songwriting';

interface Course {
  id: number;
  title: string;
  instructor: string;
  lessons: number;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  gradient: string;
  category: Category;
}

const GRADIENTS = [
  'from-red-600 to-orange-600',
  'from-purple-600 to-pink-600',
  'from-blue-600 to-cyan-600',
  'from-green-600 to-teal-600',
  'from-yellow-600 to-red-600',
  'from-indigo-600 to-purple-600',
  'from-pink-600 to-rose-600',
  'from-teal-600 to-blue-600',
];

const ALL_COURSES: Course[] = [
  // Production
  { id: 1, title: 'Beat Making Fundamentals', instructor: 'Cipher', lessons: 14, duration: '4h 30m', difficulty: 'Beginner', rating: 4.8, gradient: GRADIENTS[0], category: 'Production' },
  { id: 2, title: 'Advanced Mixing Techniques', instructor: 'SynthLord', lessons: 18, duration: '6h 15m', difficulty: 'Advanced', rating: 4.9, gradient: GRADIENTS[1], category: 'Production' },
  { id: 3, title: 'Sound Design Masterclass', instructor: 'BeatDropper', lessons: 12, duration: '3h 45m', difficulty: 'Intermediate', rating: 4.7, gradient: GRADIENTS[2], category: 'Production' },
  { id: 4, title: 'Lo-Fi Production Workshop', instructor: 'ChillProducer', lessons: 10, duration: '3h', difficulty: 'Beginner', rating: 4.6, gradient: GRADIENTS[3], category: 'Production' },
  { id: 5, title: 'Mastering for Streaming', instructor: 'VoxQueen', lessons: 8, duration: '2h 30m', difficulty: 'Advanced', rating: 4.8, gradient: GRADIENTS[4], category: 'Production' },
  { id: 6, title: 'Sampling & Chopping', instructor: 'LoopMaster', lessons: 11, duration: '3h 20m', difficulty: 'Intermediate', rating: 4.5, gradient: GRADIENTS[5], category: 'Production' },
  { id: 7, title: 'Vocal Production 101', instructor: 'NeonWave', lessons: 9, duration: '2h 45m', difficulty: 'Beginner', rating: 4.7, gradient: GRADIENTS[6], category: 'Production' },
  { id: 8, title: 'Electronic Production Deep Dive', instructor: 'Cipher', lessons: 20, duration: '7h', difficulty: 'Advanced', rating: 4.9, gradient: GRADIENTS[7], category: 'Production' },
  // Business
  { id: 9, title: 'Music Rights & Royalties', instructor: 'IndieStar', lessons: 10, duration: '3h', difficulty: 'Beginner', rating: 4.6, gradient: GRADIENTS[0], category: 'Business' },
  { id: 10, title: 'Building Your Label', instructor: 'VenueKing', lessons: 15, duration: '5h', difficulty: 'Advanced', rating: 4.8, gradient: GRADIENTS[1], category: 'Business' },
  { id: 11, title: 'Sync Licensing Basics', instructor: 'ChillProducer', lessons: 8, duration: '2h 20m', difficulty: 'Intermediate', rating: 4.5, gradient: GRADIENTS[2], category: 'Business' },
  { id: 12, title: 'Negotiating Contracts', instructor: 'Cipher', lessons: 6, duration: '2h', difficulty: 'Intermediate', rating: 4.7, gradient: GRADIENTS[3], category: 'Business' },
  { id: 13, title: 'Revenue Streams for Artists', instructor: 'NeonWave', lessons: 12, duration: '4h', difficulty: 'Beginner', rating: 4.4, gradient: GRADIENTS[4], category: 'Business' },
  { id: 14, title: 'Music Publishing 101', instructor: 'IndieStar', lessons: 9, duration: '3h', difficulty: 'Beginner', rating: 4.6, gradient: GRADIENTS[5], category: 'Business' },
  { id: 15, title: 'Touring Economics', instructor: 'VenueKing', lessons: 7, duration: '2h 15m', difficulty: 'Advanced', rating: 4.3, gradient: GRADIENTS[6], category: 'Business' },
  { id: 16, title: 'Crowdfunding Your Album', instructor: 'BeatDropper', lessons: 5, duration: '1h 30m', difficulty: 'Beginner', rating: 4.5, gradient: GRADIENTS[7], category: 'Business' },
  // Marketing
  { id: 17, title: 'Social Media Strategy', instructor: 'NeonWave', lessons: 11, duration: '3h 30m', difficulty: 'Beginner', rating: 4.7, gradient: GRADIENTS[0], category: 'Marketing' },
  { id: 18, title: 'Building a Fanbase', instructor: 'IndieStar', lessons: 14, duration: '4h 45m', difficulty: 'Intermediate', rating: 4.8, gradient: GRADIENTS[1], category: 'Marketing' },
  { id: 19, title: 'Playlist Pitching', instructor: 'ChillProducer', lessons: 6, duration: '2h', difficulty: 'Beginner', rating: 4.4, gradient: GRADIENTS[2], category: 'Marketing' },
  { id: 20, title: 'Email Marketing for Musicians', instructor: 'VoxQueen', lessons: 8, duration: '2h 30m', difficulty: 'Intermediate', rating: 4.5, gradient: GRADIENTS[3], category: 'Marketing' },
  { id: 21, title: 'Content Creation Playbook', instructor: 'LoopMaster', lessons: 13, duration: '4h', difficulty: 'Beginner', rating: 4.6, gradient: GRADIENTS[4], category: 'Marketing' },
  { id: 22, title: 'PR & Press Kit Mastery', instructor: 'Cipher', lessons: 7, duration: '2h 15m', difficulty: 'Advanced', rating: 4.7, gradient: GRADIENTS[5], category: 'Marketing' },
  { id: 23, title: 'TikTok Music Marketing', instructor: 'NeonWave', lessons: 9, duration: '2h 45m', difficulty: 'Beginner', rating: 4.8, gradient: GRADIENTS[6], category: 'Marketing' },
  { id: 24, title: 'Brand Partnerships', instructor: 'IndieStar', lessons: 10, duration: '3h 15m', difficulty: 'Advanced', rating: 4.6, gradient: GRADIENTS[7], category: 'Marketing' },
  // Performance
  { id: 25, title: 'Stage Presence Workshop', instructor: 'VoxQueen', lessons: 8, duration: '2h 30m', difficulty: 'Beginner', rating: 4.9, gradient: GRADIENTS[0], category: 'Performance' },
  { id: 26, title: 'Live Sound Engineering', instructor: 'SynthLord', lessons: 16, duration: '5h 30m', difficulty: 'Advanced', rating: 4.7, gradient: GRADIENTS[1], category: 'Performance' },
  { id: 27, title: 'DJ Set Building', instructor: 'BeatDropper', lessons: 12, duration: '4h', difficulty: 'Intermediate', rating: 4.6, gradient: GRADIENTS[2], category: 'Performance' },
  { id: 28, title: 'Vocal Warm-Ups & Technique', instructor: 'VoxQueen', lessons: 10, duration: '3h', difficulty: 'Beginner', rating: 4.8, gradient: GRADIENTS[3], category: 'Performance' },
  { id: 29, title: 'Live Looping Masterclass', instructor: 'LoopMaster', lessons: 14, duration: '4h 30m', difficulty: 'Advanced', rating: 4.9, gradient: GRADIENTS[4], category: 'Performance' },
  { id: 30, title: 'Ableton Live Performance', instructor: 'Cipher', lessons: 11, duration: '3h 45m', difficulty: 'Intermediate', rating: 4.7, gradient: GRADIENTS[5], category: 'Performance' },
  { id: 31, title: 'Crowd Engagement Techniques', instructor: 'VenueKing', lessons: 6, duration: '1h 45m', difficulty: 'Beginner', rating: 4.5, gradient: GRADIENTS[6], category: 'Performance' },
  { id: 32, title: 'Touring Logistics', instructor: 'IndieStar', lessons: 9, duration: '3h', difficulty: 'Intermediate', rating: 4.4, gradient: GRADIENTS[7], category: 'Performance' },
  // Songwriting
  { id: 33, title: 'Lyric Writing Essentials', instructor: 'NeonWave', lessons: 10, duration: '3h', difficulty: 'Beginner', rating: 4.8, gradient: GRADIENTS[0], category: 'Songwriting' },
  { id: 34, title: 'Melody & Harmony Theory', instructor: 'Cipher', lessons: 15, duration: '5h', difficulty: 'Intermediate', rating: 4.9, gradient: GRADIENTS[1], category: 'Songwriting' },
  { id: 35, title: 'Toplining for Pop Music', instructor: 'VoxQueen', lessons: 8, duration: '2h 30m', difficulty: 'Intermediate', rating: 4.7, gradient: GRADIENTS[2], category: 'Songwriting' },
  { id: 36, title: 'Co-Writing Sessions', instructor: 'ChillProducer', lessons: 7, duration: '2h', difficulty: 'Beginner', rating: 4.5, gradient: GRADIENTS[3], category: 'Songwriting' },
  { id: 37, title: 'Song Structure Deep Dive', instructor: 'SynthLord', lessons: 12, duration: '4h', difficulty: 'Advanced', rating: 4.6, gradient: GRADIENTS[4], category: 'Songwriting' },
  { id: 38, title: 'Writing for Film & TV', instructor: 'IndieStar', lessons: 9, duration: '3h', difficulty: 'Advanced', rating: 4.8, gradient: GRADIENTS[5], category: 'Songwriting' },
  { id: 39, title: 'Rap & Hip-Hop Lyricism', instructor: 'BeatDropper', lessons: 11, duration: '3h 30m', difficulty: 'Beginner', rating: 4.7, gradient: GRADIENTS[6], category: 'Songwriting' },
  { id: 40, title: 'Creative Block Solutions', instructor: 'LoopMaster', lessons: 5, duration: '1h 30m', difficulty: 'Beginner', rating: 4.4, gradient: GRADIENTS[7], category: 'Songwriting' },
];

const CATEGORIES: Category[] = ['Production', 'Business', 'Marketing', 'Performance', 'Songwriting'];

const FREE_RESOURCES = [
  { title: 'DAW Templates Pack', desc: 'Ableton, FL Studio & Logic templates', icon: '🎛️' },
  { title: 'Chord Progressions PDF', desc: '50 essential chord progressions by genre', icon: '🎵' },
  { title: 'Mix Checklist', desc: 'Step-by-step mixing reference guide', icon: '✅' },
  { title: 'Release Day Checklist', desc: 'Everything you need before dropping your track', icon: '🚀' },
];

const WORKSHOPS = [
  { date: 'Apr 5, 2026', time: '2:00 PM EST', instructor: 'Cipher', topic: 'Building a Track from Scratch — Live', spots: 45 },
  { date: 'Apr 12, 2026', time: '3:00 PM EST', instructor: 'VoxQueen', topic: 'Vocal Processing Techniques — Q&A Session', spots: 30 },
  { date: 'Apr 19, 2026', time: '1:00 PM EST', instructor: 'NeonWave', topic: 'Growing on TikTok as a Musician', spots: 60 },
];

const ENROLLED = [
  { title: 'Beat Making Fundamentals', instructor: 'Cipher', progress: 72 },
  { title: 'Social Media Strategy', instructor: 'NeonWave', progress: 45 },
  { title: 'Lyric Writing Essentials', instructor: 'NeonWave', progress: 18 },
];

const DIFFICULTY_COLORS = {
  Beginner: 'bg-green-600/20 text-green-400',
  Intermediate: 'bg-yellow-600/20 text-yellow-400',
  Advanced: 'bg-red-600/20 text-red-400',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.floor(rating) ? 'text-yellow-400' : star - 0.5 <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-gray-400 ml-1">{rating}</span>
    </div>
  );
}

export default function EducationPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('Production');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const filtered = ALL_COURSES.filter((c) => c.category === activeCategory);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-brand-950 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-brand-800/30 rounded-xl w-2/3" />
            <div className="h-8 bg-brand-800/30 rounded-xl w-1/2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-brand-800/30 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Level Up Your <span className="text-red-500">Craft</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Learn from the best OPYNX artists. Courses, masterclasses, and resources to take your music career to the next level.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeCategory === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white border border-brand-800/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {filtered.map((course) => (
            <div key={course.id} className="bg-[#15151f] border border-brand-800/30 rounded-2xl overflow-hidden hover:border-red-500/30 transition group">
              <div className={`h-36 bg-gradient-to-br ${course.gradient} flex items-center justify-center`}>
                <svg className="w-12 h-12 text-white/40 group-hover:text-white/60 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[course.difficulty]}`}>
                    {course.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{course.instructor}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{course.lessons} lessons</span>
                  <span>{course.duration}</span>
                </div>
                <StarRating rating={course.rating} />
              </div>
            </div>
          ))}
        </div>

        {/* Featured Masterclass */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Featured Masterclass</h2>
          <div className="bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-500/20 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center p-12">
                <div className="text-center">
                  <svg className="w-20 h-20 text-white/60 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p className="text-white/80 text-lg font-bold">MASTERCLASS</p>
                </div>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <span className="text-xs px-3 py-1 rounded-full bg-red-600/20 text-red-400 font-semibold w-fit mb-4">PREMIUM</span>
                <h3 className="text-2xl font-black mb-2">Electronic Production with Cipher</h3>
                <p className="text-gray-400 mb-4">A comprehensive deep-dive into electronic music production, from sound design to final master. Includes exclusive project files and presets.</p>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                  <span>12 lessons</span>
                  <span>7h total</span>
                  <span className="text-red-400">Advanced</span>
                </div>
                <button className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition w-fit">
                  Start Masterclass
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Free Resources */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Free Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FREE_RESOURCES.map((res, i) => (
              <div key={i} className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-5 hover:border-red-500/30 transition">
                <div className="text-3xl mb-3">{res.icon}</div>
                <h3 className="font-bold text-sm mb-1">{res.title}</h3>
                <p className="text-xs text-gray-400 mb-4">{res.desc}</p>
                <button className="text-xs text-red-400 hover:text-red-300 font-semibold transition">
                  Download Free
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Workshops */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Upcoming Live Workshops</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {WORKSHOPS.map((ws, i) => (
              <div key={i} className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-6 hover:border-red-500/30 transition">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 font-semibold">LIVE</span>
                  <span className="text-xs text-gray-500">{ws.spots} spots left</span>
                </div>
                <h3 className="font-bold mb-2">{ws.topic}</h3>
                <p className="text-sm text-gray-400 mb-1">with {ws.instructor}</p>
                <p className="text-sm text-gray-500 mb-4">{ws.date} at {ws.time}</p>
                <button className="w-full py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition">
                  Register
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Your Courses (Progress Tracking) */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Courses</h2>
          <div className="space-y-4">
            {ENROLLED.map((course, i) => (
              <div key={i} className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{course.title}</h3>
                  <p className="text-xs text-gray-400">{course.instructor}</p>
                </div>
                <div className="sm:w-48">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-red-400 font-semibold">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-brand-800/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                <button className="px-4 py-2 text-sm bg-brand-800/30 hover:bg-brand-800/50 rounded-xl transition font-medium">
                  Continue
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
