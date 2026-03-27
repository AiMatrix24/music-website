'use client';

import Link from 'next/link';
import { useState } from 'react';

const SECTIONS = [
  { id: 'auth', label: 'Authentication' },
  { id: 'tracks', label: 'Tracks API' },
  { id: 'events', label: 'Events API' },
  { id: 'tickets', label: 'Tickets API' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'sdks', label: 'SDKs' },
];

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-brand-950 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto font-mono border border-brand-800/20 whitespace-pre-wrap">
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-brand-800/40 text-xs text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function EndpointBadge({ method }: { method: string }) {
  const color = method === 'GET' ? 'bg-green-600/20 text-green-400' : method === 'POST' ? 'bg-blue-600/20 text-blue-400' : 'bg-yellow-600/20 text-yellow-400';
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{method}</span>;
}

export default function DevelopersPage() {
  const [activeSection, setActiveSection] = useState('auth');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl bg-[#15151f] p-8 md:p-12 mb-10 border border-brand-800/10">
          <h1 className="text-4xl font-black mb-3">Build on OPYNX</h1>
          <p className="text-gray-400 mb-6 max-w-xl">
            Integrate music streaming, event ticketing, and fan engagement into your app with the OPYNX API.
          </p>
          <button className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition">
            Request API Key
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <nav className="sticky top-28 space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    activeSection === s.id ? 'bg-red-600/10 text-red-400 font-semibold' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-12">
            {/* Authentication */}
            <section id="auth">
              <h2 className="text-2xl font-black mb-4">Authentication</h2>
              <p className="text-gray-400 mb-4">
                All API requests require a Bearer token. Include your API key in the Authorization header.
              </p>
              <CodeBlock>{`curl -X GET https://api.opynx.dev/v1/tracks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</CodeBlock>
              <div className="mt-4 rounded-xl bg-[#15151f] p-4 border border-brand-800/10">
                <p className="text-sm text-gray-400">
                  <span className="text-yellow-400 font-semibold">Note:</span> Keep your API key secret. Never expose it in client-side code. Use environment variables or a server-side proxy.
                </p>
              </div>
            </section>

            {/* Tracks API */}
            <section id="tracks">
              <h2 className="text-2xl font-black mb-4">Tracks API</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <EndpointBadge method="GET" />
                    <code className="text-sm text-gray-300 font-mono">/v1/tracks</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">List all tracks. Supports pagination and filtering by genre, artist, or BPM.</p>
                  <p className="text-xs text-gray-500 mb-2">Parameters: <code className="text-gray-400">page</code>, <code className="text-gray-400">limit</code>, <code className="text-gray-400">genre</code>, <code className="text-gray-400">artist_id</code>, <code className="text-gray-400">bpm_min</code>, <code className="text-gray-400">bpm_max</code></p>
                  <CodeBlock>{`curl https://api.opynx.dev/v1/tracks?genre=synthwave&limit=10 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Response:</p>
                    <CodeBlock>{`{
  "data": [
    {
      "id": "trk_abc123",
      "title": "Midnight Drive",
      "artist": { "id": "art_xyz", "name": "NeonWave" },
      "genre": "synthwave",
      "bpm": 120,
      "duration": 225,
      "stream_url": "https://cdn.opynx.dev/stream/trk_abc123",
      "created_at": "2025-12-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 142 }
}`}</CodeBlock>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <EndpointBadge method="POST" />
                    <code className="text-sm text-gray-300 font-mono">/v1/tracks</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">Upload a new track. Requires Creator role. Send as multipart/form-data.</p>
                  <p className="text-xs text-gray-500 mb-2">Parameters: <code className="text-gray-400">title</code> (required), <code className="text-gray-400">genre</code>, <code className="text-gray-400">bpm</code>, <code className="text-gray-400">file</code> (audio, required)</p>
                  <CodeBlock>{`curl -X POST https://api.opynx.dev/v1/tracks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "title=Solar Flare" \\
  -F "genre=electronic" \\
  -F "bpm=128" \\
  -F "file=@track.mp3"`}</CodeBlock>
                </div>
              </div>
            </section>

            {/* Events API */}
            <section id="events">
              <h2 className="text-2xl font-black mb-4">Events API</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <EndpointBadge method="GET" />
                    <code className="text-sm text-gray-300 font-mono">/v1/events</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">List upcoming events. Filter by location, date range, or artist.</p>
                  <p className="text-xs text-gray-500 mb-2">Parameters: <code className="text-gray-400">page</code>, <code className="text-gray-400">limit</code>, <code className="text-gray-400">city</code>, <code className="text-gray-400">date_from</code>, <code className="text-gray-400">date_to</code>, <code className="text-gray-400">artist_id</code></p>
                  <CodeBlock>{`curl https://api.opynx.dev/v1/events?city=los-angeles&limit=5 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <EndpointBadge method="POST" />
                    <code className="text-sm text-gray-300 font-mono">/v1/events</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">Create a new event. Requires Creator or Facilitator role.</p>
                  <p className="text-xs text-gray-500 mb-2">Parameters: <code className="text-gray-400">title</code> (required), <code className="text-gray-400">venue</code>, <code className="text-gray-400">date</code> (required), <code className="text-gray-400">capacity</code>, <code className="text-gray-400">tiers</code> (array of ticket tiers)</p>
                  <CodeBlock>{`curl -X POST https://api.opynx.dev/v1/events \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Neon Nights Vol. 3",
    "venue": "The Echo, Los Angeles",
    "date": "2026-05-15T20:00:00Z",
    "capacity": 500,
    "tiers": [
      { "name": "General", "price": 25.00, "quantity": 400 },
      { "name": "VIP", "price": 75.00, "quantity": 100 }
    ]
  }'`}</CodeBlock>
                </div>
              </div>
            </section>

            {/* Tickets API */}
            <section id="tickets">
              <h2 className="text-2xl font-black mb-4">Tickets API</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <EndpointBadge method="GET" />
                    <code className="text-sm text-gray-300 font-mono">/v1/tickets</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">List tickets for the authenticated user, or for a specific event.</p>
                  <p className="text-xs text-gray-500 mb-2">Parameters: <code className="text-gray-400">event_id</code>, <code className="text-gray-400">status</code> (active, used, transferred)</p>
                  <CodeBlock>{`curl https://api.opynx.dev/v1/tickets?event_id=evt_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <EndpointBadge method="POST" />
                    <code className="text-sm text-gray-300 font-mono">/v1/tickets/purchase</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">Purchase a ticket for an event. Returns the ticket with QR code data.</p>
                  <CodeBlock>{`curl -X POST https://api.opynx.dev/v1/tickets/purchase \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "event_id": "evt_abc123", "tier": "General", "quantity": 2 }'`}</CodeBlock>
                </div>
              </div>
            </section>

            {/* Webhooks */}
            <section id="webhooks">
              <h2 className="text-2xl font-black mb-4">Webhooks</h2>
              <p className="text-gray-400 mb-4">
                Register webhook endpoints to receive real-time notifications for events like new streams, ticket purchases, and payouts.
              </p>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <EndpointBadge method="POST" />
                    <code className="text-sm text-gray-300 font-mono">/v1/webhooks</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">Register a new webhook endpoint.</p>
                  <CodeBlock>{`curl -X POST https://api.opynx.dev/v1/webhooks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/webhooks/opynx",
    "events": ["track.streamed", "ticket.purchased", "payout.completed"]
  }'`}</CodeBlock>
                </div>
                <div className="rounded-xl bg-[#15151f] p-4 border border-brand-800/10">
                  <p className="text-sm text-gray-400 mb-2"><span className="text-white font-semibold">Available events:</span></p>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono text-gray-500">
                    <span>track.streamed</span>
                    <span>track.uploaded</span>
                    <span>ticket.purchased</span>
                    <span>ticket.transferred</span>
                    <span>event.created</span>
                    <span>event.sold_out</span>
                    <span>payout.completed</span>
                    <span>subscriber.new</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Rate Limits */}
            <section id="rate-limits">
              <h2 className="text-2xl font-black mb-4">Rate Limits</h2>
              <div className="rounded-xl bg-[#15151f] p-6 border border-brand-800/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pb-3 font-semibold">Plan</th>
                      <th className="pb-3 font-semibold">Requests / Minute</th>
                      <th className="pb-3 font-semibold">Daily Limit</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-t border-brand-800/10">
                      <td className="py-3">Free</td>
                      <td className="py-3">60</td>
                      <td className="py-3">10,000</td>
                    </tr>
                    <tr className="border-t border-brand-800/10">
                      <td className="py-3">Pro</td>
                      <td className="py-3">1,000</td>
                      <td className="py-3">500,000</td>
                    </tr>
                    <tr className="border-t border-brand-800/10">
                      <td className="py-3">Enterprise</td>
                      <td className="py-3">10,000</td>
                      <td className="py-3">Unlimited</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Rate limit headers are included in every response: <code className="text-gray-400">X-RateLimit-Limit</code>, <code className="text-gray-400">X-RateLimit-Remaining</code>, <code className="text-gray-400">X-RateLimit-Reset</code>.
              </p>
            </section>

            {/* SDKs */}
            <section id="sdks">
              <h2 className="text-2xl font-black mb-4">SDKs</h2>
              <p className="text-gray-400 mb-4">Official client libraries to speed up your integration.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { lang: 'Node.js', status: 'Available', pkg: 'npm install @opynx/sdk', available: true },
                  { lang: 'Python', status: 'Coming Soon', pkg: 'pip install opynx', available: false },
                  { lang: 'Go', status: 'Coming Soon', pkg: 'go get github.com/opynx/sdk-go', available: false },
                ].map((sdk) => (
                  <div key={sdk.lang} className="rounded-xl bg-[#15151f] p-5 border border-brand-800/10">
                    <h3 className="font-bold text-white mb-1">{sdk.lang}</h3>
                    <span className={`text-xs font-semibold ${sdk.available ? 'text-green-400' : 'text-gray-500'}`}>
                      {sdk.status}
                    </span>
                    <code className="block mt-3 text-xs text-gray-500 font-mono">{sdk.pkg}</code>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
