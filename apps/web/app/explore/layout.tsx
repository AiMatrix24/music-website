import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover tracks, artists, events, and marketplace listings on OPYNX.',
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
