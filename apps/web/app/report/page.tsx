'use client';

import { useState } from 'react';
import Link from 'next/link';

type ContentType = '' | 'track' | 'event' | 'user' | 'listing' | 'comment';
type Reason = '' | 'spam' | 'copyright' | 'harassment' | 'inappropriate' | 'fraud' | 'other';

export default function ReportPage() {
  const [contentType, setContentType] = useState<ContentType>('');
  const [contentUrl, setContentUrl] = useState('');
  const [reason, setReason] = useState<Reason>('');
  const [description, setDescription] = useState('');
  const [triedResolve, setTriedResolve] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons: { id: Reason; label: string }[] = [
    { id: 'spam', label: 'Spam' },
    { id: 'copyright', label: 'Copyright infringement' },
    { id: 'harassment', label: 'Harassment' },
    { id: 'inappropriate', label: 'Inappropriate content' },
    { id: 'fraud', label: 'Fraud / scam' },
    { id: 'other', label: 'Other' },
  ];

  const canSubmit = contentType && contentUrl && reason && (reason !== 'other' || description.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Back nav */}
        <Link href="/help" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Help
        </Link>

        <h1 className="text-3xl font-bold mb-2">Report Content</h1>
        <p className="text-gray-400 mb-8">Help us keep OPYNX safe. All reports are reviewed by our team.</p>

        {submitted ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">&#9989;</p>
            <h2 className="text-2xl font-bold mb-2">Report Submitted</h2>
            <p className="text-gray-400 mb-6">Thank you for helping keep our community safe. We&apos;ll review your report within 24-48 hours.</p>
            <button
              onClick={() => {
                setSubmitted(false);
                setContentType('');
                setContentUrl('');
                setReason('');
                setDescription('');
                setTriedResolve(false);
              }}
              className="px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 transition"
            >
              Submit Another Report
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full px-4 py-3 rounded-xl bg-[#15151f] border border-gray-800 text-white focus:border-red-600 focus:outline-none transition appearance-none"
              >
                <option value="">Select content type...</option>
                <option value="track">Track</option>
                <option value="event">Event</option>
                <option value="user">User</option>
                <option value="listing">Listing</option>
                <option value="comment">Comment</option>
              </select>
            </div>

            {/* Content URL */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Content URL or ID</label>
              <input
                type="text"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://opynx.com/track/... or paste the content ID"
                className="w-full px-4 py-3 rounded-xl bg-[#15151f] border border-gray-800 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Reason for Report</label>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="reason"
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="accent-red-600"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Copyright link */}
            {reason === 'copyright' && (
              <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4">
                <p className="text-sm text-red-300">
                  For copyright-specific issues, please also file a formal DMCA takedown notice.
                </p>
                <Link href="/dmca" className="inline-block mt-2 text-red-400 text-sm font-semibold hover:text-red-300 transition">
                  Go to DMCA Form &rarr;
                </Link>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Detailed Description {reason === 'other' && <span className="text-red-400">*</span>}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details about the issue..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-[#15151f] border border-gray-800 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition resize-none"
              />
              {reason === 'other' && !description.trim() && (
                <p className="text-xs text-red-400 mt-1">Description is required when selecting &quot;Other&quot;</p>
              )}
            </div>

            {/* Evidence upload placeholder */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Evidence (Screenshots)</label>
              <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center hover:border-gray-700 transition cursor-pointer">
                <p className="text-3xl mb-2">&#128247;</p>
                <p className="text-sm text-gray-400">Drag & drop screenshots here, or click to browse</p>
                <p className="text-xs text-gray-600 mt-1">PNG, JPG, or GIF up to 10MB each</p>
              </div>
            </div>

            {/* Already tried to resolve */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={triedResolve}
                onChange={(e) => setTriedResolve(e.target.checked)}
                className="accent-red-600 mt-0.5"
              />
              <span className="text-sm text-gray-300">I have already tried to resolve this issue directly</span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Report
            </button>

            {/* What happens next */}
            <div className="bg-[#15151f] border border-gray-800 rounded-2xl p-6 mt-8">
              <h3 className="font-bold mb-3">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <p className="text-sm text-gray-400">Our trust & safety team reviews your report within <span className="text-white">24-48 hours</span>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <p className="text-sm text-gray-400">If the content violates our guidelines, it will be removed or restricted.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <p className="text-sm text-gray-400">You&apos;ll receive a <span className="text-white">notification</span> about the outcome of your report.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <p className="text-sm text-gray-400">Repeat offenders face account suspension or permanent bans.</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <Link href="/dmca" className="text-red-400 text-sm font-semibold hover:text-red-300 transition">
                  For copyright-specific issues, visit our DMCA page &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg">
            Report submitted successfully. We&apos;ll review it within 24-48 hours.
          </div>
        )}
      </div>
    </div>
  );
}
