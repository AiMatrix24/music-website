'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { validateSplits } from '@/lib/services/split-sheet';

type RightsStatus =
  | 'independent'
  | 'label_permission'
  | 'coowned'
  | 'exclusive_blocked';

type ProAffiliation = 'ASCAP' | 'BMI' | 'SESAC' | 'GMR' | 'NONE';

type WriterRow = {
  id: string;
  name: string;
  pro: ProAffiliation;
  percentage: number;
};

const WRITER_COUNT_OPTIONS = ['1', '2', '3', '4+'] as const;
type WriterCountOption = (typeof WRITER_COUNT_OPTIONS)[number];

export default function UploadRightsStepPage() {
  const { data: session, status } = useSession();

  const [rightsStatus, setRightsStatus] = useState<RightsStatus | null>(null);
  const [permissionFile, setPermissionFile] = useState<File | null>(null);
  const [coownedSplit, setCoownedSplit] = useState<number>(50);

  const [writerCount, setWriterCount] = useState<WriterCountOption>('1');
  const [writers, setWriters] = useState<WriterRow[]>(() => [
    {
      id: 'w-1',
      name: '',
      pro: 'NONE',
      percentage: 100,
    },
  ]);

  const [proAffiliated, setProAffiliated] = useState<
    'yes' | 'no' | 'unsure' | null
  >(null);
  const [whichPro, setWhichPro] = useState<ProAffiliation>('ASCAP');
  const [memberNumber, setMemberNumber] = useState('');
  const [publisherType, setPublisherType] = useState<
    'self' | 'indie' | 'major' | null
  >('self');
  const [publisherName, setPublisherName] = useState('');

  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmConsequences, setConfirmConsequences] = useState(false);

  const writerValidation = useMemo(() => validateSplits(writers), [writers]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🛡️</p>
        <p className="text-gray-400 text-lg">
          Sign in to manage your release rights
        </p>
        <Link
          href="/auth/login"
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const setWriterCountOption = (opt: WriterCountOption) => {
    setWriterCount(opt);
    const target = opt === '4+' ? 4 : Number(opt);
    setWriters((prev) => {
      if (prev.length === target) return prev;
      const next = [...prev];
      while (next.length < target) {
        next.push({
          id: `w-${Date.now()}-${next.length}`,
          name: '',
          pro: 'NONE',
          percentage: 0,
        });
      }
      while (next.length > target) next.pop();
      const even = Math.floor(10000 / next.length) / 100;
      return next.map((w, i) => ({
        ...w,
        percentage: i === 0 ? +(100 - even * (next.length - 1)).toFixed(2) : even,
      }));
    });
  };

  const updateWriter = (id: string, patch: Partial<WriterRow>) =>
    setWriters((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );

  const fillSoleWriter = () => {
    setWriterCount('1');
    setWriters([
      {
        id: 'w-1',
        name: session?.user?.name ?? '',
        pro: whichPro ?? 'NONE',
        percentage: 100,
      },
    ]);
  };

  const blocked = rightsStatus === 'exclusive_blocked';
  const canContinue =
    !blocked &&
    rightsStatus !== null &&
    writerValidation.valid &&
    confirmAccurate &&
    confirmConsequences;

  return (
    <div className="min-h-screen bg-brand-950 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="mb-10">
          <Link
            href="/dashboard/upload"
            className="text-sm text-red-400 hover:text-red-300 mb-3 inline-block"
          >
            ← Back to Upload
          </Link>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Step 3 of 4
          </p>
          <h1 className="text-4xl font-black mb-2">Rights & Compliance</h1>
          <p className="text-gray-400">
            Make sure you have the rights to release this track
          </p>
        </div>

        {/* Step 1: Are you free and clear */}
        <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-1">
            Step 1: Are you free and clear to release?
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Choose the option that matches your current rights situation.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <RadioCard
              selected={rightsStatus === 'independent'}
              onSelect={() => setRightsStatus('independent')}
              icon="✅"
              title="Independent — I own all rights"
              subtitle="Recommended for indie creators"
              tone="good"
            />
            <RadioCard
              selected={rightsStatus === 'label_permission'}
              onSelect={() => setRightsStatus('label_permission')}
              icon="⚠️"
              title="Label deal — I have written permission to release here"
              subtitle="Requires upload of permission letter"
              tone="warn"
            />
            <RadioCard
              selected={rightsStatus === 'coowned'}
              onSelect={() => setRightsStatus('coowned')}
              icon="⚠️"
              title="Co-owned — Split rights with label/publisher"
              subtitle="Requires entering split %"
              tone="warn"
            />
            <RadioCard
              selected={rightsStatus === 'exclusive_blocked'}
              onSelect={() => setRightsStatus('exclusive_blocked')}
              icon="❌"
              title="Under exclusive label contract — Cannot release independently"
              subtitle="This will block the upload"
              tone="bad"
            />
          </div>

          {rightsStatus === 'label_permission' && (
            <div className="mt-4 rounded-xl bg-brand-950/50 border border-brand-800/30 p-4">
              <label className="text-sm text-gray-300 font-semibold">
                Upload permission letter (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setPermissionFile(e.target.files?.[0] ?? null)
                }
                className="mt-2 block w-full text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-red-600/20 file:px-4 file:py-2 file:text-red-400 file:font-semibold hover:file:bg-red-600 hover:file:text-white"
              />
              {permissionFile && (
                <p className="mt-2 text-xs text-green-400">
                  ✓ Selected: {permissionFile.name}
                </p>
              )}
            </div>
          )}

          {rightsStatus === 'coowned' && (
            <div className="mt-4 rounded-xl bg-brand-950/50 border border-brand-800/30 p-4">
              <label className="text-sm text-gray-300 font-semibold">
                Your share % (the rest belongs to your label/publisher)
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={coownedSplit}
                  onChange={(e) =>
                    setCoownedSplit(Number(e.target.value) || 0)
                  }
                  className="w-28 rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
                <span className="text-sm text-gray-400">
                  Your share: {coownedSplit}% / Label share:{' '}
                  {100 - coownedSplit}%
                </span>
              </div>
            </div>
          )}

          {blocked && (
            <div className="mt-4 rounded-xl border border-red-600/40 bg-red-600/10 p-4 text-sm text-red-300">
              <p className="font-bold mb-1">⚠️ Upload Blocked</p>
              <p>
                Releasing music while under exclusive contract may breach your
                agreement. Please consult your label or legal counsel before
                continuing.
              </p>
            </div>
          )}
        </section>

        {/* Step 2: Songwriter info */}
        <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Step 2: Songwriter Information
            </h2>
            <button
              onClick={fillSoleWriter}
              className="text-sm text-red-400 hover:text-red-300 font-semibold"
            >
              I am the sole writer
            </button>
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Number of writers
          </p>
          <div className="flex gap-2 mb-4">
            {WRITER_COUNT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setWriterCountOption(opt)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  writerCount === opt
                    ? 'bg-red-600 text-white'
                    : 'bg-brand-950/50 text-gray-400 hover:bg-brand-950'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="space-y-3 mb-3">
            {writers.map((w) => (
              <div
                key={w.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center rounded-xl bg-brand-950/50 border border-brand-800/20 p-3"
              >
                <input
                  type="text"
                  placeholder="Writer name"
                  value={w.name}
                  onChange={(e) =>
                    updateWriter(w.id, { name: e.target.value })
                  }
                  className="sm:col-span-5 w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
                <select
                  value={w.pro}
                  onChange={(e) =>
                    updateWriter(w.id, {
                      pro: e.target.value as ProAffiliation,
                    })
                  }
                  className="sm:col-span-4 w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                >
                  <option value="ASCAP">ASCAP</option>
                  <option value="BMI">BMI</option>
                  <option value="SESAC">SESAC</option>
                  <option value="NONE">None</option>
                </select>
                <div className="sm:col-span-3 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={w.percentage}
                    onChange={(e) =>
                      updateWriter(w.id, {
                        percentage: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>
            ))}
          </div>

          {writerValidation.valid ? (
            <p className="text-xs text-green-400 font-semibold">
              ✓ Total: 100%
            </p>
          ) : (
            <p className="text-xs text-red-400 font-semibold">
              {writerValidation.error}
            </p>
          )}
        </section>

        {/* Step 3: Publisher & PRO */}
        <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Step 3: Publisher & PRO</h2>

          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Are you affiliated with a PRO?
          </p>
          <div className="flex gap-2 mb-4">
            {(['yes', 'no', 'unsure'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setProAffiliated(opt)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
                  proAffiliated === opt
                    ? 'bg-red-600 text-white'
                    : 'bg-brand-950/50 text-gray-400 hover:bg-brand-950'
                }`}
              >
                {opt === 'unsure' ? 'Not sure' : opt}
              </button>
            ))}
          </div>

          {proAffiliated === 'yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <select
                value={whichPro}
                onChange={(e) =>
                  setWhichPro(e.target.value as ProAffiliation)
                }
                className="w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
              >
                <option value="ASCAP">ASCAP</option>
                <option value="BMI">BMI</option>
                <option value="SESAC">SESAC</option>
                <option value="GMR">GMR</option>
              </select>
              <input
                type="text"
                placeholder="Member number (optional)"
                value={memberNumber}
                onChange={(e) => setMemberNumber(e.target.value)}
                className="w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
              />
            </div>
          )}

          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Publisher
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(['self', 'indie', 'major'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setPublisherType(opt)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  publisherType === opt
                    ? 'bg-red-600 text-white'
                    : 'bg-brand-950/50 text-gray-400 hover:bg-brand-950'
                }`}
              >
                {opt === 'self'
                  ? 'Self-Published'
                  : opt === 'indie'
                    ? 'Indie Publisher'
                    : 'Major Publisher'}
              </button>
            ))}
          </div>
          {publisherType !== 'self' && (
            <input
              type="text"
              placeholder="Publisher name"
              value={publisherName}
              onChange={(e) => setPublisherName(e.target.value)}
              className="w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
            />
          )}
        </section>

        {/* Step 4: Compliance reservations */}
        <section className="rounded-2xl bg-red-600/5 border border-red-600/30 p-6 mb-6">
          <h2 className="text-xl font-bold mb-2">
            Step 4: Compliance Reservations Notice
          </h2>
          <p className="text-sm text-gray-300 mb-4">
            OPYNX will reserve a portion of your earnings for industry
            obligations:
          </p>
          <ul className="space-y-2 text-sm text-gray-300 mb-4">
            <li className="flex gap-2">
              <span className="text-red-400">•</span>
              <span>
                <strong>10%</strong> PRO reserve (performance royalties)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400">•</span>
              <span>
                <strong>9.1%</strong> MLC mechanical
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400">•</span>
              <span>
                <strong>50%</strong> to publisher (if separate from creator)
              </span>
            </li>
          </ul>
          <p className="text-xs text-gray-400 italic mb-3">
            These funds are held in escrow and distributed to the appropriate
            parties on your behalf.
          </p>
          <Link
            href="/education/royalties"
            className="text-sm text-red-400 hover:text-red-300 font-semibold"
          >
            Learn more about music royalties →
          </Link>
        </section>

        {/* Step 5: Confirm & continue */}
        <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Step 5: Confirm & Continue</h2>

          <div className="rounded-xl bg-brand-950/50 border border-brand-800/30 p-4 mb-4 text-sm text-gray-300 space-y-1">
            <p>
              <span className="text-gray-500">Rights status:</span>{' '}
              {rightsStatus ?? '—'}
            </p>
            <p>
              <span className="text-gray-500">Writers:</span>{' '}
              {writers.length} ({writerValidation.valid ? '100%' : 'invalid'})
            </p>
            <p>
              <span className="text-gray-500">PRO:</span>{' '}
              {proAffiliated === 'yes' ? whichPro : (proAffiliated ?? '—')}
            </p>
            <p>
              <span className="text-gray-500">Publisher:</span>{' '}
              {publisherType === 'self'
                ? 'Self-Published'
                : (publisherName || publisherType || '—')}
            </p>
          </div>

          <label className="flex items-start gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmAccurate}
              onChange={(e) => setConfirmAccurate(e.target.checked)}
              className="mt-1 h-4 w-4 accent-red-600"
            />
            <span className="text-sm text-gray-300">
              I confirm this information is accurate.
            </span>
          </label>
          <label className="flex items-start gap-3 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmConsequences}
              onChange={(e) => setConfirmConsequences(e.target.checked)}
              className="mt-1 h-4 w-4 accent-red-600"
            />
            <span className="text-sm text-gray-300">
              I understand false claims may result in account termination.
            </span>
          </label>

          <button
            disabled={!canContinue}
            onClick={() => alert('Mock: Proceeding to publish step.')}
            className="w-full sm:w-auto rounded-full bg-red-600 px-8 py-3 font-bold text-white hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
          >
            Continue to Publish →
          </button>
        </section>
      </div>
    </div>
  );
}

function RadioCard({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  tone,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: string;
  title: string;
  subtitle: string;
  tone: 'good' | 'warn' | 'bad';
}) {
  const toneRing = selected
    ? tone === 'bad'
      ? 'border-red-600 bg-red-600/10'
      : tone === 'warn'
        ? 'border-yellow-500 bg-yellow-500/10'
        : 'border-green-500 bg-green-500/10'
    : 'border-brand-800/30 hover:border-red-600/40';

  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-xl border p-4 transition ${toneRing}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}
