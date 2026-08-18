import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  Upload,
  Download,
  Type,
  Square,
  Highlighter,
  PenTool,
  RotateCw,
  RotateCcw,
  Trash2,
  X,
  Image as ImageIcon,
  ArrowLeft,
  Stamp,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileText,
  Layers,
  Undo2,
  Redo2,
  MousePointer,
  Sparkles,
  Plus,
  Copy,
  Printer,
  FileCheck,
  Maximize2,
  Minimize2,
  Check,
  Calendar,
  Circle,
  ArrowRight,
  Minus,
  Search,
  MessageSquare,
  Eye,
  Replace,
  PenLine,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import {
  applyPDFAnnotations,
  watermarkPDF,
  lockPDF,
  unlockPDF,
  manipulatePDFPages,
  readFileAsArrayBuffer,
  readFileAsDataURL
} from '../../utils/pdfProcessor';
import { downloadBlob } from '../../utils/batchProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import { PDFAnnotation, EditablePdfText } from '../../types';

// Set up pdf.js worker URL safely
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PDFEditorToolProps {
  mode?: 'edit' | 'watermark' | 'lock' | 'unlock';
  onBack: () => void;
}

type MainTool =
  | 'select'
  | 'add_text'
  | 'edit_text'
  | 'sign'
  | 'pencil'
  | 'highlight'
  | 'eraser'
  | 'annotate'
  | 'image'
  | 'ellipse';

