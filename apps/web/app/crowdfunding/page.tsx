'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const MOCK_PROJECTS = [
  {
    id: 1,
    title: 'Midnight Sessions — Full-Length Album',
    artist: 'Luna Vega',
    description: 'Help fund the recording of my debut full-length album, featuring 12 original tracks produced at Sunset Sound Studios.',
    goal: 15000,
    raised: 11250,
    daysRemaining: 18,
    backers: 234,
    image: null,
    tiers: [
      { amount: 10, reward: 'Digital album download + exclusive thank you video' },
      { amount: 25, reward: 'Signed vinyl + digital download + behind-the-scenes content' },
      { amount: 50, reward: 'Private livestream invite + all previous rewards' },
      { amount: 100, reward: 'Production credit on the album + all previous rewards' },
    ],
  },
  {
    id: 2,
    title: 'Neon Dreams — Music Video',
    artist: 'KVLT Collective',
    description: 'We\'re producing a cinematic music video for our single "Neon Dreams" with a full production crew and VFX team.',
    goal: 8000,
    raised: 5600,
    daysRemaining: 9,
    backers: 142,
    image: null,
    tiers: [
      { amount: 10, reward: 'Name in video credits + early access' },
      { amount: 25, reward: 'Behind-the-scenes documentary + all previous' },
      { amount: 50, reward: 'Signed poster from the shoot + all previous' },
      { amount: 100, reward: 'Appear as an extra in the video + all previous' },
    ],
  },
  {
    id: 3,
    title: 'West Coast Tour Fund',
    artist: 'The Broken Signals',
    description: 'Help us hit the road! Funding a 10-city West Coast tour with stops from San Diego to Seattle this summer.',
    goal: 25000,
    raised: 8750,
    daysRemaining: 32,
    backers: 89,
    image: null,
    tiers: [
      { amount: 10, reward: 'Digital tour diary + exclusive setlist playlist' },
      { amount: 25, reward: 'Tour merch bundle (t-shirt + stickers)' },
      { amount: 50, reward: 'VIP meet & greet at your city\'s show' },
      { amount: 100, reward: 'Private acoustic set after the show + all previous' },
    ],
  },
];

export default function CrowdfundingPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', goal: '', deadline: '', tiers: [{ amount: '', reward: '' }] });
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  const addTier = () => {
    setFormData({ ...formData, tiers: [...formData.tiers, { amount: '', reward: '' }] });
  };

  const removeTier = (idx: number) => {
    setFormData({ ...formData, tiers: formData.tiers.filter((_, i) => i !== idx) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Project submitted for review!', 'success');
    setShowForm(false);
    setFormData({ title: '', description: '', goal: '', deadline: '', tiers: [{ amount: '', reward: '' }] });
  };

  return (
    <div className="min-h-screen bg-brand-950 p-6 md:p-8 max-w-6xl mx-auto">
      <Link href="/" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Home
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Fan-Funded Projects</h1>
          <p className="text-gray-400 mt-1">Support the artists you love. Fund the music that matters.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition whitespace-nowrap">
          {showForm ? 'Cancel' : 'Start a Project'}
        </button>
      </div>

      {/* How It Works */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {[
          { step: '1', title: 'Create', desc: 'Set your funding goal, deadline, and reward tiers for backers.' },
          { step: '2', title: 'Fund', desc: 'Share your project and watch fans contribute to bring it to life.' },
          { step: '3', title: 'Deliver', desc: 'Hit your goal, receive funds, and deliver rewards to your backers.' },
        ].map((s) => (
          <div key={s.step} className="bg-[#15151f] rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center mx-auto mb-3">{s.step}</div>
            <h3 className="text-white font-semibold mb-1">{s.title}</h3>
            <p className="text-gray-400 text-sm">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#15151f] rounded-xl p-4 mb-10 border border-red-600/20">
        <p className="text-gray-300 text-sm text-center">
          <span className="text-red-500 font-semibold">All-or-nothing funding:</span> Projects must reach their full goal by the deadline. If the goal isn&apos;t met, all backers are refunded. This ensures artists only receive funds when they can deliver on their promises.
        </p>
      </div>

      {/* Create Project Form */}
      {showForm && (
        <div className="bg-[#15151f] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Create a Project</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 block mb-1">Project Title</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-brand-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600" placeholder="e.g., My Debut Album" />
            </div>
            <div>
              <label className="text-sm text-gray-300 block mb-1">Description</label>
              <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-brand-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600 resize-none" placeholder="Describe your project..." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-1">Funding Goal ($)</label>
                <input type="number" required min={100} value={formData.goal} onChange={(e) => setFormData({ ...formData, goal: e.target.value })} className="w-full bg-brand-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600" placeholder="5000" />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-1">Deadline</label>
                <input type="date" required value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-brand-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-300">Reward Tiers</label>
                <button type="button" onClick={addTier} className="text-red-500 hover:text-red-400 text-sm font-medium">+ Add Tier</button>
              </div>
              {formData.tiers.map((tier, idx) => (
                <div key={idx} className="flex gap-3 mb-2">
                  <input type="number" placeholder="$" value={tier.amount} onChange={(e) => { const t = [...formData.tiers]; t[idx] = { ...t[idx], amount: e.target.value }; setFormData({ ...formData, tiers: t }); }} className="w-24 bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600 text-sm" />
                  <input type="text" placeholder="Reward description" value={tier.reward} onChange={(e) => { const t = [...formData.tiers]; t[idx] = { ...t[idx], reward: e.target.value }; setFormData({ ...formData, tiers: t }); }} className="flex-1 bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600 text-sm" />
                  {formData.tiers.length > 1 && (
                    <button type="button" onClick={() => removeTier(idx)} className="text-gray-500 hover:text-red-500 text-sm">Remove</button>
                  )}
                </div>
              ))}
            </div>

            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl transition">Submit Project</button>
          </form>
        </div>
      )}

      {/* Featured Projects */}
      <h2 className="text-xl font-bold text-white mb-4">Featured Projects</h2>
      <div className="space-y-6">
        {MOCK_PROJECTS.map((project) => {
          const pct = Math.round((project.raised / project.goal) * 100);
          return (
            <div key={project.id} className="bg-[#15151f] rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="w-full md:w-48 h-32 bg-brand-950 rounded-lg flex items-center justify-center text-gray-600 shrink-0">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{project.title}</h3>
                  <p className="text-red-500 text-sm font-medium">{project.artist}</p>
                  <p className="text-gray-400 text-sm mt-2">{project.description}</p>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white font-semibold">${project.raised.toLocaleString()} raised</span>
                      <span className="text-gray-400">{pct}% of ${project.goal.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-brand-950 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>{project.backers} backers</span>
                      <span>{project.daysRemaining} days remaining</span>
                    </div>
                  </div>

                  <button onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)} className="text-red-500 hover:text-red-400 text-sm font-medium mt-3">
                    {expandedProject === project.id ? 'Hide Rewards' : 'View Reward Tiers'}
                  </button>

                  {expandedProject === project.id && (
                    <div className="mt-3 grid sm:grid-cols-2 gap-2">
                      {project.tiers.map((tier, idx) => (
                        <div key={idx} className="bg-brand-950 rounded-lg p-3 border border-gray-700 hover:border-red-600/50 transition">
                          <p className="text-red-500 font-bold text-lg">${tier.amount}</p>
                          <p className="text-gray-300 text-sm mt-1">{tier.reward}</p>
                          <button onClick={() => toast(`Backed at $${tier.amount} tier!`, 'success')} className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition">
                            Back This Tier
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
