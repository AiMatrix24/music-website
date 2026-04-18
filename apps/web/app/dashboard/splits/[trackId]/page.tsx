'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  validateSplits,
  type Writer,
  type Publisher,
  type MasterOwnership,
} from '@/lib/services/split-sheet';

type ProAffiliation = Writer['proAffiliation'];

const PRO_OPTIONS: ProAffiliation[] = ['ASCAP', 'BMI', 'SESAC', 'GMR', 'NONE'];
const PRO_COLLECTING_OPTIONS = ['ASCAP', 'BMI', 'SESAC', 'GMR'] as const;
const TERRITORY_OPTIONS: Publisher['territory'][] = [
  'Worldwide',
  'US',
  'Europe',
  'Other',
];

export default function SplitSheetEditorPage() {
  const params = useParams<{ trackId: string }>();
  const trackId = params?.trackId ?? '';
  const { data: session, status } = useSession();

  // Mock track title (would be fetched from tRPC in production)
  const trackTitle = useMemo(() => `Track ${trackId.slice(0, 8)}`, [trackId]);

  const [writers, setWriters] = useState<Writer[]>(() => [
    {
      id: 'w-1',
      name: '',
      ipiNumber: '',
      proAffiliation: 'NONE',
      publisher: '',
      percentage: 100,
    },
  ]);

  const [publishers, setPublishers] = useState<Publisher[]>(() => [
    {
      id: 'p-1',
      name: 'Self-Published',
      percentage: 100,
      territory: 'Worldwide',
    },
  ]);

  const [master, setMaster] = useState<MasterOwnership>({
    type: 'artist',
  });

  const [mechRequired, setMechRequired] = useState<'required' | 'not_required'>(
    'required'
  );
  const [mlcRegistered, setMlcRegistered] = useState(false);

  const [proCollecting, setProCollecting] =
    useState<(typeof PRO_COLLECTING_OPTIONS)[number]>('ASCAP');
  const [workRegNumber, setWorkRegNumber] = useState('');

  const [showSignerModal, setShowSignerModal] = useState(false);
  const [signerEmails, setSignerEmails] = useState('');

  const writerValidation = useMemo(() => validateSplits(writers), [writers]);
  const publisherValidation = useMemo(
    () => validateSplits(publishers),
    [publishers]
  );

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
        <p className="text-5xl mb-2">🎼</p>
        <p className="text-gray-400 text-lg">
          Sign in to manage split sheets
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

  // ─── Writer handlers ───
  const addWriter = () => {
    setWriters((prev) => [
      ...prev,
      {
        id: `w-${Date.now()}`,
        name: '',
        ipiNumber: '',
        proAffiliation: 'NONE',
        publisher: '',
        percentage: 0,
      },
    ]);
  };
  const removeWriter = (id: string) =>
    setWriters((prev) => prev.filter((w) => w.id !== id));
  const updateWriter = (id: string, patch: Partial<Writer>) =>
    setWriters((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );

  // ─── Publisher handlers ───
  const addPublisher = () => {
    setPublishers((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        name: '',
        percentage: 0,
        territory: 'Worldwide',
      },
    ]);
  };
  const removePublisher = (id: string) =>
    setPublishers((prev) => prev.filter((p) => p.id !== id));
  const updatePublisher = (id: string, patch: Partial<Publisher>) =>
    setPublishers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );

  return (
    <div className="min-h-screen bg-brand-950 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="text-sm text-red-400 hover:text-red-300 mb-3 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black mb-2">Split Sheet Editor</h1>
          <p className="text-gray-400">
            <span className="text-white font-semibold">{trackTitle}</span>{' '}
            — Configure songwriter, publisher, and master rights splits
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Songwriter Splits */}
            <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Songwriter Splits</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Must total 100%
                  </p>
                </div>
                <button
                  onClick={addWriter}
                  className="rounded-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-4 py-1.5 text-sm font-semibold transition"
                >
                  + Add Writer
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {writers.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl bg-brand-950/50 border border-brand-800/20 p-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Writer name"
                        value={w.name}
                        onChange={(e) =>
                          updateWriter(w.id, { name: e.target.value })
                        }
                        className="w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="IPI / CAE number"
                        value={w.ipiNumber ?? ''}
                        onChange={(e) =>
                          updateWriter(w.id, { ipiNumber: e.target.value })
                        }
                        className="w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                      />
                      <select
                        value={w.proAffiliation}
                        onChange={(e) =>
                          updateWriter(w.id, {
                            proAffiliation: e.target.value as ProAffiliation,
                          })
                        }
                        className="w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                      >
                        {PRO_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p === 'NONE' ? 'No PRO' : p}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Publisher"
                        value={w.publisher ?? ''}
                        onChange={(e) =>
                          updateWriter(w.id, { publisher: e.target.value })
                        }
                        className="w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
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
                          className="w-24 rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                        />
                        <span className="text-sm text-gray-400">%</span>
                      </div>
                      {writers.length > 1 && (
                        <button
                          onClick={() => removeWriter(w.id)}
                          className="text-xs text-gray-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual percentage bar */}
              <div className="mb-3">
                <div className="flex h-3 rounded-full overflow-hidden bg-brand-950">
                  {writers.map((w, idx) => (
                    <div
                      key={w.id}
                      className={`h-full ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                      style={{ width: `${Math.min(w.percentage, 100)}%` }}
                      title={`${w.name || 'Writer'}: ${w.percentage}%`}
                    />
                  ))}
                </div>
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

            {/* Publisher Splits */}
            <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Publisher Splits</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Must total 100%
                  </p>
                </div>
                <button
                  onClick={addPublisher}
                  className="rounded-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-4 py-1.5 text-sm font-semibold transition"
                >
                  + Add Publisher
                </button>
              </div>

              <div className="space-y-3 mb-3">
                {publishers.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl bg-brand-950/50 border border-brand-800/20 p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Publisher name"
                      value={p.name}
                      onChange={(e) =>
                        updatePublisher(p.id, { name: e.target.value })
                      }
                      className="sm:col-span-5 w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                    />
                    <select
                      value={p.territory}
                      onChange={(e) =>
                        updatePublisher(p.id, {
                          territory: e.target.value as Publisher['territory'],
                        })
                      }
                      className="sm:col-span-4 w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                    >
                      {TERRITORY_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={p.percentage}
                        onChange={(e) =>
                          updatePublisher(p.id, {
                            percentage: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg bg-[#15151f] border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                    {publishers.length > 1 && (
                      <button
                        onClick={() => removePublisher(p.id)}
                        className="sm:col-span-1 text-xs text-gray-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {publisherValidation.valid ? (
                <p className="text-xs text-green-400 font-semibold">
                  ✓ Total: 100%
                </p>
              ) : (
                <p className="text-xs text-red-400 font-semibold">
                  {publisherValidation.error}
                </p>
              )}
            </section>

            {/* Master Recording Ownership */}
            <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="text-xl font-bold mb-4">
                Master Recording Ownership
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {(['artist', 'label', 'coowned'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setMaster({ type: opt })}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      master.type === opt
                        ? 'border-red-600 bg-red-600/10 text-white'
                        : 'border-brand-800/30 text-gray-400 hover:border-red-600/40'
                    }`}
                  >
                    {opt === 'artist'
                      ? 'You'
                      : opt === 'label'
                        ? 'Label'
                        : 'Co-owned'}
                  </button>
                ))}
              </div>

              {(master.type === 'label' || master.type === 'coowned') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Label name"
                    value={master.labelName ?? ''}
                    onChange={(e) =>
                      setMaster({ ...master, labelName: e.target.value })
                    }
                    className="rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Contract reference number"
                    value={master.contractRef ?? ''}
                    onChange={(e) =>
                      setMaster({ ...master, contractRef: e.target.value })
                    }
                    className="rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}

              {master.type === 'coowned' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className="text-xs text-gray-400">
                    Artist share %
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={master.artistShare ?? 50}
                      onChange={(e) =>
                        setMaster({
                          ...master,
                          artistShare: Number(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-gray-400">
                    Label royalty share %
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={master.labelShare ?? 50}
                      onChange={(e) =>
                        setMaster({
                          ...master,
                          labelShare: Number(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
                    />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs text-gray-400">
                  Effective date
                  <input
                    type="date"
                    onChange={(e) =>
                      setMaster({
                        ...master,
                        effectiveDate: e.target.value
                          ? new Date(e.target.value)
                          : undefined,
                      })
                    }
                    className="mt-1 w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-gray-400">
                  Expiration (term ends)
                  <input
                    type="date"
                    onChange={(e) =>
                      setMaster({
                        ...master,
                        termEnds: e.target.value
                          ? new Date(e.target.value)
                          : undefined,
                      })
                    }
                    className="mt-1 w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
                  />
                </label>
              </div>
            </section>

            {/* Mechanical Rights */}
            <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="text-xl font-bold mb-4">Mechanical Rights</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Mechanical license
                  </p>
                  <div className="flex gap-2">
                    {(['required', 'not_required'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setMechRequired(opt)}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                          mechRequired === opt
                            ? 'bg-red-600 text-white'
                            : 'bg-brand-950/50 text-gray-400 hover:bg-brand-950'
                        }`}
                      >
                        {opt === 'required' ? 'Required' : 'Not Required'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    MLC registered
                  </p>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => setMlcRegistered(true)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        mlcRegistered
                          ? 'bg-red-600 text-white'
                          : 'bg-brand-950/50 text-gray-400 hover:bg-brand-950'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setMlcRegistered(false)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        !mlcRegistered
                          ? 'bg-red-600 text-white'
                          : 'bg-brand-950/50 text-gray-400 hover:bg-brand-950'
                      }`}
                    >
                      No
                    </button>
                    {!mlcRegistered && (
                      <a
                        href="https://www.themlc.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Register with MLC →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Performance Rights */}
            <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="text-xl font-bold mb-4">Performance Rights</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    PRO collecting on your behalf
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRO_COLLECTING_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setProCollecting(opt)}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                          proCollecting === opt
                            ? 'bg-red-600 text-white'
                            : 'bg-brand-950/50 text-gray-400 hover:bg-brand-950'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Work registration number with PRO"
                  value={workRegNumber}
                  onChange={(e) => setWorkRegNumber(e.target.value)}
                  className="w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
                <a
                  href={`https://www.${proCollecting.toLowerCase()}.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-red-400 hover:text-red-300 font-semibold"
                >
                  Register with {proCollecting} →
                </a>
              </div>
            </section>

            {/* Generate Documents */}
            <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="text-xl font-bold mb-4">Generate Documents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() =>
                    alert('Mock: Split sheet PDF would download here.')
                  }
                  className="rounded-xl bg-brand-950/50 border border-brand-800/30 hover:border-red-600/40 px-4 py-3 text-sm font-semibold transition"
                >
                  📄 Download Split Sheet PDF
                </button>
                <button
                  onClick={() => setShowSignerModal(true)}
                  className="rounded-xl bg-brand-950/50 border border-brand-800/30 hover:border-red-600/40 px-4 py-3 text-sm font-semibold transition"
                >
                  ✍️ Send for E-Signature
                </button>
                <button
                  onClick={() =>
                    alert(
                      'Mock: An immutable record would be created on Polygon.'
                    )
                  }
                  className="rounded-xl bg-brand-950/50 border border-brand-800/30 hover:border-red-600/40 px-4 py-3 text-sm font-semibold transition"
                >
                  ⛓️ Generate On-Chain Record
                </button>
              </div>
            </section>

            {/* Save */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500">Last saved: 2 minutes ago</p>
              <button
                disabled={
                  !writerValidation.valid || !publisherValidation.valid
                }
                onClick={() => alert('Mock: Saving split sheet…')}
                className="rounded-full bg-red-600 px-8 py-4 text-base font-bold text-white hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h3 className="text-lg font-bold mb-3">Why splits matter</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                A split sheet is the legal foundation for how royalties from
                streams, syncs, and performance income flow back to everyone
                involved in your track.
              </p>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-red-500">▸</span>
                  <span>
                    <strong className="text-white">Songwriter splits</strong>{' '}
                    determine how mechanical and performance royalties are
                    divided.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">▸</span>
                  <span>
                    <strong className="text-white">Publisher splits</strong>{' '}
                    govern the publisher’s share of the writer’s side.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">▸</span>
                  <span>
                    <strong className="text-white">Master ownership</strong>{' '}
                    decides who collects from streaming and licensing.
                  </span>
                </li>
              </ul>
              <Link
                href="/education/royalties"
                className="mt-4 inline-block text-sm text-red-400 hover:text-red-300 font-semibold"
              >
                Learn more about royalties →
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Signer modal */}
      {showSignerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#15151f] border border-brand-800/40 p-6">
            <h3 className="text-xl font-bold mb-3">Send for E-Signature</h3>
            <p className="text-sm text-gray-400 mb-4">
              Add signer email addresses (one per line). Each party will
              receive a secure link to review and sign.
            </p>
            <textarea
              value={signerEmails}
              onChange={(e) => setSignerEmails(e.target.value)}
              rows={5}
              placeholder="writer1@example.com&#10;writer2@example.com"
              className="w-full rounded-lg bg-brand-950/50 border border-brand-800/30 px-3 py-2 text-sm focus:border-red-600 focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSignerModal(false)}
                className="rounded-full border border-brand-800/40 px-5 py-2 text-sm font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(
                    `Mock: Sending signature requests to ${signerEmails
                      .split('\n')
                      .filter(Boolean)
                      .length} signer(s).`
                  );
                  setShowSignerModal(false);
                }}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-500 transition"
              >
                Send Requests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BAR_COLORS = [
  'bg-red-600',
  'bg-red-400',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-purple-500',
];
