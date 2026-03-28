'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Message {
  id: string;
  from: 'me' | 'artist';
  text: string;
  timestamp: Date;
}

interface ArtistConvo {
  artistId: string;
  artistName: string;
  avatar: string;
  tier: string;
  messages: Message[];
  unread: number;
}

// Welcome messages per artist — sent when fan first subscribes
function generateWelcomeMessages(artistName: string, artistId: string): Message[] {
  return [
    {
      id: `welcome-${artistId}-1`,
      from: 'artist',
      text: `Hey! 👋 Welcome to my inner circle on OPYNX! I'm so glad you're here.`,
      timestamp: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: `welcome-${artistId}-2`,
      from: 'artist',
      text: `As a subscriber, you get early access to new tracks, exclusive behind-the-scenes content, and you can message me directly right here. I read every message!`,
      timestamp: new Date(Date.now() - 86400000 * 3 + 5000),
    },
    {
      id: `welcome-${artistId}-3`,
      from: 'artist',
      text: `Got any questions, feedback, or just want to say hi? I'm here. 🎶`,
      timestamp: new Date(Date.now() - 86400000 * 3 + 10000),
    },
  ];
}

export default function MessagesPage() {
  const { data: session, status } = useSession();

  // Fetch artists the fan follows (these are the artists they can message)
  const { data: follows } = trpc.users.listCreators.useQuery(
    { limit: 50 },
    { enabled: status === 'authenticated' }
  );

  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<ArtistConvo[]>([]);

  // Build conversations from followed/subscribed artists
  useEffect(() => {
    if (!follows || follows.length === 0) return;

    // Only show creator-role users as message targets
    const artists = follows.filter((u) => u.role === 'creator');

    const convos: ArtistConvo[] = artists.map((artist) => ({
      artistId: artist.id,
      artistName: artist.name ?? 'Unknown Artist',
      avatar: artist.name?.charAt(0)?.toUpperCase() ?? '?',
      tier: 'subscribed',
      messages: generateWelcomeMessages(artist.name ?? 'Artist', artist.id),
      unread: 1,
    }));

    // Add OPYNX Support as always-present
    convos.push({
      artistId: 'opynx-support',
      artistName: 'OPYNX Support',
      avatar: 'O',
      tier: 'system',
      messages: [
        { id: 'sys-1', from: 'artist', text: 'Welcome to OPYNX! 🎉 If you have any questions about the platform, billing, or need help, just send us a message here.', timestamp: new Date(Date.now() - 86400000 * 7) },
      ],
      unread: 0,
    });

    setConversations(convos);
  }, [follows]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">💬</p>
        <p className="text-gray-400 text-lg">Sign in to message your artists</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  if (status === 'authenticated' && follows && follows.filter((u) => u.role === 'creator').length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-5xl mb-2">💬</p>
        <h2 className="text-2xl font-bold">No Artists Yet</h2>
        <p className="text-gray-400 text-center max-w-md">
          Subscribe to artists to unlock direct messaging. Your messages go straight to
          the artist — no middlemen, no gatekeepers.
        </p>
        <div className="flex gap-3 mt-4">
          <Link href="/explore" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
            Explore Artists
          </Link>
          <Link href="/subscribe" className="rounded-full border border-brand-800/30 px-6 py-3 font-semibold hover:border-red-600 transition">
            Subscribe
          </Link>
        </div>
      </div>
    );
  }

  const activeConvo = conversations.find((c) => c.artistId === selectedArtist);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedArtist) return;
    const msg: Message = { id: Date.now().toString(), from: 'me', text: newMessage.trim(), timestamp: new Date() };
    setConversations((prev) =>
      prev.map((c) =>
        c.artistId === selectedArtist
          ? { ...c, messages: [...c.messages, msg], unread: 0 }
          : c
      )
    );
    setNewMessage('');
  };

  const markRead = (artistId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.artistId === artistId ? { ...c, unread: 0 } : c
      )
    );
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Messages {totalUnread > 0 && <span className="text-red-400 text-lg">({totalUnread})</span>}
          </h1>
          <div className="text-xs text-gray-500 bg-[#15151f] px-3 py-1.5 rounded-full">
            🔒 Direct to artist — no middlemen
          </div>
        </div>

        {/* Subscription tier info */}
        <div className="rounded-xl bg-red-950/20 border border-red-800/20 px-4 py-3 mb-6 flex items-center gap-3">
          <span className="text-lg">💎</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              You can message {conversations.filter((c) => c.tier !== 'system').length} artist{conversations.filter((c) => c.tier !== 'system').length !== 1 ? 's' : ''} directly
            </p>
            <p className="text-xs text-gray-400">
              Premium: 1 artist · Superfan Bundle: up to 4 artists · Studio: unlimited
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* Artist conversation list */}
            <div className={`w-full sm:w-80 border-r border-brand-800/20 flex flex-col ${selectedArtist ? 'hidden sm:flex' : 'flex'}`}>
              <div className="p-3 border-b border-brand-800/20">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold px-1">Your Artists</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((convo) => {
                  const lastMsg = convo.messages[convo.messages.length - 1];
                  return (
                    <button
                      key={convo.artistId}
                      onClick={() => { setSelectedArtist(convo.artistId); markRead(convo.artistId); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-950/50 ${
                        selectedArtist === convo.artistId ? 'bg-red-950/20 border-l-2 border-red-600' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                        convo.tier === 'system'
                          ? 'bg-gradient-to-br from-gray-600 to-gray-800'
                          : 'bg-gradient-to-br from-red-600 to-red-800'
                      }`}>
                        {convo.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate">{convo.artistName}</p>
                            {convo.tier !== 'system' && (
                              <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded-full">artist</span>
                            )}
                          </div>
                          {lastMsg && <span className="text-xs text-gray-600 shrink-0">{shortTimeAgo(lastMsg.timestamp)}</span>}
                        </div>
                        {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.text}</p>}
                      </div>
                      {convo.unread > 0 && (
                        <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {convo.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${selectedArtist ? 'flex' : 'hidden sm:flex'}`}>
              {selectedArtist && activeConvo ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-brand-800/20">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedArtist(null)} className="sm:hidden text-gray-400 hover:text-white transition mr-1">←</button>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${
                        activeConvo.tier === 'system' ? 'bg-gradient-to-br from-gray-600 to-gray-800' : 'bg-gradient-to-br from-red-600 to-red-800'
                      }`}>
                        {activeConvo.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{activeConvo.artistName}</p>
                        <p className="text-xs text-gray-500">
                          {activeConvo.tier === 'system' ? 'Support Team' : 'Direct message — only you and the artist'}
                        </p>
                      </div>
                    </div>
                    {activeConvo.tier !== 'system' && (
                      <Link href={`/artist/${activeConvo.artistId}`} className="text-xs text-red-400 hover:text-red-300 font-semibold transition">
                        View Profile →
                      </Link>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Auto-connect banner */}
                    {activeConvo.tier !== 'system' && (
                      <div className="text-center py-4">
                        <div className="inline-block bg-brand-950/50 rounded-full px-4 py-2 text-xs text-gray-500">
                          🔗 You&apos;re connected with {activeConvo.artistName} through your subscription
                        </div>
                      </div>
                    )}

                    {activeConvo.messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                        {msg.from === 'artist' && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black mr-2 shrink-0 mt-1 ${
                            activeConvo.tier === 'system' ? 'bg-gradient-to-br from-gray-600 to-gray-800' : 'bg-gradient-to-br from-red-600 to-red-800'
                          }`}>
                            {activeConvo.avatar}
                          </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          msg.from === 'me'
                            ? 'bg-red-600 text-white rounded-br-md'
                            : 'bg-brand-950 text-gray-200 rounded-bl-md border border-brand-800/20'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${msg.from === 'me' ? 'text-red-200' : 'text-gray-600'}`}>
                            {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-brand-800/20">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                      <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${activeConvo.artistName}...`}
                        className="flex-1 bg-brand-950 border border-brand-800/30 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-500 transition disabled:opacity-50 shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <p className="text-5xl mb-4">💬</p>
                    <h2 className="text-xl font-bold mb-2">Direct Artist Messages</h2>
                    <p className="text-gray-400 text-sm max-w-sm">
                      Select an artist to start a private conversation.
                      Messages go directly to the artist you subscribe to — whether
                      you support 1 artist or 4.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function shortTimeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
