import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Type,
  Sliders,
  Eye,
  Globe,
  Smartphone,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code2,
  Palette,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  FaviconOptions,
  GeneratedFaviconAsset,
  GenerationResult,
  generateFaviconPackage
} from '../../utils/faviconGenerator';
import { recordToolConversion } from '../../utils/activityTracker';

interface FaviconGeneratorToolProps {
  onBack: () => void;
  initialFile?: File | null;
  initialFiles?: File[] | null;
}

type InputSourceType = 'upload' | 'text' | 'preset';

const PRESET_ICONS = [
  { id: 'sparkle', label: 'Sparkle AI', emoji: '✨', bg: '#2563eb', color: '#ffffff' },
  { id: 'rocket', label: 'Rocket', emoji: '🚀', bg: '#4f46e5', color: '#ffffff' },
  { id: 'document', label: 'Doc & PDF', emoji: '📄', bg: '#dc2626', color: '#ffffff' },
  { id: 'cloud', label: 'Cloud SaaS', emoji: '☁️', bg: '#0284c7', color: '#ffffff' },
  { id: 'shield', label: 'Security', emoji: '🛡️', bg: '#059669', color: '#ffffff' },
  { id: 'chart', label: 'Analytics', emoji: '📊', bg: '#7c3aed', color: '#ffffff' },
  { id: 'code', label: 'Dev & Code', emoji: '⚡', bg: '#ea580c', color: '#ffffff' },
  { id: 'star', label: 'Star Brand', emoji: '⭐', bg: '#d97706', color: '#ffffff' },
  { id: 'leaf', label: 'Eco & Bio', emoji: '🌱', bg: '#16a34a', color: '#ffffff' },
  { id: 'globe', label: 'Global Web', emoji: '🌐', bg: '#0891b2', color: '#ffffff' },
  { id: 'fire', label: 'Fire & Trend', emoji: '🔥', bg: '#e11d48', color: '#ffffff' },
  { id: 'heart', label: 'Health & Care', emoji: '❤️', bg: '#db2777', color: '#ffffff' }
];

const PRESET_COLORS = [
  { label: 'Transparent', value: 'transparent' },
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Crimson Red', value: '#dc2626' },
  { label: 'Emerald Green', value: '#16a34a' },
  { label: 'Sunset Amber', value: '#d97706' },
  { label: 'Cyan Ocean', value: '#0891b2' },
  { label: 'Dark Slate', value: '#0f172a' },
  { label: 'Clean White', value: '#ffffff' }
];

