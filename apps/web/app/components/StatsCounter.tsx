'use client';

import { useEffect, useRef, useState } from 'react';

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
      <p className="text-4xl md:text-5xl font-black text-brand-400 mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

export function StatsCounter() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <AnimatedStat value={248} suffix="K" label="Plays" />
        <AnimatedStat value={15} label="Tracks" />
        <AnimatedStat value={6} label="Artists" />
        <AnimatedStat value={5} label="Live Events" />
      </div>
    </section>
  );
}