export const PDFEditorTool: React.FC<PDFEditorToolProps> = ({ mode = 'edit', onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);

  // Active Tool state (defaults to 'edit_text' so existing PDF text is immediately editable!)
  const [activeTool, setActiveTool] = useState<MainTool>('edit_text');

  // Left Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Annotations & In-Place Extracted Text State
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [extractedPageTexts, setExtractedPageTexts] = useState<Record<number, EditablePdfText[]>>({});
  
  // Selection & Active editing
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // History Stack for Undo/Redo
  interface HistorySnapshot {
    annotations: PDFAnnotation[];
    extractedTexts: Record<number, EditablePdfText[]>;
  }
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // Text & Formatting Tool State
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [fontSize, setFontSize] = useState(14);
  const [textColor, setTextColor] = useState('#111827');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  // Highlight State
  const [highlightColor, setHighlightColor] = useState('#FFE500');
  const [highlightOpacity, setHighlightOpacity] = useState(0.45);

  // Freehand Pencil State
  const [drawColor, setDrawColor] = useState('#1e293b');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<{ x: number; y: number }[]>([]);

  // Shapes State
  const [shapeStrokeColor, setShapeStrokeColor] = useState('#2563eb');
  const [shapeFillColor, setShapeFillColor] = useState('');

  // Signature Modal State
  const [showSigModal, setShowSigModal] = useState(false);
  const [sigType, setSigType] = useState<'draw' | 'type' | 'upload' | 'stamp'>('draw');
  const [sigTypedName, setSigTypedName] = useState('John Doe');
  const [sigFontFamily, setSigFontFamily] = useState('font-serif italic');
  const [selectedStamp, setSelectedStamp] = useState('APPROVED');

  // Search / Find & Replace State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchMatchesCount, setSearchMatchesCount] = useState(0);

  // Viewport & Page Navigation State
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.25);
  const [pageRotation, setPageRotation] = useState(0);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Processing & Export State
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [pdfRendering, setPdfRendering] = useState(false);
  const [pdfRenderSuccess, setPdfRenderSuccess] = useState(false);

  // Dragging & Resizing Canvas Annotations
  const [draggingAnnId, setDraggingAnnId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizingAnnId, setResizingAnnId] = useState<string | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Push to history snapshot
  const pushHistory = useCallback((newAnns: PDFAnnotation[], newTexts: Record<number, EditablePdfText[]>) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyIdx + 1);
      return [...updated, { annotations: newAnns, extractedTexts: newTexts }];
    });
    setHistoryIdx((prev) => prev + 1);
  }, [historyIdx]);

  // Handle Undo
  const handleUndo = () => {
    if (historyIdx > 0) {
      const targetIdx = historyIdx - 1;
      const targetState = history[targetIdx];
      setAnnotations(targetState.annotations);
      setExtractedPageTexts(targetState.extractedTexts);
      setHistoryIdx(targetIdx);
    }
  };

  // Handle Redo
  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const targetIdx = historyIdx + 1;
      const targetState = history[targetIdx];
      setAnnotations(targetState.annotations);
      setExtractedPageTexts(targetState.extractedTexts);
      setHistoryIdx(targetIdx);
    }
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearchModal(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnId && !editingTextId) {
          e.preventDefault();
          deleteAnnotation(selectedAnnId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIdx, history, selectedAnnId, editingTextId]);

  // File Upload Handler
  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    setIsProcessing(true);
    setFile(uploadedFile);

    try {
      const dataUrl = await readFileAsDataURL(uploadedFile);
      setFileDataUrl(dataUrl);

      // Load Document with PDF.js
      const loadingTask = pdfjsLib.getDocument({ url: dataUrl });
      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      setAnnotations([]);
      setExtractedPageTexts({});
      setHistory([]);
      setHistoryIdx(-1);
      setIsProcessing(false);

      // Generate page thumbnails in background
      generateThumbnails(pdf);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      alert('Could not render this PDF file. Please ensure it is not password-protected.');
      setIsProcessing(false);
    }
  };

  // Generate real page thumbnails
  const generateThumbnails = async (pdfDoc: any) => {
    const thumbs: string[] = [];
    for (let i = 1; i <= Math.min(pdfDoc.numPages, 20); i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs.push(canvas.toDataURL());
        }
      } catch {
        thumbs.push('');
      }
    }
    setThumbnailUrls(thumbs);
  };

  // Render Active PDF Page on Canvas & Extract In-Place Text Items
  const renderPage = useCallback(async (pageNo: number) => {
    if (!fileDataUrl) return;
    setPdfRendering(true);

    try {
      const loadingTask = pdfjsLib.getDocument({ url: fileDataUrl });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNo);

      const canvas = pdfCanvasRef.current;
      if (!canvas) return;

      const baseViewport = page.getViewport({ scale: 1.0, rotation: pageRotation });
      const containerWidth = containerRef.current ? containerRef.current.clientWidth - 64 : 800;
      
      const calculatedScale = Math.min(
        (containerWidth / baseViewport.width) * zoomScale,
        3.0
      );

      const viewport = page.getViewport({ scale: Math.max(0.6, calculatedScale), rotation: pageRotation });
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext as any).promise;
      ctx.restore();

      // Extract In-Place Text Items for Word & Line Editing
      setExtractedPageTexts((prev) => {
        if (prev[pageNo] && prev[pageNo].length > 0) {
          return prev; // already extracted and perhaps user edited
        }

        // Fetch text items asynchronously
        page.getTextContent().then((textContent) => {
          const rawItems = (textContent.items as any[]).filter(
            (it) => it.str && it.str.trim().length > 0
          );

          // Group nearby text fragments on the same baseline into sentences/phrases
          const lineGroups: {
            str: string;
            tx: number;
            ty: number;
            width: number;
            height: number;
            fontName: string;
            fontSize: number;
          }[] = [];

          rawItems.sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) > 3.5) return yDiff;
            return a.transform[4] - b.transform[4];
          });

          for (const it of rawItems) {
            const tx = it.transform[4];
            const ty = it.transform[5];
            const fHeight = Math.sqrt(it.transform[0] * it.transform[0] + it.transform[1] * it.transform[1]);
            const itemW = it.width || (it.str.length * fHeight * 0.55);
            const itemH = it.height || fHeight;

            const last = lineGroups[lineGroups.length - 1];
            if (
              last &&
              Math.abs(last.ty - ty) < 4 &&
              (tx - (last.tx + last.width)) >= -2 &&
              (tx - (last.tx + last.width)) < 18
            ) {
              const addSpace = (tx - (last.tx + last.width)) > 1.5 ? ' ' : '';
              last.str += addSpace + it.str;
              last.width = (tx + itemW) - last.tx;
              last.height = Math.max(last.height, itemH);
            } else {
              lineGroups.push({
                str: it.str,
                tx,
                ty,
                width: itemW,
                height: itemH,
                fontName: it.fontName || '',
                fontSize: fHeight || 13,
              });
            }
          }

          const extractedItems: EditablePdfText[] = lineGroups.map((lg, idx) => {
            const xPct = (lg.tx / baseViewport.width) * 100;
            const yPct = ((baseViewport.height - lg.ty - lg.height) / baseViewport.height) * 100;
            const widthPct = Math.min((lg.width / baseViewport.width) * 100, 100 - xPct);
            const heightPct = Math.max(((lg.height * 1.15) / baseViewport.height) * 100, 1.4);

            // Read font details from textContent styles map or fontName
            const fontStyleObj = textContent.styles ? (textContent.styles as any)[lg.fontName] : null;
            const styleFamily = (fontStyleObj?.fontFamily || '').toLowerCase();
            const rawFont = (lg.fontName || '').toLowerCase();

            const isSerif =
              styleFamily.includes('serif') ||
              styleFamily.includes('times') ||
              styleFamily.includes('roman') ||
              styleFamily.includes('georgia') ||
              styleFamily.includes('garamond') ||
              styleFamily.includes('cambria') ||
              styleFamily.includes('palatino') ||
              rawFont.includes('times') ||
              rawFont.includes('serif') ||
              rawFont.includes('roman') ||
              rawFont.includes('georgia') ||
              rawFont.includes('garamond') ||
              rawFont.includes('cambria') ||
              rawFont.includes('palatino');

            const isMono =
              styleFamily.includes('mono') ||
              styleFamily.includes('courier') ||
              styleFamily.includes('code') ||
              styleFamily.includes('consolas') ||
              rawFont.includes('courier') ||
              rawFont.includes('mono') ||
              rawFont.includes('code') ||
              rawFont.includes('consolas');

            const isBold =
              rawFont.includes('bold') ||
              rawFont.includes('black') ||
              rawFont.includes('heavy') ||
              rawFont.includes('700') ||
              rawFont.includes('800') ||
              rawFont.includes('900') ||
              styleFamily.includes('bold');

            const isItalic =
              rawFont.includes('italic') ||
              rawFont.includes('oblique') ||
              rawFont.includes('slanted') ||
              styleFamily.includes('italic') ||
              styleFamily.includes('oblique');

            let cssFontFamily = 'Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif';
            let pdfFontType = 'sans-serif';

            if (isSerif) {
              cssFontFamily = '"Times New Roman", Times, Georgia, "Liberation Serif", serif';
              pdfFontType = 'serif';
            } else if (isMono) {
              cssFontFamily = '"Courier New", Courier, Menlo, Consolas, monospace';
              pdfFontType = 'monospace';
            } else if (fontStyleObj?.fontFamily && fontStyleObj.fontFamily !== 'sans-serif') {
              cssFontFamily = `"${fontStyleObj.fontFamily}", Helvetica, Arial, sans-serif`;
            }

            return {
              id: `text_p${pageNo}_${idx}_${Date.now()}`,
              pageNumber: pageNo,
              originalText: lg.str,
              currentText: lg.str,
              x: Math.max(0, xPct),
              y: Math.max(0, yPct),
              width: Math.max(1, widthPct),
              height: Math.max(1, heightPct),
              fontSize: Math.round(lg.fontSize),
              fontFamily: cssFontFamily,
              fontName: lg.fontName,
              pdfFontType,
              isBold,
              isItalic,
              color: '#0f172a',
              isModified: false,
            };
          });

          setExtractedPageTexts((currentMap) => {
            const updated = { ...currentMap, [pageNo]: extractedItems };
            if (history.length === 0) {
              pushHistory(annotations, updated);
            }
            return updated;
          });
        });

        return prev;
      });

      setPdfRendering(false);
      setPdfRenderSuccess(true);
    } catch (err: any) {
      console.error('Error rendering page:', err);
      setPdfRendering(false);
    }
  }, [fileDataUrl, zoomScale, pageRotation, annotations, history.length, pushHistory]);

  useEffect(() => {
    if (fileDataUrl) {
      renderPage(currentPage);
    }
  }, [fileDataUrl, currentPage, zoomScale, pageRotation, renderPage]);

  // Update In-Place Edited Text Item
  const handleUpdateTextItem = (id: string, newText: string) => {
    setExtractedPageTexts((prev) => {
      const pageList = prev[currentPage] || [];
      const updatedList = pageList.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            currentText: newText,
            isModified: newText !== item.originalText,
          };
        }
        return item;
      });
      const newMap = { ...prev, [currentPage]: updatedList };
      pushHistory(annotations, newMap);
      return newMap;
    });
  };

  // Change formatting of an In-Place Text Item
  const handleFormatTextItem = (id: string, updates: Partial<EditablePdfText>) => {
    setExtractedPageTexts((prev) => {
      const pageList = prev[currentPage] || [];
      const updatedList = pageList.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...updates,
            isModified: true,
          };
        }
        return item;
      });
      const newMap = { ...prev, [currentPage]: updatedList };
      pushHistory(annotations, newMap);
      return newMap;
    });
  };

  // Delete an In-Place Text Item (erases original text with clean whiteout)
  const handleDeleteTextItem = (id: string) => {
    setExtractedPageTexts((prev) => {
      const pageList = prev[currentPage] || [];
      const updatedList = pageList.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            currentText: '',
            isDeleted: true,
            isModified: true,
          };
        }
        return item;
      });
      const newMap = { ...prev, [currentPage]: updatedList };
      pushHistory(annotations, newMap);
      return newMap;
    });
    setEditingTextId(null);
  };

  // Find & Replace Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatchesCount(0);
      return;
    }
    let count = 0;
    Object.values(extractedPageTexts).forEach((items) => {
      items.forEach((it) => {
        if (it.currentText.toLowerCase().includes(searchQuery.toLowerCase())) {
          count++;
        }
      });
    });
    setSearchMatchesCount(count);
  }, [searchQuery, extractedPageTexts]);

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return;
    setExtractedPageTexts((prev) => {
      const newMap: Record<number, EditablePdfText[]> = {};
      Object.keys(prev).forEach((pStr) => {
        const pNum = Number(pStr);
        newMap[pNum] = prev[pNum].map((item) => {
          if (item.currentText.toLowerCase().includes(searchQuery.toLowerCase())) {
            const regex = new RegExp(searchQuery, 'gi');
            const replaced = item.currentText.replace(regex, replaceQuery);
            return {
              ...item,
              currentText: replaced,
              isModified: true,
            };
          }
          return item;
        });
      });
      pushHistory(annotations, newMap);
      return newMap;
    });
    setShowSearchModal(false);
  };

  // Canvas Click Handler (For Adding New Text, Shapes, Highlighting)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pdfCanvasRef.current || draggingAnnId || resizingAnnId || editingTextId) return;

    const rect = pdfCanvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPct = (clickX / rect.width) * 100;
    const yPct = (clickY / rect.height) * 100;

    if (activeTool === 'add_text') {
      const newAnn: PDFAnnotation = {
        id: `text_${Date.now()}`,
        pageNumber: currentPage,
        type: 'text',
        content: 'Type your text here...',
        x: Math.max(1, Math.min(95, xPct)),
        y: Math.max(1, Math.min(95, yPct)),
        fontSize,
        fontFamily,
        color: textColor,
        isBold,
        isItalic,
        hasWhiteoutBg: false,
      };
      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      setSelectedAnnId(newAnn.id);
      pushHistory(updated, extractedPageTexts);
      setActiveTool('select');
    } else if (activeTool === 'eraser') {
      // Create a whiteout box to erase any section
      const newAnn: PDFAnnotation = {
        id: `whiteout_${Date.now()}`,
        pageNumber: currentPage,
        type: 'whiteout',
        x: Math.max(1, Math.min(90, xPct)),
        y: Math.max(1, Math.min(90, yPct)),
        width: 15,
        height: 4,
      };
      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      setSelectedAnnId(newAnn.id);
      pushHistory(updated, extractedPageTexts);
      setActiveTool('select');
    } else if (activeTool === 'ellipse') {
      const newAnn: PDFAnnotation = {
        id: `shape_${Date.now()}`,
        pageNumber: currentPage,
        type: 'shape',
        shapeType: 'circle',
        x: Math.max(1, Math.min(85, xPct)),
        y: Math.max(1, Math.min(85, yPct)),
        width: 12,
        height: 12,
        color: shapeStrokeColor,
        fillColor: shapeFillColor,
      };
      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      setSelectedAnnId(newAnn.id);
      pushHistory(updated, extractedPageTexts);
      setActiveTool('select');
    } else if (activeTool === 'annotate') {
      const newAnn: PDFAnnotation = {
        id: `note_${Date.now()}`,
        pageNumber: currentPage,
        type: 'text',
        content: 'Sticky Note: ',
        x: Math.max(1, Math.min(90, xPct)),
        y: Math.max(1, Math.min(90, yPct)),
        fontSize: 12,
        fontFamily: 'Helvetica',
        color: '#854d0e',
        hasWhiteoutBg: true,
      };
      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      setSelectedAnnId(newAnn.id);
      pushHistory(updated, extractedPageTexts);
      setActiveTool('select');
    }
  };

  // Freehand Pencil & Highlighter Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pencil' && activeTool !== 'highlight') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setCurrentDrawPoints([{ x: xPct, y: yPct }]);
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (activeTool !== 'pencil' && activeTool !== 'highlight')) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const nextPoints = [...currentDrawPoints, { x: xPct, y: yPct }];
    setCurrentDrawPoints(nextPoints);

    // Live preview stroke on temporary canvas
    const ctx = canvas.getContext('2d');
    if (ctx && nextPoints.length > 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'highlight' ? highlightColor : drawColor;
      ctx.lineWidth = activeTool === 'highlight' ? strokeWidth * 3.5 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlight' ? highlightOpacity : 1.0;

      const p0 = nextPoints[0];
      ctx.moveTo((p0.x / 100) * canvas.width, (p0.y / 100) * canvas.height);

      for (let i = 1; i < nextPoints.length; i++) {
        const pt = nextPoints[i];
        ctx.lineTo((pt.x / 100) * canvas.width, (pt.y / 100) * canvas.height);
      }
      ctx.stroke();
    }
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentDrawPoints.length > 1) {
      const newAnn: PDFAnnotation = {
        id: `draw_${Date.now()}`,
        pageNumber: currentPage,
        type: 'draw',
        x: 0,
        y: 0,
        points: currentDrawPoints,
        color: activeTool === 'highlight' ? highlightColor : drawColor,
        strokeWidth: activeTool === 'highlight' ? strokeWidth * 3.5 : strokeWidth,
        opacity: activeTool === 'highlight' ? highlightOpacity : 1.0,
      };
      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      pushHistory(updated, extractedPageTexts);
    }

    setCurrentDrawPoints([]);
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Annotation dragging
  const handleStartDrag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAnnId(id);
    setDraggingAnnId(id);

    if (!pdfCanvasRef.current) return;
    const rect = pdfCanvasRef.current.getBoundingClientRect();
    const ann = annotations.find((a) => a.id === id);
    if (!ann) return;

    const annPxX = (ann.x / 100) * rect.width;
    const annPxY = (ann.y / 100) * rect.height;

    setDragOffset({
      x: e.clientX - rect.left - annPxX,
      y: e.clientY - rect.top - annPxY,
    });
  };

  const handleDragOver = (e: React.MouseEvent) => {
    if (!draggingAnnId || !pdfCanvasRef.current) return;
    const rect = pdfCanvasRef.current.getBoundingClientRect();

    const currX = e.clientX - rect.left - dragOffset.x;
    const currY = e.clientY - rect.top - dragOffset.y;

    const xPct = Math.max(0, Math.min(95, (currX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(95, (currY / rect.height) * 100));

    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === draggingAnnId ? { ...ann, x: xPct, y: yPct } : ann))
    );
  };

  const handleEndDrag = () => {
    if (draggingAnnId) {
      setDraggingAnnId(null);
      pushHistory(annotations, extractedPageTexts);
    }
  };

  // Delete Annotation
  const deleteAnnotation = (id: string) => {
    const updated = annotations.filter((a) => a.id !== id);
    setAnnotations(updated);
    if (selectedAnnId === id) setSelectedAnnId(null);
    pushHistory(updated, extractedPageTexts);
  };

  // Signature Pad Generator
  const applySignature = () => {
    let sigDataUrl = '';

    if (sigType === 'draw') {
      const canvas = sigCanvasRef.current;
      if (!canvas) return;
      sigDataUrl = canvas.toDataURL('image/png');
    } else if (sigType === 'type') {
      const offscreen = document.createElement('canvas');
      offscreen.width = 400;
      offscreen.height = 120;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'italic 38px "Brush Script MT", "Caveat", "Dancing Script", cursive, Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sigTypedName || 'Signature', 200, 60);
        sigDataUrl = offscreen.toDataURL('image/png');
      }
    } else if (sigType === 'stamp') {
      const offscreen = document.createElement('canvas');
      offscreen.width = 300;
      offscreen.height = 100;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 280, 80);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(selectedStamp, 150, 50);
        sigDataUrl = offscreen.toDataURL('image/png');
      }
    }

    if (sigDataUrl) {
      const newAnn: PDFAnnotation = {
        id: `sig_${Date.now()}`,
        pageNumber: currentPage,
        type: 'signature',
        content: sigDataUrl,
        x: 40,
        y: 60,
        width: 25,
        height: 10,
      };
      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      setSelectedAnnId(newAnn.id);
      pushHistory(updated, extractedPageTexts);
    }

    setShowSigModal(false);
    setActiveTool('select');
  };

  // Image Upload Annotation
  const handleImageAnnotationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;

    const dataUrl = await readFileAsDataURL(imgFile);
    const newAnn: PDFAnnotation = {
      id: `img_${Date.now()}`,
      pageNumber: currentPage,
      type: 'image',
      content: dataUrl,
      x: 35,
      y: 40,
      width: 30,
      height: 20,
    };
    const updated = [...annotations, newAnn];
    setAnnotations(updated);
    setSelectedAnnId(newAnn.id);
    pushHistory(updated, extractedPageTexts);
    setActiveTool('select');
  };

  // Save / Export Final PDF
  const handleSaveAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setExportMessage('Applying vector text modifications and annotations...');

    try {
      // Flatten all edited texts across all pages into an array
      const allEditedTexts: EditablePdfText[] = [];
      Object.values(extractedPageTexts).forEach((list) => {
        list.forEach((it) => {
          if (it.isModified || it.isDeleted) {
            allEditedTexts.push(it);
          }
        });
      });

      // Apply annotations and text replacements
      const finalBytes = await applyPDFAnnotations(file, annotations, allEditedTexts);

      const cleanName = file.name.replace(/\.pdf$/i, '');
      const outBlob = new Blob([finalBytes], { type: 'application/pdf' });
      downloadBlob(outBlob, `${cleanName}_edited.pdf`);

      recordToolConversion('edit-pdf', file.size);
      setIsProcessing(false);
      setExportMessage(null);
    } catch (err: any) {
      console.error('Error saving PDF:', err);
      alert('Failed to generate output PDF: ' + err.message);
      setIsProcessing(false);
      setExportMessage(null);
    }
  };

  const activePageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);
  const activePageTexts = extractedPageTexts[currentPage] || [];
  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnId);

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header matching other tools */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tools
          </button>
          <div className="text-right">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Edit PDF Document
            </h1>
            <p className="text-xs text-slate-500 max-w-lg ml-auto">
              Directly edit existing text, erase words, sign, annotate, and export with strict original font preservation.
            </p>
          </div>
        </div>

        {/* Upload Hero Card */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm group"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-xs">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Choose PDF Document to Edit
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
            Click words or sentences directly on your PDF to edit, replace, or erase them in-place with exact font preservation.
          </p>

          <label className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer">
            <Upload className="w-4 h-4" /> Select PDF Document
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 text-left">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" /> Font Preservation
              </div>
              <p className="text-[11px] text-slate-500">Maintains exact original font family, weight, and point size.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
                <PenLine className="w-4 h-4" /> In-Place Text Edit
              </div>
              <p className="text-[11px] text-slate-500">Click and edit existing words or phrases directly on canvas.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
                <PenTool className="w-4 h-4" /> Sign & Stamps
              </div>
              <p className="text-[11px] text-slate-500">Draw, type signature, or insert official stamps & dates.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
                <Sparkles className="w-4 h-4" /> Zero Uploads
              </div>
              <p className="text-[11px] text-slate-500">Processed 100% locally in your browser for total privacy.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={workspaceRef}
      className={`flex flex-col bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-xl overflow-hidden select-none ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[calc(100vh-100px)] min-h-[640px]'
      }`}
      onMouseMove={handleDragOver}
      onMouseUp={handleEndDrag}
    >
      {/* 1. TOP MAIN HEADER - EXACTLY MATCHING THE USER'S SCREENSHOT */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-5 shrink-0 z-30 shadow-xs">
        
        {/* Left: Brand & Zoom Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Back to Suite"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Tool Title */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20">
              <FileText className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Edit <span className="text-blue-600">PDF</span>
              </span>
            </div>
          </div>

          {/* Zoom Controls: "— 125% +" */}
          {file && (
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-1 py-0.5 text-xs">
              <button
                onClick={() => setZoomScale((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 font-bold text-slate-700 min-w-[50px] text-center text-xs">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                onClick={() => setZoomScale((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Main Professional Action Bar matching Screenshot */}
        {file && (
          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto py-1">
            
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={historyIdx <= 0}
              className="flex flex-col items-center justify-center px-2 py-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-[11px] font-medium"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 hidden md:block">Undo</span>
            </button>

            {/* Redo */}
            <button
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              className="flex flex-col items-center justify-center px-2 py-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-[11px] font-medium"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 hidden md:block">Redo</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            {/* Select */}
            <button
              onClick={() => setActiveTool('select')}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTool === 'select'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Select & Move elements"
            >
              <MousePointer className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Select</span>
            </button>

            {/* Add Text */}
            <button
              onClick={() => setActiveTool('add_text')}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTool === 'add_text'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Add New Text box"
            >
              <Type className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Add Text</span>
            </button>

            {/* Edit Text - CRITICAL IN-PLACE WORD EDITING */}
            <button
              onClick={() => setActiveTool('edit_text')}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all relative ${
                activeTool === 'edit_text'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Edit Existing Words & Sentences in Document"
            >
              <PenLine className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Edit Text</span>
              {activeTool === 'edit_text' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Sign */}
            <button
              onClick={() => setShowSigModal(true)}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTool === 'sign'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Draw or Insert Signature"
            >
              <PenTool className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Sign</span>
            </button>

            {/* Pencil */}
            <button
              onClick={() => setActiveTool('pencil')}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTool === 'pencil'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Freehand Pencil Drawing"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Pencil</span>
            </button>

            {/* Highlight */}
            <button
              onClick={() => setActiveTool('highlight')}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTool === 'highlight'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Highlight Marker"
            >
              <Highlighter className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] mt-0.5">Highlight</span>
            </button>

            {/* Eraser */}
            <button
              onClick={() => setActiveTool('eraser')}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTool === 'eraser'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Whiteout Eraser"
            >
              <Eraser className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Eraser</span>
            </button>

            {/* Annotate */}
            <button
              onClick={() => setActiveTool('annotate')}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTool === 'annotate'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Add Sticky Note / Comment"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Annotate</span>
            </button>

            {/* Image */}
            <label className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-all">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Image</span>
              <input type="file" accept="image/*" onChange={handleImageAnnotationUpload} className="hidden" />
            </label>

            {/* Ellipse / Shape */}
            <button
              onClick={() => setActiveTool('ellipse')}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTool === 'ellipse'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Draw Circle / Ellipse"
            >
              <Circle className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Ellipse</span>
            </button>
          </div>
        )}

        {/* Right: Search & Done Button */}
        <div className="flex items-center gap-3">
          {file && (
            <>
              {/* Search / Find & Replace */}
              <button
                onClick={() => setShowSearchModal(!showSearchModal)}
                className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                  showSearchModal ? 'bg-indigo-50 text-indigo-600 font-bold' : ''
                }`}
                title="Search & Replace Words (Ctrl+F)"
              >
                <Search className="w-4 h-4" />
                <span className="hidden xl:inline">Search & Replace</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold hidden md:flex"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Studio'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Save & Download Button */}
              <button
                onClick={handleSaveAndDownload}
                disabled={isProcessing}
                className="px-4 sm:px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span className="hidden xs:inline">Save & Download PDF</span>
                <span className="xs:hidden">Save</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* SEARCH / FIND & REPLACE BAR (Toggled by Search) */}
      {file && showSearchModal && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 text-xs z-20 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 flex-1 shadow-2xs">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find word in document..."
                className="w-full bg-transparent text-slate-800 outline-none text-xs"
              />
              {searchMatchesCount > 0 && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  {searchMatchesCount} found
                </span>
              )}
            </div>

            <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 flex-1 shadow-2xs">
              <Replace className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace with..."
                className="w-full bg-transparent text-slate-800 outline-none text-xs"
              />
            </div>

            <button
              onClick={handleReplaceAll}
              disabled={!searchQuery.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg font-bold shadow-xs transition-colors shrink-0"
            >
              Replace All
            </button>
          </div>

          <button
            onClick={() => setShowSearchModal(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONTEXTUAL TOOLBAR FOR ACTIVE TOOL OPTIONS */}
      {file && (
        <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 overflow-x-auto gap-4 text-xs shrink-0 z-20 text-slate-700">
          
          {activeTool === 'edit_text' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                <PenLine className="w-3 h-3" />
                In-Place Text Editor Active
              </span>
              <span className="text-slate-500 text-[11px] hidden md:inline">
                Click any word or sentence on the PDF to edit or replace it directly.
              </span>
            </div>
          )}

          {activeTool === 'add_text' && (
            <div className="flex items-center gap-2">
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs outline-none"
              >
                <option value="Helvetica">Helvetica (Sans-Serif)</option>
                <option value="Times-Roman">Times New Roman (Serif)</option>
                <option value="Courier">Courier (Monospace)</option>
              </select>

              <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-0.5 gap-1">
                <span className="text-[10px] text-slate-500">Size:</span>
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-8 text-center font-bold outline-none text-xs"
                />
              </div>

              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border border-slate-300 bg-transparent"
                title="Font Color"
              />

              <div className="flex items-center bg-white border border-slate-300 rounded p-0.5">
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`p-1 rounded ${isBold ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  title="Bold"
                >
                  <Bold className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`p-1 rounded ${isItalic ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  title="Italic"
                >
                  <Italic className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {activeTool === 'highlight' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Color:</span>
              {['#FFE500', '#70E000', '#00E5FF', '#FF4081', '#C77DFF'].map((c) => (
                <button
                  key={c}
                  onClick={() => setHighlightColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    highlightColor === c ? 'scale-110 border-slate-800' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          {activeTool === 'pencil' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Thickness:</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-20 accent-blue-600"
                />
              </div>
              <input
                type="color"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                className="w-5 h-5 rounded border border-slate-300 cursor-pointer"
                title="Pen Color"
              />
            </div>
          )}

          {activeTool === 'ellipse' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Border Color:</span>
              <input
                type="color"
                value={shapeStrokeColor}
                onChange={(e) => setShapeStrokeColor(e.target.value)}
                className="w-5 h-5 rounded border border-slate-300 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* 2. MAIN WORKSPACE WITH LEFT SIDEBAR & CANVAS */}
      <div className="flex-1 flex overflow-hidden relative bg-[#f1f3f7]">
        
        {/* LEFT SIDEBAR: "Manage Pages" and Live Page Thumbnails */}
        {file && (
          <aside
            className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-200 shrink-0 z-10 ${
              sidebarOpen ? 'w-48 sm:w-56' : 'w-10'
            }`}
          >
            {/* Manage Pages Header Button */}
            <div className="p-2 border-b border-slate-200 flex items-center justify-between">
              {sidebarOpen ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Manage Pages</span>
                </div>
              ) : (
                <FileText className="w-4 h-4 text-blue-600 mx-auto" />
              )}

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Page Thumbnails List */}
            {sidebarOpen && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pg) => (
                  <div
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div
                      className={`w-full h-36 bg-white rounded-md border-2 overflow-hidden relative shadow-xs transition-all ${
                        currentPage === pg
                          ? 'border-blue-600 shadow-md ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {thumbnailUrls[pg - 1] ? (
                        <img
                          src={thumbnailUrls[pg - 1]}
                          alt={`Page ${pg}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <FileText className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Page Number Badge matching Screenshot (blue pill on active, gray on inactive) */}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        currentPage === pg
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 bg-slate-100 group-hover:bg-slate-200'
                      }`}
                    >
                      {pg}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* CENTER DOCUMENT CANVAS AREA */}
        <main
          ref={containerRef}
          className="flex-1 overflow-auto flex items-start justify-center p-4 sm:p-8 relative"
          onClick={handleCanvasClick}
        >
          {/* UPLOAD VIEW IF NO FILE */}
          {!file && (
            <div className="max-w-md w-full my-auto text-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-3xl shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Upload PDF Document</h3>
              <p className="text-xs text-slate-500 mb-6">
                Edit text, words, signatures, images, and shapes directly inside your document.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/30 active:scale-95 transition-all"
              >
                Choose PDF File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

          {/* ACTIVE PDF PAGE STAGE */}
          {file && (
            <div className="relative shadow-2xl rounded-sm bg-white ring-1 ring-slate-300/80 transition-transform">
              
              {/* PDF.js Render Canvas */}
              <canvas ref={pdfCanvasRef} className="block pointer-events-none" />

              {/* Freehand Drawing Temporary Stroke Canvas */}
              {(activeTool === 'pencil' || activeTool === 'highlight') && (
                <canvas
                  ref={drawCanvasRef}
                  width={pdfCanvasRef.current?.width || 800}
                  height={pdfCanvasRef.current?.height || 1100}
                  style={{
                    width: pdfCanvasRef.current?.style.width || '100%',
                    height: pdfCanvasRef.current?.style.height || '100%',
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMove}
                  onMouseUp={endDrawing}
                  className="absolute inset-0 z-20 cursor-crosshair"
                />
              )}

              {/* ============================================================== */}
              {/* IN-PLACE EXTRACTED TEXT LAYER (EDIT WORDS DIRECTLY ON DOCUMENT) */}
              {/* ============================================================== */}
              <div className="absolute inset-0 z-10 pointer-events-auto">
                {activePageTexts.map((item) => {
                  const isEditing = editingTextId === item.id;
                  const isHovered = hoveredTextId === item.id;
                  const isEditTextMode = activeTool === 'edit_text';

                  if (item.isDeleted) {
                    // Render solid whiteout over deleted text
                    return (
                      <div
                        key={item.id}
                        className="absolute bg-white"
                        style={{
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          width: `${item.width}%`,
                          height: `${item.height}%`,
                        }}
                      />
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredTextId(item.id)}
                      onMouseLeave={() => setHoveredTextId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditTextMode || activeTool === 'select') {
                          setEditingTextId(item.id);
                        }
                      }}
                      className={`absolute transition-all rounded-[2px] ${
                        isEditing
                          ? 'ring-2 ring-blue-500 bg-white z-30 shadow-md'
                          : item.isModified
                          ? 'bg-white z-20 ring-1 ring-blue-400'
                          : isEditTextMode && (isHovered || true)
                          ? 'hover:ring-1 hover:ring-blue-500 hover:bg-blue-50/20 cursor-text'
                          : ''
                      } ${
                        // Subtle dashed outline in Edit Text mode matching the user's reference image!
                        isEditTextMode && !isEditing && !item.isModified
                          ? 'border border-dashed border-slate-400/60 hover:border-blue-500'
                          : ''
                      }`}
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        minWidth: `${Math.max(item.width, 2)}%`,
                        minHeight: `${Math.max(item.height, 1.2)}%`,
                      }}
                    >
                      {/* Active Editable Input */}
                      {isEditing ? (
                        <div className="relative w-full h-full flex flex-col">
                          {/* Mini Format Toolbar Floating above active text */}
                          <div
                            className="absolute -top-9 left-0 bg-slate-900 text-white rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-xl text-xs z-40 whitespace-nowrap animate-in fade-in zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleFormatTextItem(item.id, { isBold: !item.isBold })}
                              className={`p-1 rounded ${item.isBold ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                              title="Bold"
                            >
                              <Bold className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFormatTextItem(item.id, { isItalic: !item.isItalic })}
                              className={`p-1 rounded ${item.isItalic ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                              title="Italic"
                            >
                              <Italic className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                handleFormatTextItem(item.id, {
                                  fontSize: Math.max(8, (item.fontSize || 12) - 1),
                                })
                              }
                              className="p-1 hover:bg-slate-800 rounded font-bold"
                              title="Smaller Text"
                            >
                              A-
                            </button>
                            <button
                              onClick={() =>
                                handleFormatTextItem(item.id, {
                                  fontSize: Math.min(48, (item.fontSize || 12) + 1),
                                })
                              }
                              className="p-1 hover:bg-slate-800 rounded font-bold"
                              title="Larger Text"
                            >
                              A+
                            </button>
                            <button
                              onClick={() => handleDeleteTextItem(item.id)}
                              className="p-1 hover:bg-red-600 rounded text-red-300 hover:text-white"
                              title="Delete Text"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingTextId(null)}
                              className="p-1 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold ml-1 px-1.5"
                              title="Done Editing"
                            >
                              ✓
                            </button>
                          </div>

                          <input
                            type="text"
                            autoFocus
                            value={item.currentText}
                            onChange={(e) => handleUpdateTextItem(item.id, e.target.value)}
                            onBlur={() => setEditingTextId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                setEditingTextId(null);
                              }
                            }}
                            className="w-full bg-white text-slate-900 outline-none px-0.5 border-none leading-none"
                            style={{
                              fontSize: `${(item.fontSize || 13) * (zoomScale / 1.0)}px`,
                              fontFamily:
                                item.fontFamily ||
                                (item.pdfFontType === 'serif'
                                  ? '"Times New Roman", Times, Georgia, serif'
                                  : item.pdfFontType === 'monospace'
                                  ? '"Courier New", Courier, monospace'
                                  : 'Helvetica, Arial, sans-serif'),
                              fontWeight: item.isBold ? 'bold' : 'normal',
                              fontStyle: item.isItalic ? 'italic' : 'normal',
                              color: item.color || '#111827',
                            }}
                          />
                        </div>
                      ) : (
                        // Render modified text cleanly masking underlying canvas
                        item.isModified && (
                          <div
                            className="w-full h-full bg-white text-slate-900 px-0.5 leading-none select-text flex items-center"
                            style={{
                              fontSize: `${(item.fontSize || 13) * (zoomScale / 1.0)}px`,
                              fontFamily:
                                item.fontFamily ||
                                (item.pdfFontType === 'serif'
                                  ? '"Times New Roman", Times, Georgia, serif'
                                  : item.pdfFontType === 'monospace'
                                  ? '"Courier New", Courier, monospace'
                                  : 'Helvetica, Arial, sans-serif'),
                              fontWeight: item.isBold ? 'bold' : 'normal',
                              fontStyle: item.isItalic ? 'italic' : 'normal',
                              color: item.color || '#111827',
                            }}
                          >
                            {item.currentText}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ============================================================== */}
              {/* ANNOTATIONS & OVERLAYS LAYER (SIGNATURES, SHAPES, TEXT BOXES)  */}
              {/* ============================================================== */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {activePageAnnotations.map((ann) => {
                  const isSelected = selectedAnnId === ann.id;

                  return (
                    <div
                      key={ann.id}
                      onMouseDown={(e) => handleStartDrag(ann.id, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnnId(ann.id);
                      }}
                      className={`absolute pointer-events-auto transition-shadow ${
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-blue-300'
                      }`}
                      style={{
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                        width: ann.width ? `${ann.width}%` : undefined,
                        height: ann.height ? `${ann.height}%` : undefined,
                        transform: 'translate(0, 0)',
                      }}
                    >
                      {/* Delete floating button when selected */}
                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnnotation(ann.id);
                          }}
                          className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-500 z-30"
                          title="Delete"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Text Annotation */}
                      {ann.type === 'text' && (
                        <div
                          className={`p-1 select-text ${
                            ann.hasWhiteoutBg ? 'bg-white rounded shadow-2xs' : ''
                          }`}
                          style={{
                            fontSize: `${(ann.fontSize || 14) * (zoomScale / 1.0)}px`,
                            color: ann.color || '#111827',
                            fontWeight: ann.isBold ? 'bold' : 'normal',
                            fontStyle: ann.isItalic ? 'italic' : 'normal',
                            fontFamily:
                              ann.fontFamily === 'Times-Roman'
                                ? 'Times New Roman, serif'
                                : ann.fontFamily === 'Courier'
                                ? 'Courier New, monospace'
                                : 'Helvetica, Arial, sans-serif',
                          }}
                        >
                          {ann.content}
                        </div>
                      )}

                      {/* Whiteout Patch */}
                      {ann.type === 'whiteout' && (
                        <div className="w-full h-full bg-white border border-slate-300/40 rounded-xs shadow-2xs" />
                      )}

                      {/* Signature / Stamp Image */}
                      {(ann.type === 'signature' || ann.type === 'image' || ann.type === 'stamp') && (
                        <img
                          src={ann.content}
                          alt="Annotation"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      )}

                      {/* Circle / Ellipse Shape */}
                      {ann.type === 'shape' && (
                        <div
                          className="w-full h-full rounded-full border-2"
                          style={{
                            borderColor: ann.color || '#2563eb',
                            backgroundColor: ann.fillColor || 'transparent',
                          }}
                        />
                      )}

                      {/* Freehand Pencil Stroke Render */}
                      {ann.type === 'draw' && ann.points && (
                        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                          <polyline
                            points={ann.points.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={ann.color || '#1e293b'}
                            strokeWidth={ann.strokeWidth || 2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={ann.opacity ?? 1}
                          />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </main>
      </div>

      {/* 3. SIGNATURE CREATION MODAL */}
      {showSigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-600" />
                <span>Create Signature or Official Stamp</span>
              </h3>
              <button
                onClick={() => setShowSigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setSigType('draw')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  sigType === 'draw' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                Draw
              </button>
              <button
                onClick={() => setSigType('type')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  sigType === 'type' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                Type
              </button>
              <button
                onClick={() => setSigType('stamp')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  sigType === 'stamp' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                Stamps
              </button>
            </div>

            <div className="p-6">
              {sigType === 'draw' && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Draw your signature with your mouse or stylus:</p>
                  <canvas
                    ref={sigCanvasRef}
                    width={440}
                    height={160}
                    onMouseDown={(e) => {
                      const canvas = sigCanvasRef.current;
                      if (!canvas) return;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      const rect = canvas.getBoundingClientRect();
                      ctx.beginPath();
                      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                      ctx.strokeStyle = '#0f172a';
                      ctx.lineWidth = 2.5;
                      ctx.lineCap = 'round';
                      const onMove = (mv: MouseEvent) => {
                        ctx.lineTo(mv.clientX - rect.left, mv.clientY - rect.top);
                        ctx.stroke();
                      };
                      const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                    className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => {
                        const canvas = sigCanvasRef.current;
                        const ctx = canvas?.getContext('2d');
                        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                    >
                      Clear Pad
                    </button>
                  </div>
                </div>
              )}

              {sigType === 'type' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name:</label>
                    <input
                      type="text"
                      value={sigTypedName}
                      onChange={(e) => setSigTypedName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-3xl italic font-serif text-slate-900 font-semibold">
                      {sigTypedName || 'Signature'}
                    </span>
                  </div>
                </div>
              )}

              {sigType === 'stamp' && (
                <div className="grid grid-cols-2 gap-3">
                  {['APPROVED', 'CONFIDENTIAL', 'FINAL', 'DRAFT', 'PAID', 'RECEIVED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStamp(st)}
                      className={`p-3 rounded-xl border-2 font-black text-sm tracking-wider transition-all ${
                        selectedStamp === st
                          ? 'border-red-600 bg-red-50 text-red-600 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowSigModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={applySignature}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Insert Signature
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
