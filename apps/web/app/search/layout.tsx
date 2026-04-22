import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for tracks, creators, events, and marketplace listings on OPYNX.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
