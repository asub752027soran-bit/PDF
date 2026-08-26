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
  Trash2,
  Eye,
  FileText,
  Layers,
  ArrowRight,
  Globe,
  Share2,
  CheckCircle2,
  Zap,
  Info,
  Cloud,
  Send,
  Scissors,
  CheckCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { formatBytes } from '../../utils/imageProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import {
  saveShortImage,
  saveShortImageAsync,
  getShortImage,
  getShortImageAsync,
  buildLocalShortUrl,
  buildRawImageUrl,
  uploadToPublicCloud,
  StoredShortImage
} from '../../utils/shortImageStore';

interface ImageToUrlToolProps {
  onBack: () => void;
  initialFiles?: File[] | null;
  initialFile?: File | null;
}

export interface ConvertedImageItem {
  id: string;
  shortId: string;
  name: string;
  originalSize: number;
  dataUrl: string;
  blobUrl: string;
  base64Only: string;
  shortUrl: string;
  publicCloudUrl?: string;
  customSlug?: string;
  width: number;
  height: number;
  mimeType: string;
  charCount: number;
  qrCodeUrl?: string;
  isCloudUploading?: boolean;
}

export const ImageToUrlTool: React.FC<ImageToUrlToolProps> = ({
  onBack,
  initialFiles,
  initialFile,
}) => {
  const [items, setItems] = useState<ConvertedImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'shorturl' | 'rawurl' | 'dataurl' | 'base64' | 'html' | 'css' | 'react' | 'markdown' | 'bbcode' | 'blob' | 'qrcode'
  >('shorturl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState<boolean>(false);
  const [urlLoadedSlug, setUrlLoadedSlug] = useState<string | null>(null);

  // Conversion options
  const [outputFormat, setOutputFormat] = useState<'original' | 'image/png' | 'image/jpeg' | 'image/webp'>('original');
  const [quality, setQuality] = useState<number>(90); // 10-100
  const [maxDimension, setMaxDimension] = useState<number | 'original'>('original');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Custom slug input
  const [customSlugInput, setCustomSlugInput] = useState<string>('');

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

  // Generate a random 6-character short slug
  const generateShortId = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Convert File to ConvertedImageItem
  const processImageFile = useCallback(
    async (file: File, customSlug?: string): Promise<ConvertedImageItem | null> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const rawDataUrl = e.target?.result as string;
          if (!rawDataUrl) {
            resolve(null);
            return;
          }

          const shortId = customSlug || generateShortId();
          const shortUrl = buildLocalShortUrl(shortId);

          // If SVG and output format is original, keep raw text/dataUrl
          if (file.type === 'image/svg+xml' && outputFormat === 'original') {
            const blobUrl = URL.createObjectURL(file);
            const base64Only = rawDataUrl.split(',')[1] || '';

            // Generate QR code for the short URL
            let qrCodeUrl = '';
            try {
              qrCodeUrl = await QRCode.toDataURL(shortUrl, {
                width: 280,
                margin: 2,
                color: { dark: '#4c1d95', light: '#ffffff' },
              });
            } catch (err) {
              console.debug('QR code note:', err);
            }

            const item: ConvertedImageItem = {
              id: `img-${Date.now()}-${shortId}`,
              shortId,
              name: file.name,
              originalSize: file.size,
              dataUrl: rawDataUrl,
              blobUrl,
              base64Only,
              shortUrl,
              customSlug,
              width: 500,
              height: 500,
              mimeType: file.type,
              charCount: rawDataUrl.length,
              qrCodeUrl,
            };

            // Store in local short cache
            saveShortImage({
              id: shortId,
              name: file.name,
              mimeType: file.type,
              dataUrl: rawDataUrl,
              width: 500,
              height: 500,
              size: file.size,
              customSlug,
            });

            resolve(item);
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

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const effectiveMime = outputFormat === 'original' ? (file.type || 'image/png') : outputFormat;
            if (effectiveMime === 'image/jpeg') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, targetW, targetH);
            }

            ctx.drawImage(img, 0, 0, targetW, targetH);

            const effectiveQuality = effectiveMime === 'image/png' ? undefined : quality / 100;
            const finalDataUrl = canvas.toDataURL(effectiveMime, effectiveQuality);
            const base64Only = finalDataUrl.split(',')[1] || '';

            const blob = await new Promise<Blob | null>((resBlob) =>
              canvas.toBlob((b) => resBlob(b), effectiveMime, effectiveQuality)
            );
            const blobUrl = blob ? URL.createObjectURL(blob) : URL.createObjectURL(file);

            // Generate QR code for the Short URL
            let qrCodeUrl = '';
            try {
              qrCodeUrl = await QRCode.toDataURL(shortUrl, {
                width: 280,
                margin: 2,
                color: { dark: '#4c1d95', light: '#ffffff' },
              });
            } catch (err) {
              console.debug('QR code generation note:', err);
            }

            const item: ConvertedImageItem = {
              id: `img-${Date.now()}-${shortId}`,
              shortId,
              name: file.name,
              originalSize: file.size,
              dataUrl: finalDataUrl,
              blobUrl,
              base64Only,
              shortUrl,
              customSlug,
              width: targetW,
              height: targetH,
              mimeType: effectiveMime,
              charCount: finalDataUrl.length,
              qrCodeUrl,
            };

            // Store in local short cache
            saveShortImage({
              id: shortId,
              name: file.name,
              mimeType: effectiveMime,
              dataUrl: finalDataUrl,
              width: targetW,
              height: targetH,
              size: file.size,
              customSlug,
            });

            resolve(item);
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
        showToast(`Generated Short URL for ${results.length} image${results.length > 1 ? 's' : ''}!`);
      }

      setIsProcessing(false);
    },
    [processImageFile]
  );

  // Check URL query / path for ?img=xyz or /i/xyz to auto-load saved short image
  useEffect(() => {
    let isMounted = true;
    const loadFromQuery = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        let imgParam = params.get('img') || params.get('i') || params.get('s') || params.get('image');

        if (!imgParam) {
          const pathname = window.location.pathname.replace(/^\//, '');
          const parts = pathname.split('/');
          if (['i', 's', 'img', 'short'].includes(parts[0]) && parts[1]) {
            imgParam = parts[1];
          }
        }

        if (!imgParam && window.location.hash) {
          const hashClean = window.location.hash.replace(/^#\/?/, '');
          const hashParts = hashClean.split('/');
          if (['i', 's', 'img', 'short'].includes(hashParts[0]) && hashParts[1]) {
            imgParam = hashParts[1];
          } else if (hashClean.startsWith('img=')) {
            imgParam = hashClean.replace('img=', '');
          }
        }

        if (imgParam) {
          if (isMounted) {
            setIsUrlLoading(true);
            setUrlLoadedSlug(imgParam);
          }

          const stored = (await getShortImageAsync(imgParam)) || getShortImage(imgParam);
          if (stored && isMounted) {
            const shortUrl = buildLocalShortUrl(stored.customSlug || stored.id);
            let qrCodeUrl = '';
            try {
              qrCodeUrl = await QRCode.toDataURL(shortUrl, { width: 280, margin: 2, color: { dark: '#4c1d95', light: '#ffffff' } });
            } catch (err) {
              console.debug('QR code error:', err);
            }
            const loadedItem: ConvertedImageItem = {
              id: `stored-${stored.id}`,
              shortId: stored.id,
              name: stored.name,
              originalSize: stored.size,
              dataUrl: stored.dataUrl,
              blobUrl: stored.dataUrl,
              base64Only: stored.dataUrl.split(',')[1] || '',
              shortUrl,
              publicCloudUrl: stored.publicCloudUrl,
              customSlug: stored.customSlug,
              width: stored.width,
              height: stored.height,
              mimeType: stored.mimeType,
              charCount: stored.dataUrl.length,
              qrCodeUrl,
            };
            setItems([loadedItem]);
            setSelectedId(loadedItem.id);
            showToast(`Loaded image from Short URL: ${imgParam}`);
          } else if (isMounted) {
            showToast(`Short link "${imgParam}" not found or expired. Create a new link below.`);
          }

          if (isMounted) {
            setIsUrlLoading(false);
          }
        }
      } catch (e) {
        console.debug('Error parsing img url query:', e);
        if (isMounted) setIsUrlLoading(false);
      }
    };
    loadFromQuery();
    return () => {
      isMounted = false;
    };
  }, []);

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
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 640, 400);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 640, 400);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(120, 100, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(520, 300, 130, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(60, 60, 520, 280, 24);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PDF Editfy Short Image URL', 320, 160);

        ctx.fillStyle = '#64748b';
        ctx.font = '16px sans-serif';
        ctx.fillText('Converted into clean Short Link, QR Code & Base64', 320, 205);

        ctx.fillStyle = '#7c3aed';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('https://pdfeditfy.com/tool/image-to-url?img=demo64', 320, 255);

        canvas.toBlob(async (blob) => {
          if (blob) {
            const sampleFile = new File([blob], 'pdfeditfy-shorturl-demo.png', { type: 'image/png' });
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
        showToast('Could not load remote image due to CORS restrictions. Try uploading directly.');
      };
      img.src = remoteUrlInput.trim();
      return;
    }
    setIsFetchingRemote(false);
  };

  // Currently selected active item
  const activeItem = items.find((i) => i.id === selectedId) || items[0] || null;

  // Upload active image to public cloud to get an external short URL
  const handleCreatePublicCloudShortUrl = async () => {
    if (!activeItem) return;

    setItems((prev) =>
      prev.map((item) => (item.id === activeItem.id ? { ...item, isCloudUploading: true } : item))
    );

    try {
      const res = await uploadToPublicCloud(activeItem.dataUrl, activeItem.name);
      if (res.url) {
        // Update QR code for the public URL
        const qrCodeUrl = await QRCode.toDataURL(res.url, {
          width: 280,
          margin: 2,
          color: { dark: '#0284c7', light: '#ffffff' },
        });

        setItems((prev) =>
          prev.map((item) =>
            item.id === activeItem.id
              ? {
                  ...item,
                  publicCloudUrl: res.url,
                  shortUrl: res.url,
                  qrCodeUrl,
                  isCloudUploading: false,
                }
              : item
          )
        );

        saveShortImage({
          id: activeItem.shortId,
          name: activeItem.name,
          mimeType: activeItem.mimeType,
          dataUrl: activeItem.dataUrl,
          width: activeItem.width,
          height: activeItem.height,
          size: activeItem.originalSize,
          publicCloudUrl: res.url,
          customSlug: activeItem.customSlug,
        });

        copyToClipboard(res.url, 'public-cloud-url', 'Public Cloud Short URL copied!');
      }
    } catch (err) {
      console.error('Failed to create cloud short link:', err);
      showToast('Could not generate public cloud link. Local short URL is ready.');
    } finally {
      setItems((prev) =>
        prev.map((item) => (item.id === activeItem.id ? { ...item, isCloudUploading: false } : item))
      );
    }
  };

  // Apply custom slug to active image
  const handleApplyCustomSlug = async () => {
    if (!activeItem) return;
    const cleanSlug = customSlugInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanSlug) {
      showToast('Please enter a valid slug (letters, numbers, hyphens).');
      return;
    }

    const newShortUrl = buildLocalShortUrl(cleanSlug);
    const qrCodeUrl = await QRCode.toDataURL(newShortUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#4c1d95', light: '#ffffff' },
    });

    setItems((prev) =>
      prev.map((item) =>
        item.id === activeItem.id
          ? {
              ...item,
              customSlug: cleanSlug,
              shortUrl: newShortUrl,
              qrCodeUrl,
            }
          : item
      )
    );

    saveShortImage({
      id: activeItem.shortId,
      name: activeItem.name,
      mimeType: activeItem.mimeType,
      dataUrl: activeItem.dataUrl,
      width: activeItem.width,
      height: activeItem.height,
      size: activeItem.originalSize,
      customSlug: cleanSlug,
      publicCloudUrl: activeItem.publicCloudUrl,
    });

    setCustomSlugInput('');
    copyToClipboard(newShortUrl, 'custom-slug-url', `Custom Short URL set: ${cleanSlug}`);
  };

  // Code Snippet Builders
  const getCodeSnippet = (type: typeof activeTab, item: ConvertedImageItem | null) => {
    if (!item) return '';
    const activeUrl = item.publicCloudUrl || item.shortUrl;
    const rawDirectUrl = item.publicCloudUrl || buildRawImageUrl(item.customSlug || item.shortId);

    switch (type) {
      case 'shorturl':
        return activeUrl;
      case 'rawurl':
        return rawDirectUrl;
      case 'dataurl':
        return item.dataUrl;
      case 'base64':
        return item.base64Only;
      case 'blob':
        return item.blobUrl;
      case 'html':
        return `<img src="${rawDirectUrl}" alt="${item.name.replace(/\.[^/.]+$/, '')}" width="${item.width}" height="${item.height}" loading="lazy" />`;
      case 'css':
        return `/* CSS Background Image with Short URL */
.custom-image-element {
  background-image: url("${rawDirectUrl}");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  max-width: ${item.width}px;
  height: ${item.height}px;
}`;
      case 'react':
        return `import React from 'react';

export const ShortImagePreview: React.FC = () => {
  return (
    <img
      src="${rawDirectUrl}"
      alt="${item.name.replace(/\.[^/.]+$/, '')}"
      width={${item.width}}
      height={${item.height}}
      className="max-w-full h-auto rounded-2xl shadow-md"
      loading="lazy"
    />
  );
};`;
      case 'markdown':
        return `[![${item.name.replace(/\.[^/.]+$/, '')}](${rawDirectUrl})](${activeUrl})`;
      case 'bbcode':
        return `[url=${activeUrl}][img]${rawDirectUrl}[/img][/url]`;
      case 'qrcode':
        return activeUrl;
      default:
        return activeUrl;
    }
  };

  // Social Share links
  const getShareLinks = (url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(`Check out this image: ${title}`);
    return {
      whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}`,
    };
  };

  // Download HTML test demo file
  const handleDownloadHtmlDemo = (item: ConvertedImageItem) => {
    const activeUrl = item.publicCloudUrl || item.shortUrl;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Short Image URL Demo - ${item.name}</title>
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
    h1 { font-size: 20px; margin-top: 0; color: #a855f7; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; }
    .short-link {
      display: inline-block;
      background: #4c1d95;
      color: #e9d5ff;
      font-size: 12px;
      font-family: monospace;
      padding: 6px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      text-decoration: none;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${item.name}</h1>
    <a class="short-link" href="${activeUrl}" target="_blank">${activeUrl}</a>
    <p>Dimensions: ${item.width} &times; ${item.height} px &bull; Format: ${item.mimeType}</p>
    <img src="${item.dataUrl}" alt="${item.name}" />
    <p style="margin-top: 20px; font-size: 11px; color: #64748b;">Generated with PDF Editfy Image to URL &amp; Short Link Converter</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name.replace(/\.[^/.]+$/, '')}-shorturl.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded HTML demo with Short URL!');
  };

  // Export All Short URLs as JSON / TXT
  const handleExportAllShortUrls = () => {
    if (items.length === 0) return;
    const exportData = items.map((i) => ({
      name: i.name,
      shortUrl: i.publicCloudUrl || i.shortUrl,
      width: i.width,
      height: i.height,
      mimeType: i.mimeType,
      sizeBytes: i.originalSize,
      dataUrlLength: i.charCount,
    }));
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `short-image-links-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Short Links to JSON!');
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
              <span>Image to Short URL &amp; Base64 Converter</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Short Links &amp; Cloud Ready
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Convert pictures into ultra-compact Short URLs, shareable links, mobile QR codes, Base64 strings, and HTML/CSS snippets.
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
                onClick={handleExportAllShortUrls}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Short Links ({items.length})</span>
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
              Select or Drop Images to Convert
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              PNG, JPG, WEBP, SVG, GIF, BMP, TIFF, ICO.
            </p>
            <div className="mt-3 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900 text-[10px] font-bold text-purple-700 dark:text-purple-300">
              💡 Or press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-mono">Ctrl + V</kbd> to Paste
            </div>
          </div>

          {/* Convert Remote Image URL */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              Shorten Remote Web Image URL
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
                {isFetchingRemote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Shorten'}
              </button>
            </div>
          </div>

          {/* URL Optimization & Compression Settings */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                Image Optimization Settings
              </span>
              <span className="text-[10px] text-slate-400">Reduce payload</span>
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
                <option value="image/webp">WEBP (Smallest Size &amp; Fastest)</option>
                <option value="image/jpeg">JPEG (Standard Photo)</option>
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
                Max Dimension (Resize for web sharing)
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
                <option value="400">Max 400px (Avatars &amp; Thumbnails)</option>
                <option value="800">Max 800px (Social &amp; Blog Cards)</option>
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
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono truncate">
                          {item.publicCloudUrl || item.shortUrl}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.publicCloudUrl || item.shortUrl, `list-${item.id}`, 'Short URL copied!');
                      }}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-purple-100 text-slate-600 dark:text-slate-300 shrink-0"
                      title="Copy Short URL"
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
          
          {/* Loaded from URL Banner */}
          {urlLoadedSlug && activeItem && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Viewing short link: <strong className="font-mono">{urlLoadedSlug}</strong>
                </span>
              </div>
              <button
                onClick={() => {
                  setUrlLoadedSlug(null);
                  if (window.history.pushState) {
                    const cleanUrl = window.location.pathname;
                    window.history.pushState({}, '', cleanUrl);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 font-bold transition-colors cursor-pointer"
              >
                Clear View
              </button>
            </div>
          )}

          {isUrlLoading && (
            <div className="p-6 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                Loading image from Short Link...
              </p>
            </div>
          )}

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
                      href={activeItem.publicCloudUrl || activeItem.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity"
                      title="Open image in new tab"
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
                      <span>• {formatBytes(activeItem.originalSize)}</span>
                      <span>• {activeItem.mimeType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadHtmlDemo(activeItem)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Download HTML file with Short URL embedded"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Download Demo HTML</span>
                  </button>

                  <a
                    href={activeItem.publicCloudUrl || activeItem.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-300 transition-colors cursor-pointer"
                    title="Open Short URL in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* PRIMARY PROMINENT SHORT URL BANNER */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-purple-600 text-white rounded-lg">
                      <Scissors className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Generated Short URL</span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          99.9% Shorter than Base64
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Compact link ready to share on WhatsApp, Discord, Slack, SMS, or embeds.
                      </p>
                    </div>
                  </div>

                  {/* Public Cloud Upload Button */}
                  {!activeItem.publicCloudUrl && (
                    <button
                      onClick={handleCreatePublicCloudShortUrl}
                      disabled={activeItem.isCloudUploading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                      title="Upload image to free public image hosting for a universal public URL"
                    >
                      {activeItem.isCloudUploading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-3.5 h-3.5" />
                          <span>Make Public Cloud URL</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* 1. Interactive Web Short Link */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                    Interactive Web Short Link (Full Viewer & QR):
                  </span>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
                    <input
                      type="text"
                      readOnly
                      value={activeItem.publicCloudUrl || activeItem.shortUrl}
                      className="flex-1 px-3 py-1.5 bg-transparent text-purple-700 dark:text-purple-300 text-xs font-mono font-bold outline-none select-all"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(
                          activeItem.publicCloudUrl || activeItem.shortUrl,
                          'hero-short-url',
                          'Short URL copied!'
                        )
                      }
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === 'hero-short-url' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                    <a
                      href={activeItem.publicCloudUrl || activeItem.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-300 transition-colors"
                      title="Open Short Link in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 2. Direct Raw Image URL (for HTML & Markdown Embeds) */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                    Direct Image Link (For &lt;img&gt; tags, Markdown & CSS):
                  </span>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <input
                      type="text"
                      readOnly
                      value={activeItem.publicCloudUrl || buildRawImageUrl(activeItem.customSlug || activeItem.shortId)}
                      className="flex-1 px-3 py-1.5 bg-transparent text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold outline-none select-all"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(
                          activeItem.publicCloudUrl || buildRawImageUrl(activeItem.customSlug || activeItem.shortId),
                          'hero-raw-url',
                          'Direct Image Link copied!'
                        )
                      }
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === 'hero-raw-url' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Image URL</span>
                        </>
                      )}
                    </button>
                    <a
                      href={activeItem.publicCloudUrl || buildRawImageUrl(activeItem.customSlug || activeItem.shortId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 transition-colors"
                      title="Open Direct Image Stream in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 1-Click Social Share Row & Custom Slug Toggle */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-bold">Share to:</span>
                    <a
                      href={getShareLinks(activeItem.publicCloudUrl || activeItem.shortUrl, activeItem.name).whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={getShareLinks(activeItem.publicCloudUrl || activeItem.shortUrl, activeItem.name).telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      Telegram
                    </a>
                    <a
                      href={getShareLinks(activeItem.publicCloudUrl || activeItem.shortUrl, activeItem.name).twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      X / Twitter
                    </a>
                    <a
                      href={getShareLinks(activeItem.publicCloudUrl || activeItem.shortUrl, activeItem.name).email}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      Email
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Length: {(activeItem.publicCloudUrl || activeItem.shortUrl).length} chars (vs {activeItem.charCount.toLocaleString()} Base64)
                    </span>
                  </div>
                </div>

                {/* Custom Slug Editor */}
                <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                    Custom Slug:
                  </span>
                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="text"
                      value={customSlugInput}
                      onChange={(e) => setCustomSlugInput(e.target.value)}
                      placeholder={activeItem.customSlug || "e.g. my-product-banner"}
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none"
                    />
                    <button
                      onClick={handleApplyCustomSlug}
                      disabled={!customSlugInput.trim()}
                      className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Set Slug
                    </button>
                  </div>
                </div>

              </div>

              {/* Code Snippet Format Tabs */}
              <div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
                  
                  <button
                    onClick={() => setActiveTab('shorturl')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'shorturl'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Short Web URL</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('rawurl')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'rawurl'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Direct Image Link</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('dataurl')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'dataurl'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Data URL (Base64)</span>
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
                    <span>HTML &lt;img&gt;</span>
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
                    onClick={() => setActiveTab('bbcode')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'bbcode'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>BBCode Forum</span>
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
                    <span>Raw Base64</span>
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
                              alt="QR Code for Short URL"
                              className="w-48 h-48"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              Scan with your phone to open Short Image URL
                            </p>
                            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                              {activeItem.publicCloudUrl || activeItem.shortUrl}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={activeItem.qrCodeUrl}
                              download={`${activeItem.name}-qr.png`}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download QR Code</span>
                            </a>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  activeItem.publicCloudUrl || activeItem.shortUrl,
                                  'qr-short-copy',
                                  'Short URL copied!'
                                )
                              }
                              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy URL</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">QR code is generating...</p>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-slate-300 rounded-t-2xl text-xs font-mono border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {activeTab.toUpperCase()} PAYLOAD
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>{getCodeSnippet(activeTab, activeItem).length.toLocaleString()} characters</span>
                        </div>
                      </div>

                      <textarea
                        readOnly
                        rows={6}
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
                    File Size
                  </span>
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                    {formatBytes(activeItem.originalSize)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Short URL Length
                  </span>
                  <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                    {(activeItem.publicCloudUrl || activeItem.shortUrl).length} chars
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Payload Saved
                  </span>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    99.9% Reduction
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 min-h-[360px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Scissors className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  No Image Selected Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Drag and drop any picture on the left, paste an image with <kbd className="font-mono text-purple-600 font-bold">Ctrl+V</kbd>, or click &quot;Load Sample&quot; to generate an instant Short URL.
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
          <span>Why Convert Images into Short URLs?</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-purple-600" />
              Ultra-Compact Links
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Replace massive 500KB+ Base64 strings with clean 30-character short links that easily fit into SMS messages, WhatsApp chats, forum posts, and Twitter/X tweets.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-500" />
              Instant Mobile QR Sharing
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Every short link automatically generates a scannable QR code. Simply scan with any smartphone camera to open and view the high-resolution photo instantly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-emerald-500" />
              Ready-to-Use Embed Code
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Copy pre-formatted Markdown links, HTML &lt;img&gt; tags, React JSX code, and CSS background-image rules utilizing your short URL with one click.
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
