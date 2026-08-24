import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Link,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  ExternalLink,
  Code2,
  QrCode,
  FileCode,
  Sparkles,
  RefreshCw,
  Sliders,
  Maximize2,
  Trash2,
  Eye,
  FileText,
  Layers,
  ArrowRight,
  HelpCircle,
  Globe,
  Share2,
  CheckCircle2,
  Zap,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import { formatBytes } from '../../utils/imageProcessor';
import { recordToolConversion } from '../../utils/activityTracker';

interface ImageToUrlToolProps {
  onBack: () => void;
  initialFiles?: File[] | null;
  initialFile?: File | null;
}

export interface ConvertedImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  dataUrl: string;
  blobUrl: string;
  base64Only: string;
  width: number;
  height: number;
  mimeType: string;
  charCount: number;
  qrCodeUrl?: string;
  isCustomUrl?: boolean;
}

export const ImageToUrlTool: React.FC<ImageToUrlToolProps> = ({
  onBack,
  initialFiles,
  initialFile,
}) => {
  const [items, setItems] = useState<ConvertedImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dataurl' | 'base64' | 'html' | 'css' | 'react' | 'markdown' | 'blob' | 'qrcode'>('dataurl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Conversion options
  const [outputFormat, setOutputFormat] = useState<'original' | 'image/png' | 'image/jpeg' | 'image/webp'>('original');
  const [quality, setQuality] = useState<number>(90); // 10-100
  const [maxDimension, setMaxDimension] = useState<number | 'original'>('original');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Online URL fetch input
  const [remoteUrlInput, setRemoteUrlInput] = useState<string>('');
  const [isFetchingRemote, setIsFetchingRemote] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const copyToClipboard = (text: string, keyName: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(keyName);
      showToast(label);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    });
  };

  // Convert File to ConvertedImageItem
  const processImageFile = useCallback(
    async (file: File): Promise<ConvertedImageItem | null> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const rawDataUrl = e.target?.result as string;
          if (!rawDataUrl) {
            resolve(null);
            return;
          }

          // If SVG and output format is original, keep raw text/dataUrl
          if (file.type === 'image/svg+xml' && outputFormat === 'original') {
            const blobUrl = URL.createObjectURL(file);
            const base64Only = rawDataUrl.split(',')[1] || '';

            // Generate QR code
            let qrCodeUrl = '';
            try {
              qrCodeUrl = await QRCode.toDataURL(rawDataUrl.slice(0, 1500) || blobUrl, {
                width: 256,
                margin: 1,
                color: { dark: '#0f172a', light: '#ffffff' },
              });
            } catch (err) {
              // Ignore QR size overflow
            }

            resolve({
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              file,
              name: file.name,
              originalSize: file.size,
              dataUrl: rawDataUrl,
              blobUrl,
              base64Only,
              width: 500,
              height: 500,
              mimeType: file.type,
              charCount: rawDataUrl.length,
              qrCodeUrl,
            });
            return;
          }

          const img = new Image();
          img.onload = async () => {
            let targetW = img.width;
            let targetH = img.height;

            if (maxDimension !== 'original' && typeof maxDimension === 'number') {
              if (targetW > maxDimension || targetH > maxDimension) {
                if (targetW > targetH) {
                  targetH = Math.round((targetH * maxDimension) / targetW);
                  targetW = maxDimension;
                } else {
                  targetW = Math.round((targetW * maxDimension) / targetH);
                  targetH = maxDimension;
                }
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              resolve(null);
              return;
            }

            // High-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // If converting to JPEG or PNG without alpha, fill white if needed
            const effectiveMime = outputFormat === 'original' ? (file.type || 'image/png') : outputFormat;
            if (effectiveMime === 'image/jpeg') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, targetW, targetH);
            }

            ctx.drawImage(img, 0, 0, targetW, targetH);

            const effectiveQuality = effectiveMime === 'image/png' ? undefined : quality / 100;
            const finalDataUrl = canvas.toDataURL(effectiveMime, effectiveQuality);
            const base64Only = finalDataUrl.split(',')[1] || '';

            // Generate Blob URL
            const blob = await new Promise<Blob | null>((resBlob) =>
              canvas.toBlob((b) => resBlob(b), effectiveMime, effectiveQuality)
            );
            const blobUrl = blob ? URL.createObjectURL(blob) : URL.createObjectURL(file);

            // Generate QR code for testing
            let qrCodeUrl = '';
            try {
              qrCodeUrl = await QRCode.toDataURL(blobUrl, {
                width: 256,
                margin: 1,
                color: { dark: '#0f172a', light: '#ffffff' },
              });
            } catch (err) {
              console.debug('QR code generation note:', err);
            }

            resolve({
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              file,
              name: file.name,
              originalSize: file.size,
              dataUrl: finalDataUrl,
              blobUrl,
              base64Only,
              width: targetW,
              height: targetH,
              mimeType: effectiveMime,
              charCount: finalDataUrl.length,
              qrCodeUrl,
            });
          };

          img.onerror = () => resolve(null);
          img.src = rawDataUrl;
        };

        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    },
    [outputFormat, quality, maxDimension]
  );

  // Process a list of files
  const handleFiles = useCallback(
    async (fileList: File[]) => {
      const validFiles = fileList.filter((f) => f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|webp|svg|gif|bmp|tiff|ico|avif)$/i));
      if (validFiles.length === 0) {
        showToast('Please select valid image files.');
        return;
      }

      setIsProcessing(true);
      const results: ConvertedImageItem[] = [];

      for (const file of validFiles) {
        const item = await processImageFile(file);
        if (item) {
          results.push(item);
        }
      }

      if (results.length > 0) {
        setItems((prev) => [...results, ...prev]);
        setSelectedId(results[0].id);
        const totalBytes = validFiles.reduce((acc, f) => acc + f.size, 0);
        recordToolConversion('image-to-url', totalBytes);
        showToast(`Successfully converted ${results.length} image${results.length > 1 ? 's' : ''} to URL!`);
      }

      setIsProcessing(false);
    },
    [processImageFile]
  );

  // Listen to initial incoming files from global drops
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      handleFiles(initialFiles);
    } else if (initialFile) {
      handleFiles([initialFile]);
    }
  }, [initialFiles, initialFile, handleFiles]);

  // Global Clipboard Paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const pastedFiles: File[] = [];
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              pastedFiles.push(file);
            }
          }
        }
        if (pastedFiles.length > 0) {
          e.preventDefault();
          handleFiles(pastedFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFiles]);

  // Load sample image
  const handleLoadSample = async () => {
    setIsProcessing(true);
    try {
      // Create a sample SVG/Canvas badge image
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw colorful background gradient
        const gradient = ctx.createLinearGradient(0, 0, 600, 400);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(0.5, '#7c3aed');
        gradient.addColorStop(1, '#db2777');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 400);

        // Ambient circles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(120, 100, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(480, 300, 120, 0, Math.PI * 2);
        ctx.fill();

        // White card in center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(80, 80, 440, 240, 24);
        ctx.fill();

        // Text
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PDF Editfy Demo Image', 300, 180);

        ctx.fillStyle = '#64748b';
        ctx.font = '16px sans-serif';
        ctx.fillText('Converted instantly into Base64 Data URL & code snippets', 300, 220);

        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('600 x 400 px • 100% Client-Side', 300, 260);

        canvas.toBlob(async (blob) => {
          if (blob) {
            const sampleFile = new File([blob], 'pdfeditfy-sample-banner.png', { type: 'image/png' });
            await handleFiles([sampleFile]);
          }
        }, 'image/png');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert Remote Image URL
  const handleFetchRemoteUrl = async () => {
    if (!remoteUrlInput.trim()) {
      showToast('Please enter an image URL.');
      return;
    }

    setIsFetchingRemote(true);
    try {
      const response = await fetch(remoteUrlInput.trim(), { mode: 'cors' });
      if (!response.ok) throw new Error('Failed to load image from remote URL');
      const blob = await response.blob();
      const filename = remoteUrlInput.split('/').pop()?.split('?')[0] || 'remote-image.png';
      const file = new File([blob], filename, { type: blob.type || 'image/png' });
      await handleFiles([file]);
      setRemoteUrlInput('');
    } catch (err) {
      console.warn('Direct fetch blocked by CORS, fallback to image element render:', err);
      // Fallback via Image object
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (blob) => {
            if (blob) {
              const filename = remoteUrlInput.split('/').pop()?.split('?')[0] || 'remote-image.png';
              const file = new File([blob], filename, { type: 'image/png' });
              await handleFiles([file]);
              setRemoteUrlInput('');
              setIsFetchingRemote(false);
            }
          }, 'image/png');
        }
      };
      img.onerror = () => {
        setIsFetchingRemote(false);
        showToast('Could not load remote image due to CORS restrictions. Try uploading it directly.');
      };
      img.src = remoteUrlInput.trim();
      return;
    }
    setIsFetchingRemote(false);
  };

  // Currently selected active item
  const activeItem = items.find((i) => i.id === selectedId) || items[0] || null;

  // Code Snippet Builders
  const getCodeSnippet = (type: typeof activeTab, item: ConvertedImageItem | null) => {
    if (!item) return '';
    switch (type) {
      case 'dataurl':
        return item.dataUrl;
      case 'base64':
        return item.base64Only;
      case 'blob':
        return item.blobUrl;
      case 'html':
        return `<img src="${item.dataUrl}" alt="${item.name.replace(/\.[^/.]+$/, '')}" width="${item.width}" height="${item.height}" loading="lazy" />`;
      case 'css':
        return `/* CSS Background Image */
.custom-image-element {
  background-image: url("${item.dataUrl}");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  max-width: ${item.width}px;
  height: ${item.height}px;
}`;
      case 'react':
        return `import React from 'react';

export const ImageComponent: React.FC = () => {
  return (
    <img
      src="${item.dataUrl}"
      alt="${item.name.replace(/\.[^/.]+$/, '')}"
      width={${item.width}}
      height={${item.height}}
      className="max-w-full h-auto rounded-xl shadow-sm"
    />
  );
};`;
      case 'markdown':
        return `![${item.name.replace(/\.[^/.]+$/, '')}](${item.dataUrl})`;
      case 'qrcode':
        return item.blobUrl;
      default:
        return item.dataUrl;
    }
  };

  // Download HTML test demo file
  const handleDownloadHtmlDemo = (item: ConvertedImageItem) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Base64 Embedded Image Demo - ${item.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 24px;
      max-width: 680px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    h1 { font-size: 20px; margin-top: 0; color: #38bdf8; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; }
    .badge {
      display: inline-block;
      background: #0284c7;
      color: #fff;
      font-size: 11px;
      font-weight: bold;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">100% Offline Embedded Data URL</span>
    <h1>${item.name}</h1>
    <p>Dimensions: ${item.width} &times; ${item.height} px &bull; Format: ${item.mimeType}</p>
    <img src="${item.dataUrl}" alt="${item.name}" />
    <p style="margin-top: 20px; font-size: 11px; color: #64748b;">Generated with PDF Editfy Image to URL Converter</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name.replace(/\.[^/.]+$/, '')}-demo.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded standalone HTML demo file!');
  };

  // Download All as JSON
  const handleExportAllJson = () => {
    if (items.length === 0) return;
    const exportData = items.map((i) => ({
      name: i.name,
      mimeType: i.mimeType,
      width: i.width,
      height: i.height,
      originalBytes: i.originalSize,
      dataUrl: i.dataUrl,
    }));
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `images-data-urls-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported all image URLs to JSON file!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Header Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl">
            <Link className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Image to URL &amp; Base64 Converter</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Instant Local Engine
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Convert images (PNG, JPG, WEBP, SVG, GIF) into Data URLs, Base64 strings, HTML <code className="text-purple-600">&lt;img&gt;</code> tags, CSS backgrounds, and shareable preview links.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleLoadSample}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Load Sample</span>
          </button>

          {items.length > 0 && (
            <>
              <button
                onClick={handleExportAllJson}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON ({items.length})</span>
              </button>
              <button
                onClick={() => {
                  setItems([]);
                  setSelectedId(null);
                  showToast('Cleared image list');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Clear all images"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Upload Drop Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload Dropzone & Conversion Options */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) {
                handleFiles(Array.from(e.dataTransfer.files));
              }
            }}
            className="p-6 border-2 border-dashed border-purple-300 dark:border-purple-900/60 hover:border-purple-500 dark:hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 rounded-3xl text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center min-h-[190px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.svg,.bmp,.tiff,.ico,.avif"
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(Array.from(e.target.files));
                }
              }}
              className="hidden"
            />
            
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-purple-600 shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
              Select or Drop Images Here
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Supports PNG, JPG, WEBP, SVG, GIF, BMP, TIFF, ICO.
            </p>
            <div className="mt-3 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900 text-[10px] font-bold text-purple-700 dark:text-purple-300">
              💡 Or press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-mono">Ctrl + V</kbd> to Paste
            </div>
          </div>

          {/* Convert Remote Image URL */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              Convert Remote Web Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={remoteUrlInput}
                onChange={(e) => setRemoteUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFetchRemoteUrl();
                }}
                placeholder="https://example.com/photo.png"
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <button
                onClick={handleFetchRemoteUrl}
                disabled={isFetchingRemote || !remoteUrlInput.trim()}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                {isFetchingRemote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Fetch'}
              </button>
            </div>
          </div>

          {/* URL Optimization & Compression Settings */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                URL Optimization Settings
              </span>
              <span className="text-[10px] text-slate-400">Shrink Base64 length</span>
            </div>

            {/* Target Output Format */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Format Encoding
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="original">Keep Original Format</option>
                <option value="image/webp">WEBP (Smallest URL Length)</option>
                <option value="image/jpeg">JPEG (Standard Compressed)</option>
                <option value="image/png">PNG (Lossless Transparency)</option>
              </select>
            </div>

            {/* Quality Slider */}
            {outputFormat !== 'original' && outputFormat !== 'image/png' && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Compression Quality</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            )}

            {/* Resize Max Dimension */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Max Dimension (Resize for HTML/CSS embedding)
              </label>
              <select
                value={maxDimension}
                onChange={(e) => {
                  const val = e.target.value;
                  setMaxDimension(val === 'original' ? 'original' : Number(val));
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="original">Original Dimensions</option>
                <option value="400">Max 400px (Icons &amp; Avatars)</option>
                <option value="800">Max 800px (Cards &amp; Banners)</option>
                <option value="1200">Max 1200px (Standard Web)</option>
                <option value="1920">Max 1920px (Full HD)</option>
              </select>
            </div>

          </div>

          {/* Batch Images Queue List */}
          {items.length > 1 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  Images in Queue ({items.length})
                </span>
                <span className="text-[10px] text-slate-400">Click to switch</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      item.id === activeItem?.id
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-400 dark:border-purple-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.dataUrl}
                        alt={item.name}
                        className="w-8 h-8 rounded-lg object-cover bg-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.width}x{item.height} • {formatBytes(item.originalSize)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.dataUrl, `list-${item.id}`, 'Data URL copied!');
                      }}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-purple-100 text-slate-600 dark:text-slate-300 shrink-0"
                      title="Copy Data URL"
                    >
                      {copiedKey === `list-${item.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Active Converted Image Workspace & Code Inspector */}
        <div className="lg:col-span-2 space-y-4">
          
          {activeItem ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              
              {/* Active Image Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={activeItem.dataUrl}
                      alt={activeItem.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-checkerboard shadow-sm"
                    />
                    <a
                      href={activeItem.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity"
                      title="Open full resolution in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-sm">
                      {activeItem.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        {activeItem.width} × {activeItem.height} px
                      </span>
                      <span>• Original: {formatBytes(activeItem.originalSize)}</span>
                      <span>• {activeItem.mimeType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadHtmlDemo(activeItem)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Download standalone HTML file with image embedded"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Download Demo HTML</span>
                  </button>

                  <a
                    href={activeItem.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-300 transition-colors cursor-pointer"
                    title="Open image URL in new browser tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Code Snippet Format Tabs */}
              <div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('dataurl')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'dataurl'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Data URL (Full URI)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('base64')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'base64'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Base64 String Only</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('html')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'html'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>HTML &lt;img&gt; Tag</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('css')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'css'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>CSS Background</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('react')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'react'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>React JSX</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('markdown')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'markdown'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>Markdown</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('blob')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'blob'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Local Blob URL</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('qrcode')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'qrcode'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                  </button>
                </div>

                {/* Code / URL Display Box */}
                <div className="mt-4 space-y-3">
                  
                  {activeTab === 'qrcode' ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center space-y-4">
                      {activeItem.qrCodeUrl ? (
                        <>
                          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                            <img
                              src={activeItem.qrCodeUrl}
                              alt="QR Code for Image URL"
                              className="w-48 h-48"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              Scan to test local image URL on mobile
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Points directly to the browser memory blob / data URI.
                            </p>
                          </div>
                          <a
                            href={activeItem.qrCodeUrl}
                            download={`${activeItem.name}-qr.png`}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download QR Code Image</span>
                          </a>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">QR code is not available for this payload.</p>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-slate-300 rounded-t-2xl text-xs font-mono border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {activeTab.toUpperCase()} Payload
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>{activeItem.charCount.toLocaleString()} chars</span>
                          <span>~{formatBytes(Math.round(activeItem.charCount * 0.75))}</span>
                        </div>
                      </div>

                      <textarea
                        readOnly
                        rows={7}
                        value={getCodeSnippet(activeTab, activeItem)}
                        className="w-full p-4 bg-slate-950 text-purple-300 rounded-b-2xl font-mono text-xs outline-none resize-y border border-slate-800 selection:bg-purple-700 selection:text-white leading-relaxed"
                      />

                      {/* Floating Copy Button */}
                      <button
                        onClick={() =>
                          copyToClipboard(
                            getCodeSnippet(activeTab, activeItem),
                            activeTab,
                            `Copied ${activeTab.toUpperCase()} to clipboard!`
                          )
                        }
                        className="absolute right-3 bottom-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        {copiedKey === activeTab ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy {activeTab.toUpperCase()}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Technical Inspection Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dimensions
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {activeItem.width} × {activeItem.height} px
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Original File Size
                  </span>
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                    {formatBytes(activeItem.originalSize)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Base64 Characters
                  </span>
                  <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                    {activeItem.charCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Data URL Overhead
                  </span>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    +33% (Standard RFC 2397)
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 min-h-[360px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Link className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  No Image Selected Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Drag and drop any picture on the left, paste an image with <kbd className="font-mono text-purple-600 font-bold">Ctrl+V</kbd>, or click &quot;Load Sample&quot; to inspect code snippets.
                </p>
              </div>
              <button
                onClick={handleLoadSample}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Load Sample Image Demo
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Feature & FAQ Help Guide */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-600" />
          <span>Why Convert Images to Data URLs &amp; Base64?</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Zero External HTTP Requests
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Embed small icons, logos, and UI textures directly inside HTML or CSS files to eliminate image loading latency and reduce server round-trips.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-500" />
              Single-File Portability
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate self-contained email newsletters, interactive HTML reports, and React components where images never break due to missing external links.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              100% Private Client-Side
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Conversions happen strictly inside your local web browser memory. Your images are never uploaded to or stored on third-party cloud servers.
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
