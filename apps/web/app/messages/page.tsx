'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

interface Conversation {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  avatar: string;
}

interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
  timestamp: Date;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'Nova Synthwave', role: 'creator', lastMessage: 'Thanks for the follow! Check out my new album dropping Friday 🎶', timestamp: new Date(Date.now() - 3600000), unread: 2, avatar: 'N' },
  { id: '2', name: 'Cipher', role: 'creator', lastMessage: 'The beat is almost done, I\'ll send you a preview tonight', timestamp: new Date(Date.now() - 86400000), unread: 0, avatar: 'C' },
  { id: '3', name: 'Luna Beats', role: 'creator', lastMessage: 'Hey! Loved your comment on Stargazer. Glad you enjoyed it!', timestamp: new Date(Date.now() - 172800000), unread: 1, avatar: 'L' },
  { id: '4', name: 'OPYNX Support', role: 'system', lastMessage: 'Your payout of $42.50 has been processed successfully.', timestamp: new Date(Date.now() - 259200000), unread: 0, avatar: 'O' },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', from: 'them', text: 'Hey! Thanks for following me on OPYNX! 🙌', timestamp: new Date(Date.now() - 7200000) },
    { id: 'm2', from: 'me', text: 'Of course! Midnight Drive is on repeat. When\'s the next album?', timestamp: new Date(Date.now() - 5400000) },
    { id: 'm3', from: 'them', text: 'Thanks for the follow! Check out my new album dropping Friday 🎶', timestamp: new Date(Date.now() - 3600000) },
    { id: 'm4', from: 'them', text: 'It\'s called "Neon Nights" — 10 tracks of pure synthwave. I think you\'ll love it!', timestamp: new Date(Date.now() - 3500000) },
  ],
  '2': [
    { id: 'm5', from: 'me', text: 'Hey Cipher, any chance we could collab on a track?', timestamp: new Date(Date.now() - 172800000) },
    { id: 'm6', from: 'them', text: 'For sure! What genre are you thinking?', timestamp: new Date(Date.now() - 160000000) },
    { id: 'm7', from: 'me', text: 'Something electronic with a synthwave twist', timestamp: new Date(Date.now() - 100000000) },
    { id: 'm8', from: 'them', text: 'The beat is almost done, I\'ll send you a preview tonight', timestamp: new Date(Date.now() - 86400000) },
  ],
  '3': [
    { id: 'm9', from: 'them', text: 'Hey! Loved your comment on Stargazer. Glad you enjoyed it!', timestamp: new Date(Date.now() - 172800000) },
  ],
  '4': [
    { id: 'm10', from: 'them', text: 'Welcome to OPYNX! Your account has been set up.', timestamp: new Date(Date.now() - 604800000) },
    { id: 'm11', from: 'them', text: 'Your payout of $42.50 has been processed successfully.', timestamp: new Date(Date.now() - 259200000) },
  ],
};

export default function MessagesPage() {
  const { status } = useSession();
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations] = useState(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">💬</p>
        <p className="text-gray-400">Sign in to view messages</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const activeConvo = conversations.find((c) => c.id === selectedConvo);
  const activeMessages = selectedConvo ? messages[selectedConvo] ?? [] : [];

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvo) return;
    const msg: Message = { id: Date.now().toString(), from: 'me', text: newMessage.trim(), timestamp: new Date() };
    setMessages((prev) => ({ ...prev, [selectedConvo]: [...(prev[selectedConvo] ?? []), msg] }));
    setNewMessage('');
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Messages {totalUnread > 0 && <span className="text-red-400 text-lg">({totalUnread})</span>}</h1>

        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className={`w-full sm:w-80 border-r border-brand-800/20 flex flex-col ${selectedConvo ? 'hidden sm:flex' : 'flex'}`}>
              <div className="p-4 border-b border-brand-800/20">
                <input type="text" placeholder="Search conversations..." className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((convo) => (
                  <button key={convo.id} onClick={() => setSelectedConvo(convo.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-950/50 ${
                      selectedConvo === convo.id ? 'bg-red-950/20 border-l-2 border-red-600' : ''
                    }`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-black shrink-0">
                      {convo.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{convo.name}</p>
                        <span className="text-xs text-gray-600 shrink-0">{shortTimeAgo(convo.timestamp)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{convo.lastMessage}</p>
                    </div>
                    {convo.unread > 0 && (
                      <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {convo.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${selectedConvo ? 'flex' : 'hidden sm:flex'}`}>
              {selectedConvo && activeConvo ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-800/20">
                    <button onClick={() => setSelectedConvo(null)} className="sm:hidden text-gray-400 hover:text-white transition mr-1">
                      ←
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-black">
                      {activeConvo.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{activeConvo.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{activeConvo.role}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
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
                      <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
                        className="flex-1 bg-brand-950 border border-brand-800/30 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
                      <button type="submit" disabled={!newMessage.trim()}
                        className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-500 transition disabled:opacity-50 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl mb-3">💬</p>
                    <p className="text-gray-500 text-sm">Select a conversation to start chatting</p>
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
