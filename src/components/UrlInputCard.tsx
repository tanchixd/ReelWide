import React, { useState, useRef } from 'react';
import {
  Link2,
  Clipboard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Video,
  Check,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { FacebookVideoInfo } from '../types.js';

interface UrlInputCardProps {
  onVideoLoaded: (video: FacebookVideoInfo) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export const UrlInputCard: React.FC<UrlInputCardProps> = ({
  onVideoLoaded,
  isLoading,
  setIsLoading,
  errorMessage,
  setErrorMessage,
}) => {
  const [url, setUrl] = useState('');
  const [isUrlValid, setIsUrlValid] = useState<boolean | null>(null);
  const [validationHint, setValidationHint] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [isPastedSuccess, setIsPastedSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (val: string) => {
    if (!val.trim()) {
      setIsUrlValid(null);
      setValidationHint(null);
      return;
    }

    const lower = val.toLowerCase();
    // Non-Facebook check
    if (
      lower.includes('instagram.com') ||
      lower.includes('tiktok.com') ||
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('twitter.com') ||
      lower.includes('x.com')
    ) {
      setIsUrlValid(false);
      setValidationHint('ReelWide ONLY supports Facebook Reel and public Facebook video URLs.');
      return;
    }

    if (lower.includes('facebook.com') || lower.includes('fb.watch')) {
      setIsUrlValid(true);
      setValidationHint('Valid Facebook link format detected');
    } else {
      setIsUrlValid(null);
      setValidationHint(null);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setErrorMessage(null);
    setPasteNotice(null);
    validateUrl(val);
  };

  const handleClear = () => {
    setUrl('');
    setIsUrlValid(null);
    setValidationHint(null);
    setPasteNotice(null);
    setErrorMessage(null);
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    setPasteNotice(null);
    inputRef.current?.focus();

    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const trimmed = text.trim();
          setUrl(trimmed);
          validateUrl(trimmed);
          setErrorMessage(null);
          setIsPastedSuccess(true);
          setTimeout(() => setIsPastedSuccess(false), 2500);
          return;
        }
      }
    } catch {
      // In iframes, navigator.clipboard.readText() is restricted by browser security policies
    }

    // Fallback if browser clipboard reading is blocked in iframe:
    // Focus the input, highlight it, and provide instant visual instructions
    inputRef.current?.focus();
    inputRef.current?.select();
    setPasteNotice('Browser restricted clipboard access in preview. Press Ctrl+V (or ⌘V) to paste.');
    setTimeout(() => setPasteNotice(null), 6000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setErrorMessage('Please enter a Facebook Reel or public video URL.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPasteNotice(null);

    try {
      const resp = await fetch('/api/fetch-facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to retrieve Facebook video.');
      }

      onVideoLoaded(data.video);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not access this Facebook video.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-medium mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          Dedicated Facebook Video Processing Pipeline
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Turn Facebook Reels Into <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Landscape Videos</span>
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Paste a Facebook video URL, choose your ratio, and create a landscape version in seconds.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="max-w-3xl mx-auto bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <label htmlFor="fb-url-input" className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-400" />
            Paste Facebook URL
          </label>
          <span className="text-xs text-neutral-500 font-mono">
            facebook.com/reel/ • fb.watch
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              id="fb-url-input"
              type="text"
              value={url}
              onChange={handleUrlChange}
              onPaste={() => {
                setIsPastedSuccess(true);
                setPasteNotice(null);
                setTimeout(() => setIsPastedSuccess(false), 2000);
              }}
              placeholder="https://www.facebook.com/reel/..."
              disabled={isLoading}
              autoFocus
              className={`w-full bg-neutral-950 border ${
                isUrlValid === false
                  ? 'border-rose-500/80 focus:ring-rose-500/30'
                  : isUrlValid === true
                  ? 'border-emerald-500/60 focus:ring-emerald-500/30'
                  : 'border-neutral-700/80 focus:ring-blue-500/40'
              } text-neutral-100 placeholder-neutral-500 text-sm sm:text-base rounded-xl pl-4 pr-28 sm:pr-32 py-3.5 transition-all outline-none focus:ring-2`}
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {url && (
                <button
                  type="button"
                  id="clear-url-btn"
                  onClick={handleClear}
                  title="Clear input"
                  className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                id="paste-url-btn"
                onClick={handlePaste}
                title="Paste Facebook link from clipboard"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isPastedSuccess
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                    : 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 active:scale-95'
                }`}
              >
                {isPastedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pasted!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5 text-blue-400" />
                    <span>Paste</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Paste guidance banner if iframe blocks clipboard reading */}
          {pasteNotice && (
            <div className="text-xs px-3 py-2 rounded-lg bg-blue-950/50 border border-blue-800/50 text-blue-200 flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <CornerDownLeft className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{pasteNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setPasteNotice(null)}
                className="text-blue-300 hover:text-white text-xs font-mono"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Real-time hint or validation message */}
          {validationHint && (
            <div
              className={`text-xs flex items-center gap-1.5 ${
                isUrlValid === false ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isUrlValid === false ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{validationHint}</span>
            </div>
          )}

          {/* Submit action button */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              id="fetch-video-btn"
              disabled={isLoading || !url.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Checking Facebook URL...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 text-white" />
                  <span>Load Facebook Reel</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Friendly Error Display */}
        {errorMessage && (
          <div className="mt-5 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Unable to retrieve video</p>
              <p className="text-xs text-rose-200/90 leading-relaxed">{errorMessage}</p>
              <p className="text-[11px] text-neutral-400 pt-1">
                Tip: ReelWide processes public Facebook Reels and public Facebook videos. Make sure the video is set to public visibility and can be viewed without logging in.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
