import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@opynx/db';
import { podcasts, podcastEpisodes } from '@opynx/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [show] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.slug, slug))
    .limit(1);

  if (!show) {
    return new NextResponse('Podcast not found', { status: 404 });
  }

  const episodes = await db
    .select()
    .from(podcastEpisodes)
    .where(and(eq(podcastEpisodes.podcastId, show.id), eq(podcastEpisodes.status, 'published')))
    .orderBy(desc(podcastEpisodes.publishedAt));

  const xml = generateRSS(show, episodes);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}

// ─── RSS Generator ───

const SITE_URL = 'https://opynx.com';

function escapeXml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRFC822(date: Date | string | null): string {
  if (!date) return new Date().toUTCString();
  return new Date(date).toUTCString();
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function audioMimeType(url: string): string {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/x-m4a';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/mpeg';
}

type ShowRow = typeof podcasts.$inferSelect;
type EpisodeRow = typeof podcastEpisodes.$inferSelect;

function generateRSS(show: ShowRow, episodes: EpisodeRow[]): string {
  const feedUrl = `${SITE_URL}/api/podcast/${encodeURIComponent(show.slug)}/feed.xml`;
  const showUrl = `${SITE_URL}/podcast/${encodeURIComponent(show.slug)}`;
  const author = show.author ?? 'OPYNX Creator';
  const ownerEmail = show.ownerEmail ?? 'noreply@opynx.com';
  const description = show.description ?? show.title;
  const lang = show.language || 'en';
  const explicit = show.explicit ? 'true' : 'false';
  const category = show.category ?? 'Music';
  const coverUrl = show.coverUrl ?? `${SITE_URL}/logo.jpeg`;

  const items = episodes
    .filter((ep) => !!ep.audioUrl)
    .map((ep) => {
      const epUrl = `${SITE_URL}/podcast/${encodeURIComponent(show.slug)}/${encodeURIComponent(ep.slug)}`;
      const enclosureType = audioMimeType(ep.audioUrl!);
      const length = ep.fileSize ?? 0;
      const epExplicit = ep.explicit ? 'true' : 'false';
      const epType = ep.episodeType || 'full';
      const seasonTag = ep.seasonNumber ? `      <itunes:season>${ep.seasonNumber}</itunes:season>\n` : '';
      const episodeTag = ep.episodeNumber ? `      <itunes:episode>${ep.episodeNumber}</itunes:episode>\n` : '';
      return `    <item>
      <title>${escapeXml(ep.title)}</title>
      <link>${escapeXml(epUrl)}</link>
      <description><![CDATA[${ep.description ?? ''}]]></description>
      <pubDate>${formatRFC822(ep.publishedAt)}</pubDate>
      <enclosure url="${escapeXml(ep.audioUrl!)}" length="${length}" type="${enclosureType}" />
      <guid isPermaLink="false">opynx-ep-${ep.id}</guid>
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:duration>${formatDuration(ep.duration)}</itunes:duration>
      <itunes:explicit>${epExplicit}</itunes:explicit>
      <itunes:episodeType>${epType}</itunes:episodeType>
${seasonTag}${episodeTag}    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(show.title)}</title>
    <link>${showUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>${escapeXml(lang)}</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(author)}</copyright>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <itunes:author>${escapeXml(author)}</itunes:author>
    <itunes:summary>${escapeXml(description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:owner>
      <itunes:name>${escapeXml(author)}</itunes:name>
      <itunes:email>${escapeXml(ownerEmail)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${escapeXml(coverUrl)}" />
    <itunes:category text="${escapeXml(category)}" />
    <itunes:explicit>${explicit}</itunes:explicit>
${items}
  </channel>
</rss>`;
}