const FONT_FAMILIES = [
  { label: 'Sans-Serif (Modern Bold)', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Monospace (Tech)', value: 'ui-monospace, monospace' },
  { label: 'Serif (Editorial & Luxury)', value: 'Georgia, serif' },
  { label: 'Impact (Heavy Display)', value: 'Impact, sans-serif' },
  { label: 'Rounded Geometric', value: 'Trebuchet MS, sans-serif' }
];

export const FaviconGeneratorTool: React.FC<FaviconGeneratorToolProps> = ({
  onBack,
  initialFile,
  initialFiles
}) => {
  // Source selection state
  const [sourceType, setSourceType] = useState<InputSourceType>('upload');
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('my-icon.png');
  const [isDragging, setIsDragging] = useState(false);

  // Text & Emoji Generator state
  const [iconText, setIconText] = useState('P');
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
  const [fontSizePercent, setFontSizePercent] = useState(70);
  const [textColor, setTextColor] = useState('#ffffff');
  const [isBold, setIsBold] = useState(true);

  // Styling & Options state
  const [shape, setShape] = useState<'square' | 'rounded' | 'squircle' | 'circle'>('rounded');
  const [backgroundColor, setBackgroundColor] = useState('#2563eb');
  const [padding, setPadding] = useState(12);
  const [siteName, setSiteName] = useState('My Awesome Site');
  const [siteUrl, setSiteUrl] = useState('https://mywebsite.com');
  const [siteDescription, setSiteDescription] = useState('Fast, modern web app and services built for speed.');
  const [themeColor, setThemeColor] = useState('#2563eb');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'assets' | 'html' | 'guidelines'>('preview');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle Initial File
  useEffect(() => {
    const file = initialFile || (initialFiles && initialFiles[0]);
    if (file && file.type.startsWith('image/')) {
      handleFileLoad(file);
    }
  }, [initialFile, initialFiles]);

  // Handle loading an image file
  const handleFileLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImageSrc(e.target.result as string);
        setUploadedFileName(file.name);
        setSourceType('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.name.endsWith('.svg') || file.name.endsWith('.ico')) {
        handleFileLoad(file);
      }
    }
  };

  // Clipboard Paste Support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          handleFileLoad(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Helper: Create an Image Source from Text/Emoji
  const renderTextToCanvas = useCallback((): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.clearRect(0, 0, 512, 512);

    // Font calculation
    const calcFontSize = Math.round((512 * fontSizePercent) / 100);
    const weight = isBold ? 'bold ' : '';
    ctx.font = `${weight}${calcFontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;

    // Draw text in exact center
    ctx.fillText(iconText || 'A', 256, 256 + calcFontSize * 0.05);

    return canvas;
  }, [iconText, fontFamily, fontSizePercent, isBold, textColor]);

  // Main Generator Function
  const runGeneration = useCallback(async () => {
    setIsGenerating(true);
    try {
      let sourceElement: CanvasImageSource;

      if (sourceType === 'upload' && uploadedImageSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = uploadedImageSrc;
        });
        sourceElement = img;
      } else if (sourceType === 'preset' && uploadedImageSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load preset'));
          img.src = uploadedImageSrc;
        });
        sourceElement = img;
      } else {
        // Render from Text / Emoji Canvas
        sourceElement = renderTextToCanvas();
      }

      const options: FaviconOptions = {
        padding,
        backgroundColor,
        shape,
        siteName: siteName.trim() || 'My Website',
        themeColor: themeColor || '#2563eb'
      };

      const result = await generateFaviconPackage(sourceElement, options);
      setGenerationResult(result);
    } catch (err) {
      console.error('Favicon generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [
    sourceType,
    uploadedImageSrc,
    renderTextToCanvas,
    padding,
    backgroundColor,
    shape,
    siteName,
    themeColor
  ]);

  // Auto-generate on changes
  useEffect(() => {
    runGeneration();
  }, [runGeneration]);

  // Handle Preset selection
  const handleSelectPreset = (preset: (typeof PRESET_ICONS)[0]) => {
    setIconText(preset.emoji);
    setBackgroundColor(preset.bg);
    setTextColor(preset.color);
    setThemeColor(preset.bg);
    setSourceType('text');
  };

  // Copy code helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Download entire ZIP
  const handleDownloadZip = () => {
    if (!generationResult) return;
    const url = URL.createObjectURL(generationResult.zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favicon-package-${siteName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'website'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    recordToolConversion('favicon-generator', generationResult.zipBlob.size, 'Favicon & SEO Icon Package ZIP');
  };

  // Download individual asset
  const handleDownloadAsset = (asset: GeneratedFaviconAsset) => {
    const url = URL.createObjectURL(asset.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const favicon48 = generationResult?.assets.find((a) => a.fileName === 'favicon-48x48.png') || generationResult?.assets[0];
  const faviconIco = generationResult?.assets.find((a) => a.fileName === 'favicon.ico');
  const appleTouchIcon = generationResult?.assets.find((a) => a.fileName === 'apple-touch-icon.png');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80">
              <Sparkles className="w-3.5 h-3.5" />
              SEO & Google Search Compliant
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Multi-Size .ICO + PNG + SVG
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Favicon & App Icon Generator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Generate pixel-perfect multi-size favicons (16px to 512px), multi-layer binary <code className="text-blue-600 dark:text-blue-400 font-mono">favicon.ico</code>, Apple Touch icons, Web App Manifests, and SVG icons tested against Google Search Favicon Guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {generationResult && (
            <button
              onClick={handleDownloadZip}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download All (.ZIP)
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Left Controls (1/3) + Right Previews & Exports (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input Source & Customization Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Icon Source Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                1. Choose Icon Source
              </h2>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setSourceType('upload')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  sourceType === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setSourceType('text')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  sourceType === 'text'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                Text / Emoji
              </button>
              <button
                type="button"
                onClick={() => setSourceType('preset')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  sourceType === 'preset'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Presets
              </button>
            </div>

            {/* TAB CONTENT 1: UPLOAD */}
            {sourceType === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/bmp,image/x-icon"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileLoad(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {uploadedImageSrc ? 'Click or drag to replace image' : 'Drag & drop image or click to browse'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Supports PNG, JPG, SVG, WEBP, GIF, BMP, ICO (or Paste Ctrl+V)
                </p>
                {uploadedImageSrc && (
                  <div className="mt-2 flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="truncate max-w-[180px] font-medium">{uploadedFileName}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: TEXT & EMOJI */}
            {sourceType === 'text' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Letter, Acronym, or Emoji
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={iconText}
                    onChange={(e) => setIconText(e.target.value)}
                    placeholder="e.g. P, 🚀, AI"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                      <span>Font Scale</span>
                      <span className="font-semibold">{fontSizePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={95}
                      value={fontSizePercent}
                      onChange={(e) => setFontSizePercent(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBold(!isBold)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                      isBold
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Bold
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: PRESETS */}
            {sourceType === 'preset' && (
              <div className="grid grid-cols-4 gap-2">
                {PRESET_ICONS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:border-blue-500 dark:hover:border-blue-400 transition flex flex-col items-center gap-1 text-center group cursor-pointer"
                  >
                    <span className="text-2xl group-hover:scale-110 transition">{preset.emoji}</span>
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Styling, Shape & Color Customization */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              2. Shape & Styling
            </h2>

            {/* Shape Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Icon Mask / Shape
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'square', label: 'Square' },
                  { id: 'rounded', label: 'Rounded' },
                  { id: 'squircle', label: 'Squircle' },
                  { id: 'circle', label: 'Circle' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium transition border ${
                      shape === s.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color Palette */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Background Fill
                </label>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {backgroundColor === 'transparent' ? 'Transparent' : backgroundColor}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      setBackgroundColor(c.value);
                      if (c.value !== 'transparent') setThemeColor(c.value);
                    }}
                    className={`w-6 h-6 rounded-lg border transition ${
                      backgroundColor === c.value
                        ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    style={{
                      background:
                        c.value === 'transparent'
                          ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px'
                          : c.value
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor === 'transparent' ? '#2563eb' : backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    setThemeColor(e.target.value);
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="e.g. #2563eb or transparent"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Padding / Inset Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                <span>Inner Padding / Margins</span>
                <span className="font-semibold">{padding}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Recommended 10-15% padding prevents Google Search and mobile launcher circular masks from clipping edge graphics.
              </p>
            </div>
          </div>

          {/* Card 3: SEO Site Metadata & Manifest Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              3. SEO & Manifest Metadata
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website / Brand Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. PDF Editfy"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Theme Color
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website URL (for preview)
                </label>
                <input
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://mywebsite.com"
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Previews, SEO Compliance Audit & Asset Export */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[
                { id: 'preview', label: 'Live SERP & Previews', icon: Eye },
                { id: 'assets', label: 'Multi-Size Icons (8)', icon: Layers },
                { id: 'html', label: 'HTML Embed Code', icon: Code2 },
                { id: 'guidelines', label: 'Google SEO Guide', icon: ShieldCheck }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'preview' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    previewTheme === 'light'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    previewTheme === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Dark
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: LIVE PREVIEWS */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              
              {/* Preview 1: Google Search Engine Result (Desktop & Mobile) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Google Search SERP Favicon Simulation
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                    48x48 Multiples Verified
                  </span>
                </div>

                {/* Google Mobile Search Snippet Box */}
                <div
                  className={`p-4 rounded-xl border transition ${
                    previewTheme === 'dark'
                      ? 'bg-[#202124] border-[#303134] text-[#bdc1c6]'
                      : 'bg-[#ffffff] border-[#dadce0] text-[#4d5156]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* The Favicon in Search Result */}
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-black/5 dark:border-white/10">
                      {favicon48 && (
                        <img
                          src={favicon48.dataUrl}
                          alt="SERP Favicon"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {siteName || 'My Website'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {siteUrl || 'https://mywebsite.com'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <div
                      className={`text-base font-semibold truncate hover:underline cursor-pointer ${
                        previewTheme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a0dab]'
                      }`}
                    >
                      {siteName} – Fast, Secure & Free Online Tools
                    </div>
                    <p className="text-xs mt-1 leading-relaxed line-clamp-2">
                      {siteDescription} Comprehensive web platform optimized for fast client-side performance, data privacy, and instant results with zero signup required.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview 2: Browser Tabs (Chrome & Safari) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Browser Tab Simulation
                </h3>

                <div
                  className={`rounded-xl border overflow-hidden transition ${
                    previewTheme === 'dark'
                      ? 'bg-[#1f1f1f] border-slate-700 text-slate-200'
                      : 'bg-[#dee1e6] border-slate-300 text-slate-800'
                  }`}
                >
                  {/* Chrome Tab Bar */}
                  <div className="flex items-center gap-2 px-3 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>

                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg max-w-[220px] transition text-xs font-medium shadow-xs ${
                        previewTheme === 'dark' ? 'bg-[#2b2b2b]' : 'bg-white'
                      }`}
                    >
                      {favicon48 && (
                        <img
                          src={favicon48.dataUrl}
                          alt="Tab icon"
                          className="w-4 h-4 rounded-xs shrink-0 object-contain"
                        />
                      )}
                      <span className="truncate">{siteName || 'My Website'}</span>
                    </div>

                    <div className="text-xs text-slate-400 px-2">+</div>
                  </div>

                  {/* Address Bar */}
                  <div
                    className={`p-2.5 border-t flex items-center gap-2 ${
                      previewTheme === 'dark' ? 'bg-[#2b2b2b] border-[#383838]' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="text-emerald-500">🔒</span>
                      <span>{siteUrl || 'https://mywebsite.com'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview 3: Mobile Home Screen Bookmark & PWA Tile */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  iOS & Android Home Screen Icon Preview
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Apple iOS Icon */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center text-center gap-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Apple iOS Safari (180x180)
                    </div>
                    <div className="w-16 h-16 rounded-[14px] overflow-hidden shadow-md border border-black/10 flex items-center justify-center bg-white">
                      {appleTouchIcon && (
                        <img
                          src={appleTouchIcon.dataUrl}
                          alt="Apple Touch Icon"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {siteName || 'My App'}
                    </span>
                  </div>

                  {/* Android Chrome PWA Icon */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center text-center gap-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Android PWA (192x192)
                    </div>
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border border-black/10 flex items-center justify-center bg-white">
                      {favicon48 && (
                        <img
                          src={favicon48.dataUrl}
                          alt="Android Icon"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {siteName || 'My App'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-SIZE ASSETS GRID */}
          {activeTab === 'assets' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Generated Multi-Size Favicon Assets
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Download individual icon formats or use the master ZIP download above.
                  </p>
                </div>
                <button
                  onClick={handleDownloadZip}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  Download All (.ZIP)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {generationResult?.assets.map((asset) => (
                  <div
                    key={asset.fileName}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 hover:border-blue-400 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={asset.dataUrl}
                          alt={asset.fileName}
                          className="max-w-[32px] max-h-[32px] object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {asset.fileName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {asset.label} ({asset.size}x{asset.size}px)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadAsset(asset)}
                      title="Download file"
                      className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition border border-slate-200 dark:border-slate-600 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HTML CODE EMBED */}
          {activeTab === 'html' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    HTML &lt;head&gt; Code Snippet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste this snippet inside the <code className="text-blue-600">&lt;head&gt;</code> tag of your website.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(generationResult?.htmlSnippet || '', 'htmlSnippet')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition border border-blue-200 dark:border-blue-800"
                >
                  {copiedKey === 'htmlSnippet' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy HTML Code
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {generationResult?.htmlSnippet}
              </pre>

              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  Quick Placement Instructions:
                </div>
                <p>
                  • <strong>React / Vite:</strong> Place files in <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">/public</code> and paste HTML into <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">index.html</code>.
                </p>
                <p>
                  • <strong>Next.js (App Router):</strong> Place <code className="font-mono">icon.png</code> and <code className="font-mono">apple-icon.png</code> directly in <code className="font-mono">app/</code> or public folder.
                </p>
                <p>
                  • <strong>WordPress / Shopify:</strong> Upload <code className="font-mono">favicon-48x48.png</code> and <code className="font-mono">favicon.ico</code> via Site Identity / Theme Customizer.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE FAVICON SEO COMPLIANCE GUIDELINES */}
          {activeTab === 'guidelines' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Google Search Favicon Guidelines Checklist
              </h3>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 dark:text-emerald-300">1. Dimension in Multiples of 48px:</strong>
                    <p className="mt-0.5 text-emerald-900 dark:text-emerald-400">
                      Google requires favicons to be square and a multiple of 48px (e.g. 48x48, 96x96, 144x144, 192x192). This tool automatically outputs exact 48px, 96px, 144px, and 192px PNG files.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 dark:text-emerald-300">2. Crawlable by Googlebot-Image:</strong>
                    <p className="mt-0.5 text-emerald-900 dark:text-emerald-400">
                      Ensure your <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 rounded">robots.txt</code> does not disallow <code className="font-mono">Googlebot-Image</code> from accessing your favicon files.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 dark:text-emerald-300">3. High Contrast & Inset Margins:</strong>
                    <p className="mt-0.5 text-emerald-900 dark:text-emerald-400">
                      Ensure your brand emblem has clear contrast against both white and dark search backdrops. Use 10-15% padding so circular masks do not clip the edges.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-950 dark:text-blue-300">How to force Google to refresh your favicon:</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1 text-blue-900 dark:text-blue-400">
                      <li>Upload the generated assets to your root directory.</li>
                      <li>Open <strong>Google Search Console</strong>.</li>
                      <li>Enter your root URL in the URL Inspection tool.</li>
                      <li>Click <strong>Request Indexing</strong>. Google will re-fetch your favicon on its next crawl cycle.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaviconGeneratorTool;
