'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// --- Mock Data ---
const COLLABORATIONS = [
  { id: '1', track: 'Midnight Drive (Remix)', partner: 'DJ Nova', partnerAvatar: 'N', split: 50, status: 'active' as const, earnings: 96.40, startDate: '2025-12-01' },
  { id: '2', track: 'Neon Skyline ft. Jade', partner: 'Jade Williams', partnerAvatar: 'J', split: 60, status: 'active' as const, earnings: 85.44, startDate: '2026-01-15' },
  { id: '3', track: 'After Hours (Acoustic)', partner: 'Marcus Trent', partnerAvatar: 'M', split: 50, status: 'completed' as const, earnings: 37.40, startDate: '2025-08-10' },
  { id: '4', track: 'Crystal Waves EP', partner: 'Priya Sound', partnerAvatar: 'P', split: 70, status: 'pending' as const, earnings: 0, startDate: '2026-03-20' },
];

const COLLAB_REQUESTS = [
  { id: 'r1', from: 'Deon Rivers', avatar: 'D', track: 'Low Frequency', proposedSplit: 40, message: 'Would love to add some vocals to this track!' },
  { id: 'r2', from: 'Kim Lee', avatar: 'K', track: 'Ghost Signal', proposedSplit: 30, message: 'I have some synth ideas that would fit perfectly.' },
];

export default function CollaborationsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteTrack, setInviteTrack] = useState('');
  const [inviteSplit, setInviteSplit] = useState(50);
  const [requests, setRequests] = useState(COLLAB_REQUESTS);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading collaborations...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to manage collaborations</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const filteredCollabs = activeTab === 'all'
    ? COLLABORATIONS
    : COLLABORATIONS.filter((c) => c.status === activeTab);

  const handleInvite = () => {
    if (!inviteSearch || !inviteTrack) {
      toast('Please fill in all fields', 'error');
      return;
    }
    toast(`Collaboration invite sent to ${inviteSearch}!`);
    setShowInviteForm(false);
    setInviteSearch('');
    setInviteTrack('');
    setInviteSplit(50);
  };

  const handleAccept = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast('Collaboration accepted!');
  };

  const handleDecline = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast('Collaboration declined.', 'info');
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Collaborations</h1>
            <p className="text-gray-400 mt-1">Work with other creators and split revenue</p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            {showInviteForm ? 'Cancel' : '+ Invite Collaborator'}
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="rounded-2xl bg-[#15151f] border border-red-600/30 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Invite Collaborator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Creator Name or Email</label>
                <input
                  type="text"
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Track</label>
                <select
                  value={inviteTrack}
                  onChange={(e) => setInviteTrack(e.target.value)}
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
                >
                  <option value="">Select a track...</option>
                  <option value="midnight-drive">Midnight Drive</option>
                  <option value="neon-skyline">Neon Skyline</option>
                  <option value="low-frequency">Low Frequency</option>
                  <option value="crystal-waves">Crystal Waves</option>
                  <option value="ghost-signal">Ghost Signal</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Your Revenue Split: {inviteSplit}%</label>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={inviteSplit}
                  onChange={(e) => setInviteSplit(Number(e.target.value))}
                  className="w-full mt-2 accent-red-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>You: {inviteSplit}%</span>
                  <span>Collaborator: {100 - inviteSplit}%</span>
                </div>
              </div>
            </div>

            {/* Revenue Split Visual */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Revenue Split Preview</p>
              <div className="h-6 rounded-full overflow-hidden flex">
                <div
                  className="bg-red-600 flex items-center justify-center text-xs font-semibold text-white transition-all duration-300"
                  style={{ width: `${inviteSplit}%` }}
                >
                  {inviteSplit >= 20 && `You ${inviteSplit}%`}
                </div>
                <div
                  className="bg-red-400 flex items-center justify-center text-xs font-semibold text-white transition-all duration-300"
                  style={{ width: `${100 - inviteSplit}%` }}
                >
                  {(100 - inviteSplit) >= 20 && `Collab ${100 - inviteSplit}%`}
                </div>
              </div>
            </div>

            <button
              onClick={handleInvite}
              className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
            >
              Send Invitation
            </button>
          </div>
        )}

        {/* Collaboration Requests */}
        {requests.length > 0 && (
          <div className="rounded-2xl bg-[#15151f] border border-yellow-600/30 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">
              Incoming Requests
              <span className="ml-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full">{requests.length}</span>
            </h2>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold">
                      {req.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white">{req.from}</p>
                      <p className="text-sm text-gray-400">
                        Wants to collaborate on <span className="text-red-400">{req.track}</span> &middot; {req.proposedSplit}% split
                      </p>
                      <p className="text-xs text-gray-500 mt-1">&quot;{req.message}&quot;</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="rounded-full bg-green-600/20 text-green-400 px-4 py-1.5 text-xs font-semibold hover:bg-green-600/30 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      className="rounded-full bg-red-600/20 text-red-400 px-4 py-1.5 text-xs font-semibold hover:bg-red-600/30 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition capitalize ${
                activeTab === tab ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Collaborations List */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Collaborations</h2>
          {filteredCollabs.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No collaborations found for this filter.</p>
          ) : (
            <div className="space-y-4">
              {filteredCollabs.map((collab) => (
                <div key={collab.id} className="rounded-xl bg-brand-950/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold">
                        {collab.partnerAvatar}
                      </div>
                      <div>
                        <p className="font-medium text-white">{collab.track}</p>
                        <p className="text-sm text-gray-400">with {collab.partner}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      collab.status === 'active' ? 'bg-green-600/20 text-green-400' :
                      collab.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {collab.status.charAt(0).toUpperCase() + collab.status.slice(1)}
                    </span>
                  </div>

                  {/* Revenue Split Visual */}
                  <div className="mb-2">
                    <div className="h-4 rounded-full overflow-hidden flex">
                      <div
                        className="bg-red-600 flex items-center justify-center text-[10px] font-semibold text-white"
                        style={{ width: `${collab.split}%` }}
                      >
                        You {collab.split}%
                      </div>
                      <div
                        className="bg-red-400 flex items-center justify-center text-[10px] font-semibold text-white"
                        style={{ width: `${100 - collab.split}%` }}
                      >
                        {collab.partner.split(' ')[0]} {100 - collab.split}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Started {new Date(collab.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {collab.earnings > 0 && (
                      <span className="text-green-400 font-medium">
                        Your share: ${collab.earnings.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
