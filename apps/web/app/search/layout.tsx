import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for tracks, artists, events, and marketplace listings on OPYNX.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
