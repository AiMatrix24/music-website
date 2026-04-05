import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OPYNX Player',
};

export default function EmbedPlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bare layout: no navbar, no footer, no providers wrapping
  // The root layout still applies <html>/<body>, but this route group
  // renders only the player widget content.
  return <>{children}</>;
}
