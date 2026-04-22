'use client';

import { useState } from 'react';
import { useUploadThing } from '@/lib/uploadthing-client';
import { useToast } from '@/app/components/Toast';

export function CoverImageField({
  label = 'Cover Art',
  hint = 'Apple recommends 3000×3000px JPG/PNG, ≤8MB',
  value,
  onChange,
}: {
  label?: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  const { startUpload, isUploading } = useUploadThing('imageUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) {
        onChange(url);
        setError('');
        toast('Image uploaded', 'success');
      } else {
        setError('Upload completed but no URL returned. Try paste-URL mode.');
      }
    },
    onUploadError: (err) => {
      const msg = err.message || 'Upload failed';
      setError(msg);
      toast(msg, 'error');
    },
  });

  const handleFile = async (f: File | null) => {
    setError('');
    setFile(f);
    if (!f) {
      onChange('');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      const msg = `File is ${(f.size / 1024 / 1024).toFixed(1)}MB — max 8MB. Try paste-URL mode.`;
      setError(msg);
      toast(msg, 'error');
      return;
    }
    if (!f.type.startsWith('image/')) {
      const msg = `File type "${f.type || 'unknown'}" is not an image`;
      setError(msg);
      toast(msg, 'error');
      return;
    }
    try {
      const res = await startUpload([f]);
      if (!res || res.length === 0) {
        setError('Upload returned no result. Try paste-URL mode.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Upload threw an error';
      setError(msg);
      toast(msg, 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-gray-400">{label}</label>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-1 rounded ${mode === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-1 rounded ${mode === 'url' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Paste URL
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-brand-800/30"
            onError={() => setError('Image URL did not load — check the link')}
          />
        )}
        <div className="flex-1 space-y-1">
          {mode === 'upload' ? (
            <>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                disabled={isUploading}
                className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-600 file:text-white file:font-semibold hover:file:bg-brand-500 disabled:opacity-50"
              />
              {file && (
                <p className={`text-xs ${error ? 'text-red-400' : value ? 'text-green-400' : 'text-gray-500'}`}>
                  {file.name} · {(file.size / 1024).toFixed(0)} KB
                  {isUploading && ' · uploading...'}
                  {value && !error && ' · uploaded ✓'}
                  {error && ` · ${error}`}
                </p>
              )}
            </>
          ) : (
            <input
              type="url"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setError('');
              }}
              placeholder="https://your-host.com/cover.jpg"
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-2 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
            />
          )}
          <p className="text-xs text-gray-500">{hint}</p>
        </div>
      </div>
    </div>
  );
}
