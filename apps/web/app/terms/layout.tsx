import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'OPYNX Terms of Service — rules and guidelines for using the FanEngage Protocol.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
