import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Coffee,
  Heart,
  ExternalLink,
  X,
  Check,
  Edit2,
  QrCode,
  Smartphone,
  Copy,
  Download,
  Upload,
  Trash2,
  IndianRupee,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface BuyMeACoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'upi' | 'coffee';
}

const STORAGE_BMAC_KEY = 'reelwide_bmac_username';
const STORAGE_UPI_ID_KEY = 'reelwide_upi_id';
const STORAGE_UPI_NAME_KEY = 'reelwide_upi_name';
const STORAGE_CUSTOM_QR_IMAGE_KEY = 'reelwide_custom_upi_qr_image';

export const BuyMeACoffeeModal: React.FC<BuyMeACoffeeModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'upi',
}) => {
  const [activeTab, setActiveTab] = useState<'upi' | 'coffee'>(defaultTab);

  // UPI State
  const [upiId, setUpiId] = useState('priyankasinha3162@ybl');
  const [payeeName, setPayeeName] = useState('Tanchi');
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [customUpiInput, setCustomUpiInput] = useState('priyankasinha3162@ybl');
  const [customNameInput, setCustomNameInput] = useState('Tanchi');

  // UPI Amount & QR display
  const [upiAmount, setUpiAmount] = useState<number | 'any' | 'custom'>(49);
  const [customAmountInput, setCustomAmountInput] = useState('100');
  const [qrTheme, setQrTheme] = useState<'phonepe-dark' | 'classic-light'>('phonepe-dark');
  const [customQrImage, setCustomQrImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dynamic-qr' | 'uploaded-screenshot'>('dynamic-qr');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Buy Me a Coffee State
  const [bmacHandle, setBmacHandle] = useState('tanchi');
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [customHandleInput, setCustomHandleInput] = useState('tanchi');
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(5);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const savedBmac = localStorage.getItem(STORAGE_BMAC_KEY);
      if (savedBmac) {
        setBmacHandle(savedBmac);
        setCustomHandleInput(savedBmac);
      }

      const savedUpiId = localStorage.getItem(STORAGE_UPI_ID_KEY);
      if (savedUpiId) {
        setUpiId(savedUpiId);
        setCustomUpiInput(savedUpiId);
      }

      const savedUpiName = localStorage.getItem(STORAGE_UPI_NAME_KEY);
      if (savedUpiName) {
        setPayeeName(savedUpiName);
        setCustomNameInput(savedUpiName);
      }

      const savedCustomQr = localStorage.getItem(STORAGE_CUSTOM_QR_IMAGE_KEY);
      if (savedCustomQr) {
        setCustomQrImage(savedCustomQr);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Compute final effective amount for UPI
  const effectiveUpiAmount =
    upiAmount === 'any'
      ? undefined
      : upiAmount === 'custom'
      ? parseFloat(customAmountInput) || 49
      : upiAmount;

  // Construct official NPCI UPI Deep-Link URI
  const upiUri = React.useMemo(() => {
    const cleanId = upiId.trim();
    const cleanName = payeeName.trim() || 'Tanchi';
    let uri = `upi://pay?pa=${encodeURIComponent(cleanId)}&pn=${encodeURIComponent(cleanName)}&cu=INR&tn=${encodeURIComponent('Support ReelWide Creator')}`;
    if (effectiveUpiAmount && effectiveUpiAmount > 0) {
      uri += `&am=${effectiveUpiAmount.toFixed(2)}`;
    }
    return uri;
  }, [upiId, payeeName, effectiveUpiAmount]);

  // Render QR Code on Canvas whenever parameters change
  useEffect(() => {
    if (!isOpen || activeTab !== 'upi' || viewMode !== 'dynamic-qr') return;

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
        ctx.fillStyle = isDark ? '#000000' : '#5f259f'; // PhonePe iconic purple or black
        ctx.fill();

        // Center PhonePe 'पे' Hindi typography
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('पे', centerX, centerY + 1);
      }
    );
  }, [isOpen, activeTab, viewMode, upiUri, qrTheme]);

  // Copy UPI ID to clipboard
  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
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
      a.download = `ReelWide_UPI_QR_${payeeName || 'Tanchi'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Save UPI Settings
  const handleSaveUpiSettings = () => {
    const cleanId = customUpiInput.trim().replace(/^@/, '');
    const cleanName = customNameInput.trim() || 'Tanchi';
    const finalId = cleanId || 'priyankasinha3162@ybl';

    setUpiId(finalId);
    setPayeeName(cleanName);
    try {
      localStorage.setItem(STORAGE_UPI_ID_KEY, finalId);
      localStorage.setItem(STORAGE_UPI_NAME_KEY, cleanName);
    } catch {
      // Ignore
    }
    setIsEditingUpi(false);
  };

  // Upload Custom QR Code Screenshot (e.g. PhonePe screenshot)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCustomQrImage(base64);
        setViewMode('uploaded-screenshot');
        try {
          localStorage.setItem(STORAGE_CUSTOM_QR_IMAGE_KEY, base64);
        } catch {
          // Ignore
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomQrImage = () => {
    setCustomQrImage(null);
    setViewMode('dynamic-qr');
    try {
      localStorage.removeItem(STORAGE_CUSTOM_QR_IMAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Save BuyMeACoffee Handle
  const handleSaveBmacHandle = () => {
    const clean = customHandleInput
      .trim()
      .replace(/^@/, '')
      .replace(/https?:\/\/(www\.)?buymeacoffee\.com\//, '');
    const finalHandle = clean || 'tanchi';
    setBmacHandle(finalHandle);
    try {
      localStorage.setItem(STORAGE_BMAC_KEY, finalHandle);
    } catch {
      // ignore
    }
    setIsEditingHandle(false);
  };

  if (!isOpen) return null;

  const currentCoffeeUrl = `https://buymeacoffee.com/${bmacHandle}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-5 sm:p-6 text-neutral-100 space-y-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          id="close-support-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Visual */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-amber-600 flex items-center justify-center shadow-lg shadow-purple-900/30 text-white shrink-0">
            {activeTab === 'upi' ? (
              <QrCode className="w-6 h-6 text-purple-200" />
            ) : (
              <Coffee className="w-6 h-6 text-amber-200" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Support the Creator</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Support ReelWide & Tanchi
            </h2>
          </div>
        </div>

        {/* Top Channel Navigation Tabs */}
        <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-semibold">
          <button
            type="button"
            id="tab-upi-qr-btn"
            onClick={() => setActiveTab('upi')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upi'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>UPI QR (PhonePe / GPay)</span>
          </button>

          <button
            type="button"
            id="tab-bmac-btn"
            onClick={() => setActiveTab('coffee')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'coffee'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Buy Me a Coffee</span>
          </button>
        </div>

        {/* TAB 1: UPI & PHONEPE QR CODE SUPPORT */}
        {activeTab === 'upi' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Mode Selector (Dynamic QR vs Custom Uploaded Screenshot) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <span>Display Mode:</span>
                {customQrImage ? (
                  <div className="flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setViewMode('dynamic-qr')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                        viewMode === 'dynamic-qr'
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Dynamic UPI QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('uploaded-screenshot')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                        viewMode === 'uploaded-screenshot'
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      PhonePe Screenshot
                    </button>
                  </div>
                ) : (
                  <span className="text-purple-400 font-semibold">Live Interactive QR</span>
                )}
              </div>

              {viewMode === 'dynamic-qr' && (
                <button
                  type="button"
                  onClick={() =>
                    setQrTheme(qrTheme === 'phonepe-dark' ? 'classic-light' : 'phonepe-dark')
                  }
                  className="text-[11px] text-neutral-400 hover:text-neutral-200 underline cursor-pointer"
                >
                  {qrTheme === 'phonepe-dark' ? 'Switch to Light QR' : 'Switch to Dark QR'}
                </button>
              )}
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

              {/* QR Image or Live Dynamic Canvas */}
              {viewMode === 'uploaded-screenshot' && customQrImage ? (
                <div className="relative group p-2 bg-black rounded-xl border border-neutral-800">
                  <img
                    src={customQrImage}
                    alt="Custom PhonePe UPI QR"
                    className="w-64 h-64 object-contain rounded-lg shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCustomQrImage}
                    title="Remove custom screenshot"
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600 text-neutral-300 hover:text-white transition-all cursor-pointer shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  className={`p-3 rounded-2xl transition-all shadow-xl ${
                    qrTheme === 'phonepe-dark'
                      ? 'bg-black border border-neutral-800 shadow-purple-950/20'
                      : 'bg-white border border-neutral-300 shadow-neutral-900/40'
                  }`}
                >
                  <canvas ref={canvasRef} className="rounded-xl block max-w-full" />
                </div>
              )}

              {/* Payee Details & Scan Instruction */}
              <div className="mt-3 text-center space-y-1">
                <div className="text-xs font-semibold text-white flex items-center justify-center gap-1.5">
                  <span>Payee:</span>
                  <strong className="text-purple-300 font-bold">{payeeName}</strong>
                  {effectiveUpiAmount && (
                    <span className="text-emerald-400 font-mono font-bold">
                      (₹{effectiveUpiAmount})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Scan with <strong className="text-neutral-200">PhonePe</strong>,{' '}
                  <strong className="text-neutral-200">Google Pay</strong>,{' '}
                  <strong className="text-neutral-200">Paytm</strong>, or any UPI app
                </p>
              </div>
            </div>

            {/* Contribution Amount Tier Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-neutral-400 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-purple-400" />
                  <span>Choose Amount (INR ₹)</span>
                </label>
                <span className="text-[11px] text-neutral-500 font-mono">Updates QR in real time</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { amt: 29, label: 'Chai ☕' },
                  { amt: 49, label: 'Coffee ☕' },
                  { amt: 99, label: 'Snack 🥪' },
                  { amt: 199, label: 'Treat 🎬' },
                ].map((item) => (
                  <button
                    key={item.amt}
                    type="button"
                    onClick={() => setUpiAmount(item.amt)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      upiAmount === item.amt
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 ring-1 ring-purple-500/40'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">₹{item.amt}</div>
                    <div className="text-[9px] text-neutral-400 truncate">{item.label}</div>
                  </button>
                ))}

                {/* Any / Custom */}
                <button
                  type="button"
                  onClick={() => setUpiAmount(upiAmount === 'any' ? 49 : 'any')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    upiAmount === 'any'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-xs font-bold text-white">Open</div>
                  <div className="text-[9px] text-neutral-400">Any ₹</div>
                </button>
              </div>

              {/* Custom Amount Field */}
              {upiAmount === 'custom' && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                  <span className="text-xs text-neutral-400 font-mono">Custom ₹:</span>
                  <input
                    type="number"
                    min="1"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-32 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Quick Action Buttons: Deep Link, Copy, Download */}
            <div className="space-y-2 pt-1">
              {/* Primary Mobile Direct Launch CTA */}
              <a
                href={upiUri}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 hover:shadow-purple-900/50 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay via UPI App (PhonePe / GPay / Paytm)</span>
              </a>

              {/* Secondary Actions: Copy UPI ID & Download QR */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="copy-upi-id-btn"
                  onClick={handleCopyUpiId}
                  className="py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedUpi ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied UPI ID!</span>
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
                  className="py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
            </div>

            {/* UPI Settings & Custom Screenshot Upload Footer */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span>UPI ID:</span>
                  <strong className="text-purple-300 font-mono select-all">{upiId}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-neutral-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    title="Upload your PhonePe QR Screenshot image"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Screenshot</span>
                  </button>
                  <span className="text-neutral-600">•</span>
                  {!isEditingUpi && (
                    <button
                      type="button"
                      onClick={() => setIsEditingUpi(true)}
                      className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit ID</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hidden file input for uploading QR Screenshot */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* UPI Custom Editor */}
              {isEditingUpi && (
                <div className="space-y-2 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">
                        UPI VPA / ID (e.g. phone@ybl, name@ibl)
                      </label>
                      <input
                        type="text"
                        value={customUpiInput}
                        onChange={(e) => setCustomUpiInput(e.target.value)}
                        placeholder="yourname@ybl"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Payee Name</label>
                      <input
                        type="text"
                        value={customNameInput}
                        onChange={(e) => setCustomNameInput(e.target.value)}
                        placeholder="Tanchi"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-purple-500 font-sans"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingUpi(false)}
                      className="px-2.5 py-1 rounded-lg text-neutral-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveUpiSettings}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save UPI Info</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Supported UPI Apps Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] text-neutral-500">
                <span>Supported:</span>
                {['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'CRED', 'Amazon Pay'].map((app) => (
                  <span
                    key={app}
                    className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono"
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
            {/* Description */}
            <p className="text-xs text-neutral-300 leading-relaxed">
              ReelWide was created by <strong className="text-white font-semibold">Tanchi</strong> to
              help turn vertical Facebook reels and widescreen movie scenes into high-fidelity landscape
              videos with zero hassle.
            </p>

            {/* Coffee Tier Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400 block">Select Support Level</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedAmount(3)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedAmount === 3
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-lg mb-0.5">☕</div>
                  <div className="text-sm font-bold text-white">$3</div>
                  <div className="text-[10px] text-neutral-400">1 Coffee</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAmount(5)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedAmount === 5
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-lg mb-0.5">☕☕</div>
                  <div className="text-sm font-bold text-white">$5</div>
                  <div className="text-[10px] text-amber-400 font-semibold">Most Popular</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAmount(10)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedAmount === 10
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-lg mb-0.5">☕☕☕</div>
                  <div className="text-sm font-bold text-white">$10</div>
                  <div className="text-[10px] text-neutral-400">Generous</div>
                </button>
              </div>
            </div>

            {/* Primary CTA Button */}
            <a
              href={currentCoffeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 hover:shadow-amber-900/50 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Coffee className="w-4 h-4 fill-neutral-950" />
              <span>Support Tanchi on Buy Me a Coffee</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            {/* Creator Handle Configuration */}
            <div className="pt-2 border-t border-neutral-800/80">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                <span>BuyMeACoffee Page:</span>
                {!isEditingHandle && (
                  <button
                    type="button"
                    onClick={() => setIsEditingHandle(true)}
                    className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Customize handle</span>
                  </button>
                )}
              </div>

              {isEditingHandle ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-500 font-mono">buymeacoffee.com/</span>
                    <input
                      type="text"
                      value={customHandleInput}
                      onChange={(e) => setCustomHandleInput(e.target.value)}
                      placeholder="your_handle"
                      className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveBmacHandle}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    If you have an existing page (e.g. buymeacoffee.com/yourname), enter it here to link
                    your account.
                  </p>
                </div>
              ) : (
                <p className="text-xs font-mono text-neutral-300">
                  buymeacoffee.com/<span className="text-amber-400 font-semibold">{bmacHandle}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
