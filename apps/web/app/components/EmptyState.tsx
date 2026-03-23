import Link from 'next/link';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-brand-600/10 flex items-center justify-center text-4xl mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-sm mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-500"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
