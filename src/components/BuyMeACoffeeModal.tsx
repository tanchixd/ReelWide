import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Coffee,
  Heart,
  ExternalLink,
  X,
  Check,
  QrCode,
  Smartphone,
  Copy,
  Download,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface BuyMeACoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'upi' | 'coffee';
}

// Fixed, immutable creator payment credentials (tamper-proof)
const CREATOR_UPI_ID = 'priyankasinha3162@ybl';
const CREATOR_NAME = 'Tanchi';
const CREATOR_BMAC_SLUG = 'tanchixd';
const CREATOR_BMAC_URL = 'https://www.buymeacoffee.com/tanchixd';

export const BuyMeACoffeeModal: React.FC<BuyMeACoffeeModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'upi',
}) => {
  const [activeTab, setActiveTab] = useState<'upi' | 'coffee'>(defaultTab);

  // Visitor amount selection for UPI
  const [upiAmount, setUpiAmount] = useState<number | 'any' | 'custom'>(49);
  const [customAmountInput, setCustomAmountInput] = useState('100');
  const [qrTheme, setQrTheme] = useState<'phonepe-dark' | 'classic-light'>('phonepe-dark');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Visitor selection for Buy Me a Coffee
  const [selectedCoffeeAmount, setSelectedCoffeeAmount] = useState<number>(5);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clear out any old localStorage overrides left over from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem('reelwide_bmac_username');
      localStorage.removeItem('reelwide_upi_id');
      localStorage.removeItem('reelwide_upi_name');
      localStorage.removeItem('reelwide_custom_upi_qr_image');
      localStorage.removeItem('reelwide_adsense_client_id');
      localStorage.removeItem('reelwide_adsense_slot_id');
    } catch {
      // Ignore
    }
  }, []);

  // Synchronize active tab when modal is opened
  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Compute final effective amount for UPI
  const effectiveUpiAmount =
    upiAmount === 'any'
      ? undefined
      : upiAmount === 'custom'
      ? parseFloat(customAmountInput) || 49
      : upiAmount;

  // Construct official NPCI UPI Deep-Link URI (fixed to creator)
  const upiUri = React.useMemo(() => {
    let uri = `upi://pay?pa=${encodeURIComponent(CREATOR_UPI_ID)}&pn=${encodeURIComponent(
      CREATOR_NAME
    )}&cu=INR&tn=${encodeURIComponent('Support ReelWide Creator Tanchi')}`;
    if (effectiveUpiAmount && effectiveUpiAmount > 0) {
      uri += `&am=${effectiveUpiAmount.toFixed(2)}`;
    }
    return uri;
  }, [effectiveUpiAmount]);

  // Render QR Code on Canvas
  useEffect(() => {
    if (!isOpen || activeTab !== 'upi') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDark = qrTheme === 'phonepe-dark';
    const darkColor = isDark ? '#ffffff' : '#0a0a0a';
    const lightColor = isDark ? '#000000' : '#ffffff';

    QRCode.toCanvas(
      canvas,
      upiUri,
      {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: darkColor,
          light: lightColor,
        },
      },
      (error) => {
        if (error) {
          console.error('Failed to draw UPI QR code:', error);
          return;
        }

        // Draw central PhonePe-style "पे" emblem
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 24;

        // Outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.fill();

        // Inner circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isDark ? '#000000' : '#5f259f';
        ctx.fill();

        // Center PhonePe 'पे' Hindi typography
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('पे', centerX, centerY + 1);
      }
    );
  }, [isOpen, activeTab, upiUri, qrTheme]);

  // Copy creator UPI ID
  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(CREATOR_UPI_ID);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Download QR as PNG
  const handleDownloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Support_Tanchi_UPI_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Unconditionally evaluate early return after all hooks have run
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-5 sm:p-6 text-neutral-100 space-y-5 shadow-2xl relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Close button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-950/40">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Support Tanchi
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Creator
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Help keep ReelWide free, fast, and server-powered
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-coffee-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: UPI QR (Zero Fee) vs Buy Me a Coffee */}
        <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upi')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upi'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>UPI QR (0% Fee)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-200 border border-purple-400/30">
              Instant
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coffee')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'coffee'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-900/40 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Buy Me a Coffee</span>
          </button>
        </div>

        {/* TAB 1: UPI & PHONEPE QR CODE SUPPORT */}
        {activeTab === 'upi' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <span>Verified Direct UPI</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setQrTheme(qrTheme === 'phonepe-dark' ? 'classic-light' : 'phonepe-dark')
                }
                className="text-[11px] text-neutral-400 hover:text-neutral-200 underline cursor-pointer"
              >
                {qrTheme === 'phonepe-dark' ? 'Switch to Light QR' : 'Switch to Dark QR'}
              </button>
            </div>

            {/* QR Card Container */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {/* PhonePe / UPI Header Badge */}
              <div className="flex items-center justify-between w-full mb-3 px-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#5f259f] flex items-center justify-center text-white text-[11px] font-bold">
                    पे
                  </div>
                  <span className="font-bold text-white tracking-wide">PhonePe</span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-[11px] text-neutral-400">BHIM UPI</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant & Verified</span>
                </div>
              </div>

              {/* Dynamic QR Canvas */}
              <div
                className={`p-3 rounded-2xl transition-all shadow-xl ${
                  qrTheme === 'phonepe-dark'
                    ? 'bg-black border border-neutral-800 shadow-purple-950/20'
                    : 'bg-white border border-neutral-300 shadow-neutral-900/40'
                }`}
              >
                <canvas ref={canvasRef} className="rounded-xl block max-w-full" />
              </div>

              {/* Scan with any App notice */}
              <div className="mt-3 text-center space-y-0.5">
                <p className="text-xs font-semibold text-white flex items-center justify-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>Scan with PhonePe, Google Pay, Paytm, or any UPI App</span>
                </p>
                <p className="text-[11px] text-neutral-400 font-mono">
                  Payee: <strong className="text-neutral-200 font-bold">{CREATOR_NAME}</strong> ({CREATOR_UPI_ID})
                </p>
              </div>
            </div>

            {/* Amount Presets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Select Amount to Send:</span>
                <span className="text-[11px] text-neutral-500">100% goes directly to Tanchi</span>
              </label>

              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { value: 49, label: '₹49', sub: 'Chai' },
                  { value: 99, label: '₹99', sub: 'Coffee' },
                  { value: 199, label: '₹199', sub: 'Snack' },
                  { value: 499, label: '₹499', sub: 'Server' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setUpiAmount(item.value)}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      upiAmount === item.value
                        ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold ring-1 ring-purple-500/50'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-neutral-400">{item.sub}</div>
                  </button>
                ))}
              </div>

              {/* Any amount / Custom input option */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setUpiAmount('any')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    upiAmount === 'any'
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold ring-1 ring-purple-500/50'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <span>Any Custom Amount</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-500 text-xs">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={customAmountInput}
                    onChange={(e) => {
                      setCustomAmountInput(e.target.value);
                      setUpiAmount('custom');
                    }}
                    onFocus={() => setUpiAmount('custom')}
                    placeholder="Other amount"
                    className={`w-full bg-neutral-950 border rounded-xl pl-6 pr-3 py-2 text-xs text-white focus:outline-hidden font-mono ${
                      upiAmount === 'custom'
                        ? 'border-purple-500 ring-1 ring-purple-500/50'
                        : 'border-neutral-800'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Buttons: Copy UPI ID & Download QR */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                id="copy-upi-id-btn"
                onClick={handleCopyUpiId}
                className="py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedUpi ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate">Copy UPI ID</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="download-qr-btn"
                onClick={handleDownloadQr}
                className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>Download QR</span>
                  </>
                )}
              </button>
            </div>

            {/* Payee Info & App Compatibility */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span>Verified VPA:</span>
                  <strong className="text-purple-300 font-mono select-all">{CREATOR_UPI_ID}</strong>
                </span>
                <span className="text-neutral-500">Payee: {CREATOR_NAME}</span>
              </div>

              {/* Supported UPI Apps Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] text-neutral-500">
                <span>Compatible with:</span>
                {['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'CRED', 'Amazon Pay'].map((app) => (
                  <span
                    key={app}
                    className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUY ME A COFFEE (INTERNATIONAL) */}
        {activeTab === 'coffee' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Creator Bio Card */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3.5 shadow-inner">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                ☕
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">Tanchi</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    @{CREATOR_BMAC_SLUG}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  Building open tools for creators. Your support funds server time and GPU video rendering!
                </p>
              </div>
            </div>

            {/* Coffee Amount selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">
                Choose Coffee Contribution:
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { amount: 3, icon: '☕', label: '$3', sub: '1 Coffee' },
                  { amount: 5, icon: '☕☕', label: '$5', sub: 'Popular' },
                  { amount: 10, icon: '☕☕☕', label: '$10', sub: 'Generous' },
                ].map((item) => (
                  <button
                    key={item.amount}
                    type="button"
                    onClick={() => setSelectedCoffeeAmount(item.amount)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedCoffeeAmount === item.amount
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <div className="text-base mb-0.5">{item.icon}</div>
                    <div className="text-sm font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-amber-400 font-semibold">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Official Buy Me a Coffee Custom Badge */}
            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800 shadow-inner space-y-2">
              <span className="text-[11px] text-neutral-400 font-medium">Official Creator Widget:</span>
              <a
                href={CREATOR_BMAC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-950/50 rounded-xl overflow-hidden cursor-pointer"
                title="Support Tanchi on Buy Me a Coffee"
              >
                <img
                  src="https://img.buymeacoffee.com/button-api/?text=Support me 💜&emoji=🌺&slug=tanchixd&button_colour=a694ff&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00"
                  alt="Support me 💜 on Buy Me A Coffee"
                  className="h-[50px] w-auto max-w-full"
                  referrerPolicy="no-referrer"
                />
              </a>
            </div>

            {/* Primary Direct Link Button */}
            <a
              href={CREATOR_BMAC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 hover:shadow-purple-900/50 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Coffee className="w-4 h-4 fill-white" />
              <span>Open buymeacoffee.com/{CREATOR_BMAC_SLUG}</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            {/* Destination Verification */}
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Verified Creator Page:</span>
              <a
                href={CREATOR_BMAC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>buymeacoffee.com/{CREATOR_BMAC_SLUG}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
