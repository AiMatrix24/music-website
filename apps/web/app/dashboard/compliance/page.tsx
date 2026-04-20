'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

const RESERVED_FUNDS = [
  { label: 'PRO Reserves', amount: 342.50, note: '15% of public performance earnings' },
  { label: 'MLC Reserves', amount: 89.20, note: 'mechanical royalties' },
  { label: 'Publisher Splits', amount: 156.00, note: '50% of writing royalties' },
  { label: 'Union Pension/Health', amount: 45.00, note: 'AFM members' },
];

const QUARTERLY_STATEMENTS = [
  { period: 'Q4 2025', generated: '2026-01-15', amount: 2150.32 },
  { period: 'Q3 2025', generated: '2025-10-15', amount: 1820.45 },
  { period: 'Q2 2025', generated: '2025-07-15', amount: 1610.18 },
  { period: 'Q1 2025', generated: '2025-04-15', amount: 1295.07 },
];

const OUTSTANDING = [
  { id: 'mlc-register', text: 'Register 3 tracks with MLC', cta: 'Register Tracks', urgent: true },
  { id: 'pro-update', text: 'Update PRO affiliation', cta: 'Update', urgent: false },
  { id: 'q4-ascap', text: 'Submit Q4 ASCAP report', cta: 'Submit Report', dueDays: 12, urgent: true },
];

const TAX_DOCS = [
  { name: '1099-K from OPYNX', amount: 4250.00, ready: true, year: 2025 },
  { name: 'PRO statements (ASCAP)', amount: null, ready: false, year: 2025 },
];

export default function CompliancePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🛡️</p>
        <p className="text-gray-400 text-lg">Sign in to view compliance</p>
        <Link
          href="/auth/login"
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const totalReserved = RESERVED_FUNDS.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="mr-2">🛡️</span>
            Royalty Compliance
          </h1>
          <p className="text-gray-400">Stay compliant with PROs, MLC, and union obligations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reserved Funds */}
          <section className="bg-[#15151f] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-1">Reserved Funds</h2>
            <p className="text-sm text-gray-400 mb-5">Money held in escrow for industry payments</p>

            <div className="space-y-3 mb-5">
              {RESERVED_FUNDS.map((r) => (
                <div key={r.label} className="flex items-center justify-between bg-brand-950 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-semibold">{r.label}</p>
                    <p className="text-xs text-gray-500">{r.note}</p>
                  </div>
                  <p className="font-mono font-bold text-red-400">${r.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-4 flex items-center justify-between">
              <p className="font-bold">Total Reserved</p>
              <p className="font-mono font-bold text-xl text-emerald-300">${totalReserved.toFixed(2)}</p>
            </div>
          </section>

          {/* Outstanding Obligations */}
          <section className="bg-[#15151f] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-1">Outstanding Obligations</h2>
            <p className="text-sm text-gray-400 mb-5">Action items to stay compliant</p>

            <div className="space-y-3">
              {OUTSTANDING.map((o) => {
                const ctaUrl = o.id === 'mlc-register' ? '/dashboard/rights'
                  : o.id === 'q4-ascap' ? 'https://www.ascap.com/help/payments'
                  : '/dashboard/rights/verify';
                return (
                  <div key={o.id} className="bg-brand-950 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold">{o.text}</p>
                      {o.dueDays !== undefined && (
                        <p className={`text-xs ${o.urgent ? 'text-red-300' : 'text-gray-400'}`}>
                          Due in {o.dueDays} days
                        </p>
                      )}
                    </div>
                    <Link href={ctaUrl} className="rounded-full bg-red-600 hover:bg-red-500 transition px-3 py-1.5 text-xs font-semibold whitespace-nowrap">
                      {o.cta}
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quarterly Statements */}
          <section className="bg-[#15151f] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-1">Quarterly Statements</h2>
            <p className="text-sm text-gray-400 mb-5">Past royalty statements</p>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Generated</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {QUARTERLY_STATEMENTS.map((q) => (
                  <tr key={q.period} className="border-b border-gray-800/60">
                    <td className="py-3 pr-3 font-semibold">{q.period}</td>
                    <td className="py-3 pr-3 text-gray-400">{q.generated}</td>
                    <td className="py-3 pr-3 font-mono">${q.amount.toFixed(2)}</td>
                    <td className="py-3 pr-3 text-right">
                      <a
                        href={`/api/statements/${q.period.replace(' ', '-')}.pdf`}
                        download
                        className="inline-block rounded-full bg-[#1d1d2a] hover:bg-[#26263a] transition px-3 py-1.5 text-xs font-semibold"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Tax Documents */}
          <section className="bg-[#15151f] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-1">Year-End Tax Documents</h2>
            <p className="text-sm text-gray-400 mb-5">1099 and PRO tax forms</p>

            <div className="space-y-3">
              {TAX_DOCS.map((t) => (
                <div key={t.name} className="bg-brand-950 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-500">
                      {t.year} · {t.amount !== null ? `$${t.amount.toFixed(2)}` : 'Not yet generated'}
                    </p>
                  </div>
                  {t.ready ? (
                    <a
                      href={`/api/tax-docs/${t.year}-${t.name.replace(/\s+/g, '-').toLowerCase()}.pdf`}
                      download
                      className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap bg-red-600 hover:bg-red-500 text-white"
                    >
                      Download
                    </a>
                  ) : (
                    <button
                      disabled
                      className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap bg-gray-700 text-gray-400 cursor-not-allowed"
                    >
                      Pending
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Settings */}
        <section className="bg-[#15151f] rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">Settings</h2>
              <p className="text-sm text-gray-400">Your compliance affiliations</p>
            </div>
            <Link href="/settings" className="rounded-full bg-red-600 hover:bg-red-500 transition px-4 py-2 text-sm font-semibold">
              Edit Settings
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'PRO membership', value: 'ASCAP (member #123456)' },
              { label: 'Publisher', value: 'Self-published' },
              { label: 'AFM Local', value: 'Local 47 (Los Angeles)' },
              { label: 'IPI/CAE Number', value: '00123456789' },
            ].map((s) => (
              <div key={s.label} className="bg-brand-950 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="font-semibold">{s.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
