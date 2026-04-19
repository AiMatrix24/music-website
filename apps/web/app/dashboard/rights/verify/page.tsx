'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

type LabelStatus = 'yes' | 'no' | 'complicated' | '';
type PublisherStatus = 'yes' | 'no' | '';
type CoWriterStatus = 'yes' | 'no' | '';
type PRO = 'ASCAP' | 'BMI' | 'SESAC' | 'GMR' | 'None' | '';

interface CoWriter {
  id: number;
  name: string;
  split: string;
}

interface VerificationData {
  // Step 1
  legalName: string;
  dob: string;
  country: string;
  taxIdLast4: string;
  govIdFile: string;
  // Step 2
  labelStatus: LabelStatus;
  labelName: string;
  contractEnd: string;
  hasWrittenPermission: 'yes' | 'no' | '';
  ownsAllMasters: boolean;
  complicatedExplanation: string;
  // Step 3
  publisherStatus: PublisherStatus;
  publisherName: string;
  publisherShare: string;
  publisherContractStatus: string;
  selfPublish: boolean;
  pro: PRO;
  proMemberNumber: string;
  // Step 4
  coWriterStatus: CoWriterStatus;
  coWriters: CoWriter[];
  coWritersAgreed: boolean;
  coWriterAgreementFile: string;
  // Step 5
  affirmAccurate: boolean;
  affirmAuthority: boolean;
  affirmConsequences: boolean;
}

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Brazil',
  'Mexico',
  'Other',
];

const STEP_LABELS = [
  'Identity',
  'Label Status',
  'Publishing',
  'Co-Writers',
  'Affirmation',
];

const PREVIOUSLY_SUBMITTED = false;

