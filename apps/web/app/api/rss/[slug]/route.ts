import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───

interface PodcastShow {
  title: string;
  description: string;
  author: string;
  email: string;
  imageUrl: string;
  language: string;
  category: string;
}

interface PodcastEpisode {
  title: string;
  description: string;
  duration: string;
  pubDate: Date;
  audioUrl: string;
  guid: string;
  isPremium?: boolean;
}

// ─── Route Handler ───

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Mock podcast data — replace with DB lookup by slug
  const show: PodcastShow = {
    title: 'The OPYNX Show',
    description: 'Weekly conversations with independent artists',
    author: 'OPYNX',
    email: 'podcasts@opynx.com',
    imageUrl: 'https://opynx.com/logo.jpeg',
    language: 'en',
    category: 'Music',
  };

  const allEpisodes: PodcastEpisode[] = [
    {
      title: 'Ep 24 — How to Tour Without a Label',
      description: 'Cipher shares touring tips for independent artists on a budget.',
      duration: '42:00',
      pubDate: new Date('2026-03-20'),
      audioUrl: 'https://opynx.com/audio/ep24.mp3',
      guid: 'ep-24',
      isPremium: false,
    },
    {
      title: 'Ep 23 — Building a Superfan Community',
      description: 'Luna Beats breaks down strategies for growing a loyal fan base.',
      duration: '33:00',
      pubDate: new Date('2026-03-13'),
      audioUrl: 'https://opynx.com/audio/ep23.mp3',
      guid: 'ep-23',
      isPremium: false,
    },
    {
      title: 'Ep 22 — Exclusive: Studio Session with Vex',
      description: 'A behind-the-scenes look at Vex producing a new track.',
      duration: '51:00',
      pubDate: new Date('2026-03-06'),
      audioUrl: 'https://opynx.com/audio/ep22.mp3',
      guid: 'ep-22',
      isPremium: true, // premium — excluded from public RSS
    },
  ];

  // Only include non-premium episodes in the public feed
  const episodes = allEpisodes.filter((ep) => !ep.isPremium);

  const xml = generateRSS(show, episodes, slug);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// ─── RSS Generator ───

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRFC822(date: Date): string {
  return date.toUTCString();
}

function generateRSS(show: PodcastShow, episodes: PodcastEpisode[], slug: string): string {
  const siteUrl = 'https://opynx.com';
  const feedUrl = `${siteUrl}/api/rss/${encodeURIComponent(slug)}`;

  const items = episodes
    .map(
      (ep) => `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description)}</description>
      <pubDate>${formatRFC822(ep.pubDate)}</pubDate>
      <enclosure url="${escapeXml(ep.audioUrl)}" type="audio/mpeg" length="0" />
      <guid isPermaLink="false">${escapeXml(ep.guid)}</guid>
      <itunes:duration>${escapeXml(ep.duration)}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(show.title)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(show.description)}</description>
    <language>${escapeXml(show.language)}</language>
    <managingEditor>${escapeXml(show.email)} (${escapeXml(show.author)})</managingEditor>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <itunes:image href="${escapeXml(show.imageUrl)}" />
    <itunes:author>${escapeXml(show.author)}</itunes:author>
    <itunes:category text="${escapeXml(show.category)}" />
    <itunes:explicit>false</itunes:explicit>
    <itunes:owner>
      <itunes:name>${escapeXml(show.author)}</itunes:name>
      <itunes:email>${escapeXml(show.email)}</itunes:email>
    </itunes:owner>${items}
  </channel>
</rss>`;
}
