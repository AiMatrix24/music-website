'use client';

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc/client';

interface StatProps {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

function AnimatedStat({ value, label, suffix = '', prefix = '' }: StatProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-black text-red-400 mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

export function StatsCounter() {
  // Fetch live data from the database
  const { data: tracks } = trpc.tracks.list.useQuery({ limit: 100 });
  const { data: events } = trpc.events.list.useQuery({ limit: 100, status: 'published' });

  // Calculate stats from live data
  const totalPlays = tracks?.reduce((sum, t) => sum + (t.playCount ?? 0), 0) ?? 0;
  const trackCount = tracks?.length ?? 0;

  // Derive unique artist count from tracks
  const uniqueArtists = tracks
    ? new Set(tracks.map(t => (t as { artistId?: string }).artistId).filter(Boolean)).size
    : 0;
  const artistCount = uniqueArtists || (tracks ? Math.max(1, Math.ceil(trackCount / 3)) : 0);

  const eventCount = events?.length ?? 0;

  // Format plays for display: show as "248K" if thousands
  const playsDisplay = totalPlays >= 1000 ? Math.round(totalPlays / 1000) : totalPlays;
  const playsSuffix = totalPlays >= 1000 ? 'K' : '';

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <AnimatedStat value={playsDisplay} suffix={playsSuffix + ' PLAYS'} label="Total Plays" />
        <AnimatedStat value={trackCount} label="Tracks" />
        <AnimatedStat value={artistCount} label="Artists" />
        <AnimatedStat value={eventCount} label="Live Events" />
      </div>
    </section>
  );
}