export default function IndependenceVerifyPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [showWhyTooltip, setShowWhyTooltip] = useState(false);

  const [data, setData] = useState<VerificationData>({
    legalName: '',
    dob: '',
    country: '',
    taxIdLast4: '',
    govIdFile: '',
    labelStatus: '',
    labelName: '',
    contractEnd: '',
    hasWrittenPermission: '',
    ownsAllMasters: false,
    complicatedExplanation: '',
    publisherStatus: '',
    publisherName: '',
    publisherShare: '',
    publisherContractStatus: '',
    selfPublish: false,
    pro: '',
    proMemberNumber: '',
    coWriterStatus: '',
    coWriters: [],
    coWritersAgreed: false,
    coWriterAgreementFile: '',
    affirmAccurate: false,
    affirmAuthority: false,
    affirmConsequences: false,
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-950 text-white">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950 text-white">
        <p className="text-5xl mb-2">🛡️</p>
        <p className="text-gray-400 text-lg">Sign in to start verification</p>
        <Link
          href="/auth/login"
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const update = <K extends keyof VerificationData>(key: K, value: VerificationData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const addCoWriter = () => {
    setData((prev) => ({
      ...prev,
      coWriters: [...prev.coWriters, { id: Date.now(), name: '', split: '' }],
    }));
  };

  const updateCoWriter = (id: number, field: 'name' | 'split', value: string) => {
    setData((prev) => ({
      ...prev,
      coWriters: prev.coWriters.map((cw) =>
        cw.id === id ? { ...cw, [field]: value } : cw
      ),
    }));
  };

  const removeCoWriter = (id: number) => {
    setData((prev) => ({
      ...prev,
      coWriters: prev.coWriters.filter((cw) => cw.id !== id),
    }));
  };

  const handleSubmit = () => {
    if (!data.affirmAccurate || !data.affirmAuthority || !data.affirmConsequences) {
      toast('Please confirm all legal affirmations', 'error');
      return;
    }
    toast('Verification submitted. Review takes 2-3 business days.', 'success');
  };

  const handleSaveDraft = () => {
    toast('Draft saved', 'success');
  };

  const handleSkip = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Back nav */}
        <Link
          href="/dashboard/rights"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6"
        >
          ← Back to Rights Management
        </Link>

        {/* Hero */}
        <div className="text-center mb-8">
          <p className="text-5xl mb-3">🛡️</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Verify Your Independence</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Confirm you have full rights to release your music independently
          </p>
          {PREVIOUSLY_SUBMITTED && (
            <div className="mt-4 inline-block bg-yellow-600/20 text-yellow-300 border border-yellow-600/30 px-4 py-1.5 rounded-full text-sm">
              Verification Status: Pending Review
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const active = step === stepNum;
            const done = step > stepNum;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full transition ${
                      active
                        ? 'bg-red-500 scale-150'
                        : done
                        ? 'bg-emerald-500'
                        : 'bg-gray-700'
                    }`}
                  />
                  <p
                    className={`mt-2 text-xs ${
                      active ? 'text-white font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </p>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div
                    className={`w-8 h-px ${done ? 'bg-emerald-500' : 'bg-gray-700'}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-[#15151f] rounded-xl p-6 md:p-8 mb-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Step 1 — Identity Verification</h2>
                <p className="text-sm text-gray-400">
                  We collect this for tax reporting (1099) and to confirm you're a real person
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Legal Name</label>
                  <input
                    type="text"
                    value={data.legalName}
                    onChange={(e) => update('legalName', e.target.value)}
                    placeholder="As it appears on your ID"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={data.dob}
                    onChange={(e) => update('dob', e.target.value)}
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Country</label>
                  <select
                    value={data.country}
                    onChange={(e) => update('country', e.target.value)}
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    Tax ID / SSN (last 4)
                    <button
                      type="button"
                      onMouseEnter={() => setShowWhyTooltip(true)}
                      onMouseLeave={() => setShowWhyTooltip(false)}
                      className="text-xs text-red-400 hover:text-red-300 relative"
                    >
                      Why we need this
                      {showWhyTooltip && (
                        <span className="absolute z-10 left-0 top-6 w-64 bg-black border border-gray-700 rounded-lg p-3 text-xs text-gray-300 text-left font-normal">
                          Required for IRS 1099 reporting on royalties paid out by OPYNX. Stored encrypted.
                        </span>
                      )}
                    </button>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={data.taxIdLast4}
                    onChange={(e) => update('taxIdLast4', e.target.value)}
                    placeholder="0000"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Government ID Upload</label>
                <div className="border-2 border-dashed border-gray-700 hover:border-red-500 transition rounded-lg p-8 text-center cursor-pointer">
                  <p className="text-3xl mb-2">📄</p>
                  <p className="text-sm font-semibold mb-1">Drag & drop your ID here</p>
                  <p className="text-xs text-gray-500">
                    Passport, driver's license, or national ID • PNG, JPG, PDF • Max 10MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Step 2 — Label Status</h2>
                <p className="text-sm text-gray-400">Are you currently signed to a record label?</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['yes', 'no', 'complicated'] as LabelStatus[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => update('labelStatus', opt)}
                    className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      data.labelStatus === opt
                        ? 'bg-red-600 text-white'
                        : 'bg-brand-950 border border-gray-700 hover:border-red-500'
                    }`}
                  >
                    {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "It's complicated"}
                  </button>
                ))}
              </div>

              {data.labelStatus === 'yes' && (
                <div className="space-y-4 border-t border-gray-800 pt-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Label Name</label>
                    <input
                      type="text"
                      value={data.labelName}
                      onChange={(e) => update('labelName', e.target.value)}
                      className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Contract End Date</label>
                    <input
                      type="date"
                      value={data.contractEnd}
                      onChange={(e) => update('contractEnd', e.target.value)}
                      className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Do you have written permission to release on OPYNX?
                    </label>
                    <div className="flex gap-3">
                      {(['yes', 'no'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => update('hasWrittenPermission', v)}
                          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            data.hasWrittenPermission === v
                              ? 'bg-red-600 text-white'
                              : 'bg-brand-950 border border-gray-700 hover:border-red-500'
                          }`}
                        >
                          {v === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {data.labelStatus === 'no' && (
                <label className="flex items-start gap-3 cursor-pointer border-t border-gray-800 pt-5">
                  <input
                    type="checkbox"
                    checked={data.ownsAllMasters}
                    onChange={(e) => update('ownsAllMasters', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">
                    I am 100% independent and own all my masters
                  </span>
                </label>
              )}

              {data.labelStatus === 'complicated' && (
                <div className="border-t border-gray-800 pt-5">
                  <label className="block text-sm font-semibold mb-2">Explain your situation</label>
                  <textarea
                    value={data.complicatedExplanation}
                    onChange={(e) => update('complicatedExplanation', e.target.value)}
                    rows={5}
                    placeholder="Describe your label situation in detail..."
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Step 3 — Publishing Status</h2>
                <p className="text-sm text-gray-400">Are you affiliated with a publisher?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['yes', 'no'] as PublisherStatus[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => update('publisherStatus', opt)}
                    className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      data.publisherStatus === opt
                        ? 'bg-red-600 text-white'
                        : 'bg-brand-950 border border-gray-700 hover:border-red-500'
                    }`}
                  >
                    {opt === 'yes' ? 'Yes, I have a publisher' : 'No, I self-publish'}
                  </button>
                ))}
              </div>

              {data.publisherStatus === 'yes' && (
                <div className="space-y-4 border-t border-gray-800 pt-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Publisher Name</label>
                    <input
                      type="text"
                      value={data.publisherName}
                      onChange={(e) => update('publisherName', e.target.value)}
                      className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Your Share %</label>
                      <input
                        type="number"
                        max={100}
                        min={0}
                        value={data.publisherShare}
                        onChange={(e) => update('publisherShare', e.target.value)}
                        placeholder="50"
                        className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Contract Status</label>
                      <select
                        value={data.publisherContractStatus}
                        onChange={(e) => update('publisherContractStatus', e.target.value)}
                        className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="">Select status</option>
                        <option value="active">Active</option>
                        <option value="expiring">Expiring soon</option>
                        <option value="expired">Expired</option>
                        <option value="negotiating">In negotiation</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {data.publisherStatus === 'no' && (
                <label className="flex items-start gap-3 cursor-pointer border-t border-gray-800 pt-5">
                  <input
                    type="checkbox"
                    checked={data.selfPublish}
                    onChange={(e) => update('selfPublish', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">I self-publish my music</span>
                </label>
              )}

              <div className="border-t border-gray-800 pt-5">
                <label className="block text-sm font-semibold mb-2">PRO Membership</label>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {(['ASCAP', 'BMI', 'SESAC', 'GMR', 'None'] as PRO[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => update('pro', p)}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                        data.pro === p
                          ? 'bg-red-600 text-white'
                          : 'bg-brand-950 border border-gray-700 hover:border-red-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {data.pro && data.pro !== 'None' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Member Number</label>
                    <input
                      type="text"
                      value={data.proMemberNumber}
                      onChange={(e) => update('proMemberNumber', e.target.value)}
                      placeholder="Your PRO ID"
                      className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Step 4 — Co-Writer Check</h2>
                <p className="text-sm text-gray-400">Do any of your tracks have co-writers?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['yes', 'no'] as CoWriterStatus[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => update('coWriterStatus', opt)}
                    className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      data.coWriterStatus === opt
                        ? 'bg-red-600 text-white'
                        : 'bg-brand-950 border border-gray-700 hover:border-red-500'
                    }`}
                  >
                    {opt === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>

              {data.coWriterStatus === 'yes' && (
                <div className="space-y-4 border-t border-gray-800 pt-5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Co-writers and split %</label>
                    <button
                      onClick={addCoWriter}
                      className="rounded-full bg-red-600 hover:bg-red-500 transition px-3 py-1 text-xs font-semibold"
                    >
                      + Add Co-writer
                    </button>
                  </div>

                  {data.coWriters.length === 0 && (
                    <p className="text-xs text-gray-500 italic">No co-writers added yet</p>
                  )}

                  <div className="space-y-2">
                    {data.coWriters.map((cw) => (
                      <div key={cw.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={cw.name}
                          onChange={(e) => updateCoWriter(cw.id, 'name', e.target.value)}
                          placeholder="Co-writer name"
                          className="flex-1 bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="number"
                          max={100}
                          min={0}
                          value={cw.split}
                          onChange={(e) => updateCoWriter(cw.id, 'split', e.target.value)}
                          placeholder="%"
                          className="w-20 bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <button
                          onClick={() => removeCoWriter(cw.id)}
                          className="text-gray-500 hover:text-red-400 px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.coWritersAgreed}
                      onChange={(e) => update('coWritersAgreed', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-red-600"
                    />
                    <span className="text-sm">
                      I confirm all co-writers have agreed to release on OPYNX
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Upload co-writer agreement (optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-700 hover:border-red-500 transition rounded-lg p-6 text-center cursor-pointer">
                      <p className="text-2xl mb-1">📎</p>
                      <p className="text-xs text-gray-500">PDF, DOCX, PNG, JPG • Max 10MB</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Step 5 — Affirmation & Submit</h2>
                <p className="text-sm text-gray-400">Review your information and confirm</p>
              </div>

              {/* Summary */}
              <div className="bg-brand-950 rounded-lg p-5 space-y-3">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Legal Name</p>
                    <p>{data.legalName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Country</p>
                    <p>{data.country || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Label Status</p>
                    <p className="capitalize">{data.labelStatus || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Publisher</p>
                    <p>
                      {data.publisherStatus === 'yes'
                        ? data.publisherName
                        : data.publisherStatus === 'no'
                        ? 'Self-published'
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">PRO</p>
                    <p>{data.pro || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Co-writers</p>
                    <p>
                      {data.coWriterStatus === 'yes'
                        ? `${data.coWriters.length} listed`
                        : data.coWriterStatus === 'no'
                        ? 'None'
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal affirmations */}
              <div className="space-y-3 border-t border-gray-800 pt-5">
                <h3 className="font-semibold">Legal Affirmations (all required)</h3>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-brand-950">
                  <input
                    type="checkbox"
                    checked={data.affirmAccurate}
                    onChange={(e) => update('affirmAccurate', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">I confirm all information provided is accurate</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-brand-950">
                  <input
                    type="checkbox"
                    checked={data.affirmAuthority}
                    onChange={(e) => update('affirmAuthority', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">I have full legal authority to release this music</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-brand-950">
                  <input
                    type="checkbox"
                    checked={data.affirmConsequences}
                    onChange={(e) => update('affirmConsequences', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">
                    I understand false claims may result in account termination and legal action
                  </span>
                </label>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full rounded-full bg-red-600 hover:bg-red-500 transition px-6 py-4 text-lg font-bold"
              >
                Submit Verification
              </button>
            </div>
          )}
        </div>

        {/* Wizard footer controls */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-full bg-[#1d1d2a] hover:bg-[#26263a] transition px-5 py-2 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              className="rounded-full bg-[#1d1d2a] hover:bg-[#26263a] transition px-5 py-2 text-sm font-semibold"
            >
              Save Draft
            </button>
            {step < 5 && (
              <>
                <button
                  onClick={handleSkip}
                  className="rounded-full bg-[#1d1d2a] hover:bg-[#26263a] transition px-5 py-2 text-sm font-semibold"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="rounded-full bg-red-600 hover:bg-red-500 transition px-5 py-2 text-sm font-semibold"
                >
                  Next →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
