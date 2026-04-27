'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/app/components/Toast';
import { VerifiedBadge } from '@/app/components/VerifiedBadge';

/**
 * Focused subscription landing page — what fans land on after scanning a
 * creator's QR poster at an event. The whole page is built around a single
 * goal: Subscribe. Two tier choices, single CTA.
 *
 * Premium: $8.73/mo to follow JUST this creator.
 * Bundle:  $12.73/mo to follow this creator + up to 3 more (BundlePicker).
 *
 * Attribution captured at submit:
 *   source: 'qr'
 *   creatorId / creatorIds (depending on tier)
 *   eventId (from ?ev= URL param if the QR was generated from an event context)
 *   scanLat/scanLng (best-effort geolocation, asked at submit time so the
 *   user has consented to subscribing first)
 */
type Tier = 'premium' | 'bundle';

interface Coords { lat: number; lng: number }

export default function SubscribeLandingPage() {
  const params = useParams<{ creatorId: string }>();
  const searchParams = useSearchParams();
  const creatorId = params?.creatorId ?? '';
  const eventId = searchParams?.get('ev') ?? undefined;

  const router = useRouter();
  const { status, data: session } = useSession();
  const { toast } = useToast();

  const [tier, setTier] = useState<Tier>('premium');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [extraIds, setExtraIds] = useState<string[]>([]); // 0-3 additional creators
  const [submitting, setSubmitting] = useState(false);

  const creatorQuery = trpc.users.getById.useQuery(
    { id: creatorId },
    { enabled: !!creatorId }
  );
  const followerCountQuery = trpc.users.getFollowerCount.useQuery(
    { userId: creatorId },
    { enabled: !!creatorId }
  );

  if (!creatorId) {
    return <NotFoundPanel />;
  }

  if (creatorQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }
  const creator = creatorQuery.data;
  if (!creator) return <NotFoundPanel />;

  const handleSubscribe = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      // Bounce to login, come back here after.
      router.push(`/auth/login?next=${encodeURIComponent(`/sub/${creatorId}${eventId ? `?ev=${eventId}` : ''}`)}`);
      return;
    }

    setSubmitting(true);
    try {
      // Best-effort geolocation. Ask just before submit so the user has
      // already committed to subscribing — better consent flow than asking
      // the moment they land on the page.
      const coords = await getCoordsBestEffort();

      const body: Record<string, unknown> = {
        tier,
        paymentMethod: 'usdc',
        source: 'qr',
        ...(eventId ? { eventId } : {}),
        ...(coords ? { scanLat: coords.lat, scanLng: coords.lng } : {}),
      };
      if (tier === 'premium') {
        body.creatorId = creatorId;
      } else {
        body.creatorIds = [creatorId, ...extraIds];
      }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.paymentUrl) {
        throw new Error(data.error || 'Subscription failed');
      }
      window.location.href = data.paymentUrl;
    } catch (err) {
      toast((err as Error).message || 'Could not start subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const bundleReady = tier !== 'bundle' || extraIds.length === 3;

  return (
    <div className="min-h-screen py-12 px-5">
      <div className="max-w-md mx-auto space-y-6">
        {/* Creator card */}
        <div className="rounded-3xl bg-[#15151f] border border-brand-800/20 p-6 text-center">
          {creator.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.avatar} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-2 ring-red-600/40" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-3xl font-black mx-auto mb-4">
              {creator.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2 flex-wrap">
            {creator.name}
            {creator.verifiedAt && <VerifiedBadge size="md" />}
          </h1>
          {creator.bio && (
            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{creator.bio}</p>
          )}
          {typeof followerCountQuery.data === 'number' && (
            <p className="text-xs text-gray-500 mt-3">{followerCountQuery.data.toLocaleString()} followers</p>
          )}
        </div>

        {/* Tier picker */}
        <div className="space-y-3">
          <TierCard
            id="premium"
            selected={tier === 'premium'}
            onClick={() => setTier('premium')}
            badge="Most popular"
            price="$8.73"
            tagline={`Subscribe to ${creator.name ?? 'this creator'}`}
            sub="Follow one creator. Direct support."
          />
          <TierCard
            id="bundle"
            selected={tier === 'bundle'}
            onClick={() => setTier('bundle')}
            price="$12.73"
            tagline="Superfan Bundle — 4 creators"
            sub={
              extraIds.length === 3
                ? `${creator.name} + ${extraIds.length} others picked`
                : `${creator.name} + pick 3 more`
            }
          />
          {tier === 'bundle' && (
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full text-sm text-red-400 hover:text-red-300 font-semibold underline"
            >
              {extraIds.length === 3 ? 'Change picks' : `Pick ${3 - extraIds.length} more creator${3 - extraIds.length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>

        {/* Subscribe CTA */}
        <button
          onClick={handleSubscribe}
          disabled={submitting || !bundleReady}
          className="w-full rounded-full bg-red-600 hover:bg-red-500 px-5 py-4 text-base font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? 'Starting checkout…'
            : !bundleReady
            ? 'Pick 3 more to continue'
            : `Subscribe — ${tier === 'premium' ? '$8.73/mo' : '$12.73/mo'}`}
        </button>

        <p className="text-xs text-gray-500 text-center">
          USDC on Polygon. Cancel any time. {eventId && '· Attributed to this event.'}
        </p>

        <p className="text-xs text-gray-600 text-center">
          <Link href={`/artist/${creatorId}`} className="hover:text-gray-400 transition">
            ← View creator profile
          </Link>
        </p>
      </div>

      {pickerOpen && (
        <BundlePicker
          excludeId={creatorId}
          selected={extraIds}
          onChange={setExtraIds}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// ───────── Subcomponents ─────────

function TierCard({
  id, selected, onClick, badge, price, tagline, sub,
}: {
  id: string; selected: boolean; onClick: () => void;
  badge?: string; price: string; tagline: string; sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 border-2 transition ${
        selected
          ? 'bg-red-950/20 border-red-600'
          : 'bg-[#15151f] border-brand-800/20 hover:border-brand-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {badge && (
            <span className="inline-block text-[10px] uppercase tracking-wide font-bold bg-red-600/20 text-red-400 rounded-full px-2 py-0.5 mb-2">
              {badge}
            </span>
          )}
          <p className="font-bold">{tagline}</p>
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black">{price}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">/month</p>
        </div>
      </div>
    </button>
  );
}

function NotFoundPanel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-5xl mb-2">🤷</p>
      <h1 className="text-2xl font-bold">Creator not found</h1>
      <p className="text-gray-400 text-center">The QR code may be invalid or the creator's profile was removed.</p>
      <Link href="/explore" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white mt-4">Browse creators</Link>
    </div>
  );
}

// ───────── Bundle picker ─────────

function BundlePicker({
  excludeId, selected, onChange, onClose,
}: {
  excludeId: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const creatorsQuery = trpc.users.listCreators.useQuery({ limit: 50 });

  const filtered = (creatorsQuery.data ?? [])
    .filter((c) => c.id !== excludeId)
    .filter((c) => !query.trim() || (c.name ?? '').toLowerCase().includes(query.trim().toLowerCase()));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else if (selected.length < 3) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#15151f] border border-brand-800/30 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-800/20">
          <div>
            <h3 className="font-bold">Pick 3 more creators</h3>
            <p className="text-xs text-gray-500">{selected.length}/3 picked</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none px-1">×</button>
        </div>

        <div className="px-5 py-3 border-b border-brand-800/20">
          <input
            type="text"
            placeholder="Search creators…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
          />
        </div>

        <ul className="flex-1 overflow-y-auto">
          {creatorsQuery.isLoading ? (
            <p className="p-6 text-center text-gray-500 text-sm">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-gray-500 text-sm">No creators found.</p>
          ) : (
            filtered.map((c) => {
              const isSelected = selected.includes(c.id);
              const disabled = !isSelected && selected.length >= 3;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => toggle(c.id)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition border-b border-brand-800/10 last:border-0 ${
                      isSelected ? 'bg-red-950/20' : 'hover:bg-brand-950/40'
                    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {c.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-black shrink-0">
                        {c.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.role}</p>
                    </div>
                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-sm font-bold">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-brand-800/30" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="px-5 py-4 border-t border-brand-800/20">
          <button
            onClick={onClose}
            disabled={selected.length !== 3}
            className="w-full rounded-full bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
          >
            {selected.length === 3 ? 'Done — back to subscribe' : `Pick ${3 - selected.length} more`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────── Geolocation helper ─────────

/**
 * Best-effort GPS. Resolves to coords if the user grants permission within
 * 5 seconds, otherwise resolves to null. Never throws — geolocation is
 * optional and shouldn't block the subscribe flow.
 */
async function getCoordsBestEffort(): Promise<Coords | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return new Promise<Coords | null>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; resolve(null); }
    }, 5000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  });
}
