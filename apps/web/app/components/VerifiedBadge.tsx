/**
 * Blue ✓ verified badge — render next to a creator's name when they have a
 * non-null verifiedAt on their user record. Pure presentation; no fetching.
 *
 * Usage:
 *   {user.verifiedAt && <VerifiedBadge />}
 *   {user.verifiedAt && <VerifiedBadge size="sm" />}
 */
export function VerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls =
    size === 'sm' ? 'w-3.5 h-3.5 text-[9px]' :
    size === 'lg' ? 'w-6 h-6 text-sm' :
    'w-4 h-4 text-[10px]';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white font-bold leading-none align-middle ${cls}`}
      title="Verified creator"
      aria-label="Verified"
    >
      ✓
    </span>
  );
}
