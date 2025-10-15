import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Print from '../Print/Print';
import { Select, FormControl, InputLabel, Slider } from '@mui/material';
import { Toolbar, Button, MenuList, MenuItem, Menu, ListItemText, Typography, ListItemIcon, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, TextField } from '@mui/material';
import { ContentCopy, ContentCut, ContentPaste, PrintOutlined, RedoOutlined, SaveOutlined, UndoOutlined, Dashboard } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useNavigate } from 'react-router-dom';
import AccountMenu from '../AppBar/AccountMenu';
import { NewMenuItem } from '../AppBar/NewMenu';

const MainToolbar: React.FC = () => {
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectMenuAnchorEl, setSelectMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { resetStore, undo, redo, cutShape, copyShape, pasteShape, selectAll, selectShapes, selectConnectors, activeSheetId, sheets, isDirty } = useDiagramStore();
  const currentUser = useDiagramStore(state => state.currentUser);
  const serverUrl = useDiagramStore(state => state.serverUrl) || 'http://localhost:4000';
  const { history } = useHistoryStore();
  const activeSheet = sheets[activeSheetId];
  const navigate = useNavigate();
  const diagramName = useDiagramStore(state => state.diagramName) || 'New Diagram';
  const setDiagramName = useDiagramStore(state => state.setDiagramName);
  const [editNameOpen, setEditNameOpen] = React.useState(false);
  const [editingName, setEditingName] = React.useState(diagramName);
  const [pendingNewCreation, setPendingNewCreation] = React.useState(false);

  // If activeSheet is undefined, it means the store state is inconsistent
  if (!activeSheet) {
    console.error('Active sheet not found, resetting store');
    resetStore();
    return <div>Loading...</div>;
  }

  const handleFileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Open File and ensure other menus are closed
    setFileMenuAnchorEl(event.currentTarget as HTMLElement);
    setEditMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    clearHoverTimer();
    setMenubarActive(true);
  };

  // When any top-level menu is open, hovering over another top-level menu should open it
  const [menubarActive, setMenubarActive] = useState(false);
  // Refs for top-level menu items so we can open/ focus them programmatically
  const fileRef = useRef<HTMLButtonElement | null>(null);
  const editRef = useRef<HTMLButtonElement | null>(null);
  const selectRef = useRef<HTMLButtonElement | null>(null);
  // Export is now its own top-level menu
  const exportRef = useRef<HTMLButtonElement | null>(null);
  // data-attribute will be used to detect clicks on the Export menu item
  // Hover-delay timer to avoid accidental menu switches
  const hoverTimerRef = useRef<number | null>(null);
  const HOVER_DELAY_MS = 200;
  const hoverCandidateRef = useRef<'file'|'edit'|'select'|'export' | null>(null);

  const handleTopLevelMouseEnter = (event: React.MouseEvent<HTMLElement>, menu: 'file' | 'edit' | 'select' | 'export') => {
    // Only allow hover-to-open if the menubar has been activated (menu opened)
    if (!menubarActive) return;
    // Debounce switching menus on hover to avoid accidental switches
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    hoverTimerRef.current = window.setTimeout(() => {
      const target = event.currentTarget as HTMLElement;
      if (menu === 'file') {
        setFileMenuAnchorEl(target);
        setEditMenuAnchorEl(null);
        setSelectMenuAnchorEl(null);
        setExportMenuAnchorEl(null);
      } else if (menu === 'edit') {
        setEditMenuAnchorEl(target);
        setFileMenuAnchorEl(null);
        setSelectMenuAnchorEl(null);
        setExportMenuAnchorEl(null);
      } else if (menu === 'select') {
        setSelectMenuAnchorEl(target);
        setFileMenuAnchorEl(null);
        setEditMenuAnchorEl(null);
        setExportMenuAnchorEl(null);
      } else if (menu === 'export') {
        setExportMenuAnchorEl(target);
        setFileMenuAnchorEl(null);
        setEditMenuAnchorEl(null);
        setSelectMenuAnchorEl(null);
      }
    }, HOVER_DELAY_MS);
  };

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    clearHoverTimer();
    setExportMenuAnchorEl(event.currentTarget as HTMLElement);
    // Standard top-level behavior: close other top-level menus when opening Export
    setFileMenuAnchorEl(null);
    setEditMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    setMenubarActive(true);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
    // Preserve menubarActive if any top-level menu is still open (for example File)
    setMenubarActive(Boolean(fileMenuAnchorEl || editMenuAnchorEl || selectMenuAnchorEl));
    clearHoverTimer();
  };

  // Helpers to download blobs/data-urls
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    // Convert data URL to blob then download
    const parts = dataUrl.split(',');
    const m = parts[0].match(/:(.*?);/);
    const mime = m ? m[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const blob = new Blob([u8arr], { type: mime });
    downloadBlob(blob, filename);
  };

  // Export handlers for the currently selected sheet
  const handleExportCurrentAsPng = async () => {
    if (!activeSheet) return;
    const widthPx = exportWidthPx;
    const heightPx = exportHeightPx;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/png');
    if (res.dataUrl) {
      const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.png`;
      downloadDataUrl(res.dataUrl, name);
    } else {
      alert('Failed to render sheet for PNG export');
    }
    handleFileMenuClose(); 
    handleExportMenuClose();
  };

  const handleExportCurrentAsJpg = async () => {
    if (!activeSheet) return;
    const widthPx = exportWidthPx;
    const heightPx = exportHeightPx;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/jpeg', jpegQuality);
    if (res.dataUrl) {
      const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.jpg`;
      downloadDataUrl(res.dataUrl, name);
    } else {
      alert('Failed to render sheet for JPG export');
    }
    handleFileMenuClose(); 
    handleExportMenuClose();
  };

  const handleExportCurrentAsPdf = async () => {
    if (!activeSheet) return;
    const widthPx = exportWidthPx;
    const heightPx = exportHeightPx;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/png');
    if (!res.dataUrl) {
      alert('Failed to render sheet for PDF export');
      handleFileMenuClose(); 
      handleExportMenuClose();
      return;
    }
    try {
      const jspdfModule: any = await import('jspdf');
      const jsPDFClass: any = jspdfModule && (jspdfModule.jsPDF || jspdfModule.default || jspdfModule);
      const fileName = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.pdf`;
      if (pdfPageSize === 'image') {
        const doc = new jsPDFClass({ orientation: widthPx > heightPx ? 'landscape' : 'portrait', unit: 'px', format: [widthPx, heightPx] });
        doc.addImage(res.dataUrl, 'PNG', 0, 0, widthPx, heightPx);
        doc.save(fileName);
      } else if (pdfPageSize === 'a4_portrait' || pdfPageSize === 'a4_landscape' || pdfPageSize === 'letter_portrait' || pdfPageSize === 'letter_landscape') {
        const format = pdfPageSize.startsWith('a4') ? 'a4' : 'letter';
        const orientation = pdfPageSize.endsWith('landscape') ? 'landscape' : 'portrait';
        const doc = new jsPDFClass({ orientation, unit: 'in', format });
        const imgInW = widthPx / 96;
        const imgInH = heightPx / 96;
        // derive page dimensions in inches
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const scale = Math.min(pageW / imgInW, pageH / imgInH);
        const w = imgInW * scale;
        const h = imgInH * scale;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;
        doc.addImage(res.dataUrl, 'PNG', x, y, w, h);
        doc.save(fileName);
      } else if (pdfPageSize === 'custom') {
        const doc = new jsPDFClass({ orientation: pdfCustomWidthIn > pdfCustomHeightIn ? 'landscape' : 'portrait', unit: 'in', format: [pdfCustomWidthIn, pdfCustomHeightIn] });
        const imgInW = widthPx / 96;
        const imgInH = heightPx / 96;
        const scale = Math.min(pdfCustomWidthIn / imgInW, pdfCustomHeightIn / imgInH);
        const w = imgInW * scale;
        const h = imgInH * scale;
        const x = (pdfCustomWidthIn - w) / 2;
        const y = (pdfCustomHeightIn - h) / 2;
        doc.addImage(res.dataUrl, 'PNG', x, y, w, h);
        doc.save(fileName);
      }
    } catch (e) {
      console.error('PDF export failed', e);
      alert('PDF export failed. Please ensure jspdf is installed.');
    }
  handleFileMenuClose(); handleExportMenuClose();
  };

  const handleExportCurrentAsGif = async () => {
    if (!activeSheet) return;
    const widthPx = exportWidthPx;
    const heightPx = exportHeightPx;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/png');
    if (!res.canvas) {
      alert('Failed to render sheet for GIF export');
      handleFileMenuClose(); 
      handleExportMenuClose();
      return;
    }
    try {
      // Try to load gif.js (optimized version) first
      // Prefer the optimized build if available, fall back to the main package
      let gifModule: any = null;
      try {
        gifModule = await import('gif.js.optimized');
      } catch (_) {
        gifModule = await import('gif.js');
      }
      const GIFClass: any = gifModule && (gifModule.default || gifModule.GIF || gifModule);

      // Resolve a worker script URL in several ways:
      // 1) Use bundler asset import with ?url (preferred for Vite)
      // 2) Fall back to importing the raw worker script and creating a Blob URL
      // 3) Finally let gif.js attempt to load its default worker (may fail)
      let workerUrl: string | null = null;
      let createdBlobUrl: string | null = null;
      try {
        const modUrl: any = await import('gif.js.optimized/dist/gif.worker.js?url');
        workerUrl = modUrl && (modUrl.default || modUrl);
      } catch (_) {
        try {
          const modUrl: any = await import('gif.js/dist/gif.worker.js?url');
          workerUrl = modUrl && (modUrl.default || modUrl);
        } catch (__) {
          // try raw -> blob fallback
          try {
            const modRaw: any = await import('gif.js.optimized/dist/gif.worker.js?raw');
            const workerText = modRaw && (modRaw.default || modRaw);
            createdBlobUrl = URL.createObjectURL(new Blob([workerText], { type: 'application/javascript' }));
            workerUrl = createdBlobUrl;
          } catch (___) {
            try {
              const modRaw2: any = await import('gif.js/dist/gif.worker.js?raw');
              const workerText2 = modRaw2 && (modRaw2.default || modRaw2);
              createdBlobUrl = URL.createObjectURL(new Blob([workerText2], { type: 'application/javascript' }));
              workerUrl = createdBlobUrl;
            } catch (err) {
              console.warn('Unable to resolve gif.worker.js via ?url or ?raw; gif export may fail', err);
            }
          }
        }
      }

      const gifOptions: any = { workers: 2, quality: 10, width: widthPx, height: heightPx };
      if (workerUrl) {
        // Validate that the resolved worker URL returns JavaScript and not an HTML SPA fallback
        try {
          const resp = await fetch(workerUrl, { method: 'GET' });
          const ct = resp.headers.get('content-type') || '';
          if (!/javascript|ecmascript/.test(ct) && !/application\/javascript/.test(ct) && !/text\/javascript/.test(ct)) {
            console.warn('Resolved worker script does not appear to be JavaScript (content-type:', ct, '). Will ignore and attempt fallbacks.');
            workerUrl = null;
          }
        } catch (e) {
          console.warn('Failed to validate worker url, will attempt fallbacks', e);
          workerUrl = null;
        }
      }

      // If workerUrl still not found, try a public path (/gif.worker.js) which
      // is the simplest option for apps that serve static assets from public/.
      if (!workerUrl) {
        try {
          const test = await fetch('/gif.worker.js', { method: 'HEAD' });
          const ct2 = test.headers.get('content-type') || '';
          if (test.ok && (/javascript|application\/javascript|text\/javascript/.test(ct2))) {
            workerUrl = '/gif.worker.js';
          }
        } catch (e) {
          // ignore
        }
      }

      if (workerUrl) gifOptions.workerScript = workerUrl;
      const gif = new GIFClass(gifOptions);
      // Ensure GIF background is white: composite the rendered canvas onto
      // a new canvas with a white fill so transparent areas become white.
      const whiteCanvas = document.createElement('canvas');
      whiteCanvas.width = (res.canvas as HTMLCanvasElement).width;
      whiteCanvas.height = (res.canvas as HTMLCanvasElement).height;
      const wctx = whiteCanvas.getContext('2d');
      if (wctx) {
        wctx.fillStyle = '#ffffff';
        wctx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);
        wctx.drawImage(res.canvas as HTMLCanvasElement, 0, 0);
      }
      gif.addFrame(whiteCanvas, { copy: true, delay: 0 });
      gif.on('finished', (blob: Blob) => {
        const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.gif`;
        downloadBlob(blob, name);
        // Clean up any created blob URL for the worker script
        if (createdBlobUrl) {
          URL.revokeObjectURL(createdBlobUrl);
        }
      });
      gif.render();
    } catch (e) {
      console.warn('GIF export failed or gif.js not installed', e);
      // Fallback to PNG download
      const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.png`;
      if (res.dataUrl) downloadDataUrl(res.dataUrl, name);
      alert('GIF export requires gif.js. PNG has been saved instead.');
    }
  handleFileMenuClose(); handleExportMenuClose();
  };

  const handleExportCurrentAsTiff = async () => {
    if (!activeSheet) return;
    const widthPx = exportWidthPx;
    const heightPx = exportHeightPx;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/png');
    if (!res.canvas) {
      alert('Failed to render sheet for TIFF export');
      handleFileMenuClose(); 
      handleExportMenuClose();
      return;
    }
    try {
      const utifModule = await import('utif');
      const UTIF: any = utifModule && (utifModule.default || utifModule);
      const ctx = res.canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      const imgData = ctx.getImageData(0, 0, widthPx, heightPx);
      // Attempt several possible encoding entry points for common UTIF builds
      let tiffBuffer: ArrayBuffer | null = null;
      if (UTIF && typeof UTIF.encodeImage === 'function') {
        // encodeImage may return ArrayBuffer (best-effort guess)
        tiffBuffer = UTIF.encodeImage(imgData.data, widthPx, heightPx);
      } else if (UTIF && typeof UTIF.encode === 'function') {
        // Some builds accept an array of IFD-like objects
        try {
          const ifd = { data: imgData.data, width: widthPx, height: heightPx };
          tiffBuffer = UTIF.encode([ifd]);
        } catch (e) {
          // ignore and try other approaches
        }
      }
      if (!tiffBuffer) throw new Error('UTIF encoding API not found');
      const blob = new Blob([tiffBuffer], { type: 'image/tiff' });
      const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.tiff`;
      downloadBlob(blob, name);
    } catch (e) {
      console.warn('TIFF export failed or utif not installed', e);
      // Fallback to PNG download
      const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.png`;
      if (res.dataUrl) downloadDataUrl(res.dataUrl, name);
      alert('TIFF export requires a TIFF encoder (utif). PNG has been saved instead.');
    }
  handleFileMenuClose(); handleExportMenuClose();
  };

  // Fallback: listen to global mouse movements when menubar is active so
  // overlaying popovers don't prevent us from detecting pointer location
  useEffect(() => {
    if (!menubarActive) return;
    const onMove = (ev: MouseEvent) => {
      try {
        const x = ev.clientX;
        const y = ev.clientY;
        const checkRect = (el: HTMLElement | null) => {
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        };
  let candidate: 'file'|'edit'|'select'|'export' | null = null;
  if (checkRect(fileRef.current)) candidate = 'file';
  else if (checkRect(editRef.current)) candidate = 'edit';
  else if (checkRect(selectRef.current)) candidate = 'select';
  else if (checkRect(exportRef.current)) candidate = 'export';
        
        if (candidate === hoverCandidateRef.current) return;
        hoverCandidateRef.current = candidate;
        if (hoverTimerRef.current) {
          window.clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        if (!candidate) return;
        hoverTimerRef.current = window.setTimeout(() => {
          openMenuByName(candidate as 'file'|'edit'|'select'|'export');
          hoverTimerRef.current = null;
          hoverCandidateRef.current = null;
        }, HOVER_DELAY_MS);
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearHoverTimer();
      hoverCandidateRef.current = null;
    };
  }, [menubarActive]);

  const handleFileMenuClose = () => {
    setFileMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Open Edit and ensure other menus are closed
    clearHoverTimer();
    setEditMenuAnchorEl(event.currentTarget as HTMLElement);
    setFileMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    setMenubarActive(true);
  };

  const handleEditMenuClose = () => {
    setEditMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  const handleSelectMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Open Select and ensure other menus are closed
    clearHoverTimer();
    setSelectMenuAnchorEl(event.currentTarget as HTMLElement);
    setFileMenuAnchorEl(null);
    setEditMenuAnchorEl(null);
    setMenubarActive(true);
  };

  const handleSelectMenuClose = () => {
    setSelectMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  // Ensure menubarActive reflects whether any menu is open (covers keyboard-open cases)
  useEffect(() => {
    setMenubarActive(Boolean(fileMenuAnchorEl || editMenuAnchorEl || selectMenuAnchorEl || exportMenuAnchorEl));
  }, [fileMenuAnchorEl, editMenuAnchorEl, selectMenuAnchorEl, exportMenuAnchorEl]);

  const openMenuByName = (name: 'file' | 'edit' | 'select' | 'export') => {
    // Clear any pending hover timers and open the requested menu while
    // ensuring other menus are closed.
    clearHoverTimer();
    if (name === 'file') {
      if (fileRef.current) setFileMenuAnchorEl(fileRef.current);
      setEditMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
      setExportMenuAnchorEl(null);
    } else if (name === 'edit') {
      if (editRef.current) setEditMenuAnchorEl(editRef.current);
      setFileMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
      setExportMenuAnchorEl(null);
    } else if (name === 'select') {
      if (selectRef.current) setSelectMenuAnchorEl(selectRef.current);
      setFileMenuAnchorEl(null);
      setEditMenuAnchorEl(null);
      setExportMenuAnchorEl(null);
    } else if (name === 'export') {
      if (exportRef.current) setExportMenuAnchorEl(exportRef.current);
      setFileMenuAnchorEl(null);
      setEditMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
    }
    setMenubarActive(true);
  };

  const closeAllMenus = () => {
    setFileMenuAnchorEl(null);
    setEditMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent, current: 'file' | 'edit' | 'select' | 'export') => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const order: ('file'|'edit'|'select'|'export')[] = ['file','edit','select','export'];
      const idx = order.indexOf(current as any);
      const next = order[(idx + 1) % order.length];
      openMenuByName(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const order: ('file'|'edit'|'select'|'export')[] = ['file','edit','select','export'];
      const idx = order.indexOf(current as any);
      const prev = order[(idx + order.length - 1) % order.length];
      openMenuByName(prev);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeAllMenus();
    }
  };

  // Keep menubarActive in sync with any open anchor so keyboard-open also enables hover switching
  useEffect(() => {
    setMenubarActive(Boolean(fileMenuAnchorEl || editMenuAnchorEl || selectMenuAnchorEl || exportMenuAnchorEl));
  }, [fileMenuAnchorEl, editMenuAnchorEl, selectMenuAnchorEl, exportMenuAnchorEl]);

  // When the Export submenu is open, clicking anywhere in the document outside
  // the menubar or any menu popover should close the Export submenu. This
  // handles clicks on the canvas or other document areas so the submenu isn't
  // left open when the user interacts with the diagram.
  useEffect(() => {
    if (!exportMenuAnchorEl) return;

    const handleDocumentMouseDown = (ev: MouseEvent) => {
      try {
        const target = ev.target as Element | null;
        if (!target) return;

        // If the click occurred inside any MUI menu popover, ignore it
        // (lets the menu items handle their own clicks).
        if (target.closest('.MuiMenu-paper')) return;

        // If the click occurred within the menubar (toolbar) itself, ignore
        // because interactions there should not implicitly close the Export submenu.
        if (target.closest('[role="menubar"]')) return;

        // Otherwise the click is outside the menubar/menus (e.g. on the
        // document/canvas) — close the Export submenu.
        handleExportMenuClose();
      } catch (e) {
        // swallow any errors so we don't break global click handling
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [exportMenuAnchorEl, handleExportMenuClose]);

  const handlePrint = () => {
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';
    document.body.appendChild(printContainer);
    const root = createRoot(printContainer);
    root.render(<Print />);

    setTimeout(() => {
      window.print();
      document.body.removeChild(printContainer);
    }, 500);

    handleFileMenuClose();
  };

  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  // Export settings state
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false);
  const [exportResolutionOption, setExportResolutionOption] = useState<'800x450'|'1280x720'|'1600x900'|'1920x1080'|'3840x2160'|'custom'>('1600x900');
  const [exportWidthPx, setExportWidthPx] = useState<number>(1600);
  const [exportHeightPx, setExportHeightPx] = useState<number>(900);
  const [jpegQuality, setJpegQuality] = useState<number>(0.92);
  const [pdfPageSize, setPdfPageSize] = useState<'image'|'a4_portrait'|'a4_landscape'|'letter_portrait'|'letter_landscape'|'custom'>('image');
  const [pdfCustomWidthIn, setPdfCustomWidthIn] = useState<number>(8.5);
  const [pdfCustomHeightIn, setPdfCustomHeightIn] = useState<number>(11);
  // Local storage key and helper for persisting export settings
  type ExportSettings = {
    exportResolutionOption: '800x450'|'1280x720'|'1600x900'|'1920x1080'|'3840x2160'|'custom';
    exportWidthPx: number;
    exportHeightPx: number;
    jpegQuality: number;
    pdfPageSize: 'image'|'a4_portrait'|'a4_landscape'|'letter_portrait'|'letter_landscape'|'custom';
    pdfCustomWidthIn: number;
    pdfCustomHeightIn: number;
  };
  // Persist export settings on the server only. LocalStorage mirror removed.
  const prevExportSettingsRef = React.useRef<ExportSettings | null>(null);

  // Load any persisted export settings from server when the user is signed in.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentUser) return; // server-only persistence
      try {
        const { apiFetch } = await import('../../utils/apiFetch');
        const resp = await apiFetch(`${serverUrl}/users/me/settings`, { method: 'GET' });
        if (!resp.ok) return;
        const json = await resp.json();
        const srv = json.settings && json.settings.exportSettings;
        if (srv && !cancelled) {
          if (srv.exportResolutionOption) setExportResolutionOption(srv.exportResolutionOption as any);
          if (typeof srv.exportWidthPx === 'number') setExportWidthPx(srv.exportWidthPx);
          if (typeof srv.exportHeightPx === 'number') setExportHeightPx(srv.exportHeightPx);
          if (typeof srv.jpegQuality === 'number') setJpegQuality(srv.jpegQuality);
          if (srv.pdfPageSize) setPdfPageSize(srv.pdfPageSize as any);
          if (typeof srv.pdfCustomWidthIn === 'number') setPdfCustomWidthIn(srv.pdfCustomWidthIn);
          if (typeof srv.pdfCustomHeightIn === 'number') setPdfCustomHeightIn(srv.pdfCustomHeightIn);
        }
      } catch (e) {
        console.warn('Failed to load export settings from server', e);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [currentUser, serverUrl]);

  // Open settings helper that snapshots current values so Cancel can revert
  const openExportSettings = () => {
    prevExportSettingsRef.current = {
      exportResolutionOption,
      exportWidthPx,
      exportHeightPx,
      jpegQuality,
      pdfPageSize,
      pdfCustomWidthIn,
      pdfCustomHeightIn,
    };
    setExportSettingsOpen(true);
  };

  const renderSheetToImage = async (sheetId: string, widthPx = 1600, heightPx = 900, mimeType = 'image/png', quality?: number): Promise<{ dataUrl: string | null; canvas?: HTMLCanvasElement | null }> => {
    if (typeof document === 'undefined') return { dataUrl: null };
    return new Promise<{ dataUrl: string | null; canvas?: HTMLCanvasElement | null }>(async (resolve) => {
      const container = document.createElement('div');
      // Keep offscreen but renderable
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0px';
      container.style.width = `${widthPx}px`;
      container.style.height = `${heightPx}px`;
      container.style.overflow = 'hidden';
      container.style.visibility = 'hidden';
      document.body.appendChild(container);

      try {
        const root = createRoot(container);
        root.render(<Print sheetId={sheetId} />);

        const waitForSvg = (): Promise<SVGSVGElement | null> => new Promise((res) => {
          let attempts = 0;
          const interval = window.setInterval(() => {
            const svg = container.querySelector('svg.print-svg') as SVGSVGElement | null;
            if (svg) {
              window.clearInterval(interval);
              res(svg);
              return;
            }
            attempts += 1;
            // timeout after ~5s
            if (attempts > 50) {
              window.clearInterval(interval);
              res(null);
            }
          }, 100);
        });

        const svg = await waitForSvg();
        if (!svg) {
          try { root.unmount(); } catch (e) {}
          document.body.removeChild(container);
          resolve({ dataUrl: null });
          return;
        }

        const { canvas, dataUrl } = await (await import('../../utils/thumbnail')).rasterizeSvgElement(svg, widthPx, heightPx, mimeType, quality);
        try { root.unmount(); } catch (e) {}
        document.body.removeChild(container);
        resolve({ dataUrl: dataUrl || null, canvas });
      } catch (err) {
        console.error('Error rendering sheet for export', err);
        try { document.body.removeChild(container); } catch (e) {}
        resolve({ dataUrl: null });
      }
    });
  };

  const handleExportToPowerPoint = async () => {
    setIsExportingPpt(true);
    const sheetIds = Object.keys(sheets || {});
    setExportProgress({ current: 0, total: sheetIds.length });
    try {
      const pptxMod: any = await import('pptxgenjs');
      const PPTXClass = (pptxMod && (pptxMod.default || pptxMod)) as any;
      const pptx = new PPTXClass();

  // Standard slide width in inches. Compute height to preserve chosen export aspect ratio.
  const slideWidthInches = 10;
  const slideHeightInches = exportWidthPx && exportHeightPx ? slideWidthInches * (exportHeightPx / exportWidthPx) : (10 * (9 / 16));

      for (let i = 0; i < sheetIds.length; i++) {
        const id = sheetIds[i];
        setExportProgress({ current: i + 1, total: sheetIds.length });
  // Render using the configured export resolution for embedding
  const result = await renderSheetToImage(id, exportWidthPx, exportHeightPx, 'image/png');
        const png = result.dataUrl;
        if (!png) {
          // Add an empty slide with sheet name if rendering failed
          const slide = pptx.addSlide();
          slide.addText(sheets[id]?.name || `Sheet ${i + 1}`, { x: 1, y: 1, fontSize: 24 });
          continue;
        }

        const slide = pptx.addSlide();
        // Add image covering the entire slide
        try {
          slide.addImage({ data: png, x: 0, y: 0, w: slideWidthInches, h: slideHeightInches });
        } catch (e) {
          console.warn('Failed to add image to slide using numeric dimensions, trying percent fallback', e);
          try {
            // Some pptxgenjs versions accept percentage strings
            slide.addImage({ data: png, x: '0%', y: '0%', w: '100%', h: '100%' });
          } catch (e2) {
            console.error('Failed to add image to slide', e2);
            slide.addText(sheets[id]?.name || `Sheet ${i + 1}`, { x: 1, y: 1, fontSize: 24 });
          }
        }
      }

      // Attempt to write file; API varies between versions but writeFile with fileName is widely supported
      const fileName = `${diagramName || 'diagram'}.pptx`;
      if (typeof pptx.writeFile === 'function') {
        await pptx.writeFile({ fileName });
      } else if (typeof pptx.save === 'function') {
        // older alias
        await pptx.save(fileName);
      } else {
        throw new Error('pptx export API not found');
      }
    } catch (err) {
      console.error('Export to PowerPoint failed', err);
      alert('Export to PowerPoint failed. See console for details.');
    } finally {
      setIsExportingPpt(false);
      setExportProgress(null);
      handleFileMenuClose(); handleExportMenuClose();
    }
  };

  const { saveDiagram } = useDiagramStore();
  const isEditable = useDiagramStore(state => state.isEditable !== false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        handlePrint();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        if (isEditable) saveDiagram();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrint, saveDiagram]);

  const [confirmNewOpen, setConfirmNewOpen] = useState(false);

  const handleNewDiagramConfirmed = () => {
    // User confirmed discarding unsaved changes — proceed to prompt for a name
    setConfirmNewOpen(false);
    setEditingName('New Diagram');
    setEditNameOpen(true);
    handleExportMenuClose();
    handleFileMenuClose();
  };

  const handleNewDiagram = () => {
    // Start the 'create new diagram' flow. If there are unsaved changes, ask the user
    // to confirm discarding them, otherwise prompt for a name immediately.
    // Close any open export submenu before proceeding
    handleExportMenuClose();
    setPendingNewCreation(true);
    if (isDirty) {
      setConfirmNewOpen(true);
    } else {
      setEditingName('New Diagram');
      setEditNameOpen(true);
      handleFileMenuClose();
    }
  };

  const handleUndo = () => {
    undo();
    handleEditMenuClose();
  };

  const handleRedo = () => {
    redo();
    handleEditMenuClose();
  };

  const handleCut = () => {
    if (activeSheet?.selectedShapeIds?.length > 0) {
      cutShape(activeSheet.selectedShapeIds);
    }
    handleEditMenuClose();
  };

  const handleCopy = () => {
    if (activeSheet?.selectedShapeIds?.length > 0) {
      copyShape(activeSheet.selectedShapeIds);
    }
    handleEditMenuClose();
  };

  const handlePaste = () => {
    pasteShape();
    handleEditMenuClose();
  };

  const handleSelectAll = () => {
    selectAll();
    handleSelectMenuClose();
  };

  const handleSelectShapes = () => {
    selectShapes();
    handleSelectMenuClose();
  };

  const handleSelectLines = () => {
    selectConnectors();
    handleSelectMenuClose();
  };

  return (
  <Toolbar disableGutters variant="dense" sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}`, padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'inherit', minHeight: '2em' }}>
      {/* Diagram name display and edit (moved before File menu) */}
  <Button color="inherit" onClick={() => { setEditingName(diagramName); setEditNameOpen(true); }} sx={{ textTransform: 'none', mr: 1 }}>
        <Typography variant="subtitle1" sx={{ maxWidth: '128px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{diagramName}</Typography>
      </Button>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <MenuList role="menubar" aria-label="Main menu" sx={{ display: 'flex', alignItems: 'center' }} onMouseLeave={() => clearHoverTimer()}>
        <MenuItem
          component="button"
          ref={fileRef}
          onClick={handleFileMenuOpen}
          onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'file')}
          onMouseLeave={() => clearHoverTimer()}
          aria-haspopup="true"
          aria-controls={fileMenuAnchorEl ? 'file-menu' : undefined}
          aria-expanded={Boolean(fileMenuAnchorEl)}
          sx={{ color: 'inherit', ml: 1 }}
        >
          File
        </MenuItem>
        <MenuItem
          component="button"
          ref={editRef}
          onClick={handleEditMenuOpen}
          onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'edit')}
          onMouseLeave={() => clearHoverTimer()}
          aria-haspopup="true"
          aria-controls={editMenuAnchorEl ? 'edit-menu' : undefined}
          aria-expanded={Boolean(editMenuAnchorEl)}
          sx={{ color: 'inherit' }}
        >
          Edit
        </MenuItem>
        <MenuItem
          component="button"
          ref={selectRef}
          onClick={handleSelectMenuOpen}
          onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'select')}
          onMouseLeave={() => clearHoverTimer()}
          aria-haspopup="true"
          aria-controls={selectMenuAnchorEl ? 'select-menu' : undefined}
          aria-expanded={Boolean(selectMenuAnchorEl)}
          sx={{ color: 'inherit' }}
        >
          Select
        </MenuItem>
        <MenuItem
          component="button"
          ref={exportRef}
          onClick={(e) => { handleExportMenuOpen(e); /* close other top menus like a normal menubar click */ setFileMenuAnchorEl(null); }}
          onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'export')}
          onMouseLeave={() => clearHoverTimer()}
          aria-haspopup="true"
          aria-controls={exportMenuAnchorEl ? 'export-menu' : undefined}
          aria-expanded={Boolean(exportMenuAnchorEl)}
          sx={{ color: 'inherit' }}
        >
          Export
        </MenuItem>
      </MenuList>

      {/* File menu */}
      <Menu
        id="file-menu"
        elevation={0}
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl)}
        onClose={handleFileMenuClose}
  onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'file')}
        PaperProps={{
          style: { border: '1px solid #a0a0a0' },
          onMouseDown: (_ev: React.MouseEvent) => {
            try {
              // Always close any open Export submenu on mousedown inside the File menu
              handleExportMenuClose();
            } catch (e) {
              // ignore
            }
          },
          onMouseMove: (ev: React.MouseEvent) => {
            // If user moves pointer over the opened popover, interpret their
            // horizontal position relative to the menubar and switch menus
            if (!menubarActive) return;
            try {
              const x = ev.clientX;
              const y = ev.clientY;
              const checkRect = (el: HTMLElement | null) => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
              };
              let candidate: 'file'|'edit'|'select'|'export' | null = null;
              if (checkRect(fileRef.current)) candidate = 'file';
              else if (checkRect(editRef.current)) candidate = 'edit';
              else if (checkRect(selectRef.current)) candidate = 'select';
              else if (checkRect(exportRef.current)) candidate = 'export';
              if (!candidate) return;
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = window.setTimeout(() => { openMenuByName(candidate as 'file'|'edit'|'select'|'export'); hoverTimerRef.current = null; }, HOVER_DELAY_MS);
            } catch (e) {}
          }
        }}
      >
  <NewMenuItem onNew={() => { handleExportMenuClose(); handleNewDiagram(); }} />
        <Divider />
        {/* Export moved back to its own top-level menu */}
  <MenuItem onClick={() => { handleExportMenuClose(); if (isEditable) saveDiagram(); handleFileMenuClose(); }} disabled={!isEditable}>
          <ListItemIcon>
            <SaveOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Save</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+S</Typography>
        </MenuItem>
        <Divider />
  <MenuItem onClick={() => { handleExportMenuClose(); handlePrint(); }}>
          <ListItemIcon>
            <PrintOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Print</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+P</Typography>
        </MenuItem>
  {/* (Export moved back to top-level) */}
        <Divider />
  <MenuItem onClick={() => { handleExportMenuClose(); handleFileMenuClose(); navigate('/dashboard'); }}>
          <ListItemIcon>
            <Dashboard fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Dashboard</ListItemText>
        </MenuItem>
      </Menu>

      {/* Export menu */}
      <Menu
        id="export-menu"
        elevation={0}
        anchorEl={exportMenuAnchorEl}
        open={Boolean(exportMenuAnchorEl)}
        onClose={handleExportMenuClose}
  onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'export')}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          style: { border: '1px solid #a0a0a0' },
          onMouseMove: (ev: React.MouseEvent) => {
            if (!menubarActive) return;
            try {
              const x = ev.clientX;
              const y = ev.clientY;
              const checkRect = (el: HTMLElement | null) => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
              };
              let candidate: 'file'|'edit'|'select'|'export' | null = null;
              if (checkRect(fileRef.current)) candidate = 'file';
              else if (checkRect(editRef.current)) candidate = 'edit';
              else if (checkRect(selectRef.current)) candidate = 'select';
              else if (checkRect(exportRef.current)) candidate = 'export';
              if (!candidate) return;
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = window.setTimeout(() => { openMenuByName(candidate as 'file'|'edit'|'select'|'export'); hoverTimerRef.current = null; }, HOVER_DELAY_MS);
            } catch (e) {}
          }
        }}
      >
        <MenuItem onClick={() => { handleExportToPowerPoint(); handleFileMenuClose(); handleExportMenuClose(); }} disabled={!sheets || Object.keys(sheets).length === 0}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>PowerPoint</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleExportCurrentAsPng(); }} disabled={!activeSheet}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>PNG (current sheet)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleExportCurrentAsJpg(); }} disabled={!activeSheet}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>JPG (current sheet)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleExportCurrentAsTiff(); }} disabled={!activeSheet}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>TIFF (current sheet)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleExportCurrentAsGif(); }} disabled={!activeSheet}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>GIF (current sheet)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleExportCurrentAsPdf(); }} disabled={!activeSheet}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>PDF (current sheet)</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { openExportSettings(); handleFileMenuClose(); handleExportMenuClose(); }}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Export Settings...</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit menu */}
      <Menu
        id="edit-menu"
        elevation={0}
        anchorEl={editMenuAnchorEl}
        open={Boolean(editMenuAnchorEl)}
        onClose={handleEditMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'edit')}
        PaperProps={{
          style: { border: '1px solid #a0a0a0' },
          onMouseMove: (ev: React.MouseEvent) => {
            if (!menubarActive) return;
            try {
              const x = ev.clientX;
              const y = ev.clientY;
              const checkRect = (el: HTMLElement | null) => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
              };
              let candidate: 'file'|'edit'|'select'|'export' | null = null;
              if (checkRect(fileRef.current)) candidate = 'file';
              else if (checkRect(editRef.current)) candidate = 'edit';
              else if (checkRect(selectRef.current)) candidate = 'select';
              else if (checkRect(exportRef.current)) candidate = 'export';
              if (!candidate) return;
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = window.setTimeout(() => { openMenuByName(candidate as 'file'|'edit'|'select'|'export'); hoverTimerRef.current = null; }, HOVER_DELAY_MS);
            } catch (e) {}
          }
        }}
      >
        <MenuItem onClick={handleUndo} disabled={history.past.length === 0}>
          <ListItemIcon>
            <UndoOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Undo</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+Z</Typography>
        </MenuItem>
        <MenuItem onClick={handleRedo} disabled={history.future.length === 0}>
          <ListItemIcon>
            <RedoOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Redo</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+Y</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCut} disabled={!activeSheet || activeSheet.selectedShapeIds.length === 0}>
          <ListItemIcon>
            <ContentCut fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Cut</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+X</Typography>
        </MenuItem>
        <MenuItem onClick={handleCopy} disabled={!activeSheet || activeSheet.selectedShapeIds.length === 0}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Copy</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+C</Typography>
        </MenuItem>
        <MenuItem onClick={handlePaste} disabled={!activeSheet || !activeSheet.clipboard || activeSheet.clipboard.length === 0}>
          <ListItemIcon>
            <ContentPaste fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Paste</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+V</Typography>
        </MenuItem>
      </Menu>

      {/* Select menu */}
      <Menu
        id="select-menu"
        elevation={0}
        anchorEl={selectMenuAnchorEl}
        open={Boolean(selectMenuAnchorEl)}
        onClose={handleSelectMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'select')}
        PaperProps={{
          style: { border: '1px solid #a0a0a0' },
          onMouseMove: (ev: React.MouseEvent) => {
            if (!menubarActive) return;
            try {
              const x = ev.clientX;
              const y = ev.clientY;
              const checkRect = (el: HTMLElement | null) => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
              };
              let candidate: 'file'|'edit'|'select'|'export' | null = null;
              if (checkRect(fileRef.current)) candidate = 'file';
              else if (checkRect(editRef.current)) candidate = 'edit';
              else if (checkRect(selectRef.current)) candidate = 'select';
              else if (checkRect(exportRef.current)) candidate = 'export';
              if (!candidate) return;
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = window.setTimeout(() => { openMenuByName(candidate as 'file'|'edit'|'select'|'export'); hoverTimerRef.current = null; }, HOVER_DELAY_MS);
            } catch (e) {}
          }
        }}
      >
        <MenuItem onClick={handleSelectAll}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>All</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+A</Typography>
        </MenuItem>
        <MenuItem onClick={handleSelectShapes}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Shapes</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSelectLines}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Lines</ListItemText>
        </MenuItem>
      </Menu>
      <Dialog open={confirmNewOpen} onClose={() => { setConfirmNewOpen(false); setPendingNewCreation(false); }}>
        <DialogTitle>Discard unsaved changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Creating a new diagram will discard these changes. Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmNewOpen(false); setPendingNewCreation(false); }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleNewDiagramConfirmed}>Discard & New</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editNameOpen} onClose={() => { setEditNameOpen(false); setPendingNewCreation(false); }} PaperProps={{ sx: { minWidth: '256px' } }}>
        <DialogTitle>Edit Diagram Name</DialogTitle>
        <DialogContent>
          <TextField
            label="Diagram name"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            autoFocus
            sx={{ maxWidth: '256px' }}
            InputProps={{ sx: { input: { textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' } } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditNameOpen(false); setPendingNewCreation(false); }}>Cancel</Button>
          <Button onClick={() => {
            const finalName = editingName && editingName.trim() ? editingName.trim() : 'New Diagram';
            if (pendingNewCreation) {
              // Creating a brand new diagram with the provided name and persist it so a remote id exists
              (async () => {
                try {
                  const createAndSave = (useDiagramStore as any).getState().createAndSaveNewDiagram as (name?: string) => Promise<string | null>;
                  await createAndSave(finalName);
                } catch (e) {
                  console.error('Failed to create and save new diagram from toolbar', e);
                }
              })();
              setPendingNewCreation(false);
            } else {
              // Just renaming the current diagram
              setDiagramName(finalName);
            }
            setEditNameOpen(false);
          }} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isExportingPpt} onClose={() => { /* modal only */ }} PaperProps={{ sx: { minWidth: '320px' } }}>
        <DialogTitle>Exporting to PowerPoint</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {exportProgress ? `Exporting sheet ${exportProgress.current} of ${exportProgress.total}...` : 'Preparing export...'}
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <Dialog open={exportSettingsOpen} onClose={() => setExportSettingsOpen(false)} PaperProps={{ sx: { minWidth: '360px' } }}>
        <DialogTitle>Export Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="resolution-label">Resolution</InputLabel>
              <Select
                labelId="resolution-label"
                value={exportResolutionOption}
                onChange={(e) => setExportResolutionOption(e.target.value as any)}
                label="Resolution"
                size="small"
              >
                <MenuItem value={'800x450'}>800 × 450</MenuItem>
                <MenuItem value={'1280x720'}>1280 × 720 (HD)</MenuItem>
                <MenuItem value={'1600x900'}>1600 × 900</MenuItem>
                <MenuItem value={'1920x1080'}>1920 × 1080 (Full HD)</MenuItem>
                <MenuItem value={'3840x2160'}>3840 × 2160 (4K)</MenuItem>
                <MenuItem value={'custom'}>Custom</MenuItem>
              </Select>
            </FormControl>
            {exportResolutionOption === 'custom' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Width (px)"
                  type="number"
                  value={exportWidthPx}
                  onChange={(e) => setExportWidthPx(Math.max(1, parseInt(e.target.value || '0', 10) || 0))}
                  size="small"
                />
                <TextField
                  label="Height (px)"
                  type="number"
                  value={exportHeightPx}
                  onChange={(e) => setExportHeightPx(Math.max(1, parseInt(e.target.value || '0', 10) || 0))}
                  size="small"
                />
              </Box>
            )}

            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>JPEG Quality</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider value={Math.round(jpegQuality * 100)} onChange={(_, v) => setJpegQuality((v as number) / 100)} min={10} max={100} />
                <TextField
                  sx={{ width: 100 }}
                  size="small"
                  type="number"
                  inputProps={{ min: 10, max: 100 }}
                  value={Math.round(jpegQuality * 100)}
                  onChange={(e) => {
                    const v = Math.min(100, Math.max(10, parseInt(e.target.value || '10', 10) || 10));
                    setJpegQuality(v / 100);
                  }}
                />
              </Box>
            </Box>

            <FormControl fullWidth>
              <InputLabel id="pdfsize-label">PDF Page Size</InputLabel>
              <Select
                labelId="pdfsize-label"
                value={pdfPageSize}
                onChange={(e) => setPdfPageSize(e.target.value as any)}
                label="PDF Page Size"
                size="small"
              >
                <MenuItem value={'image'}>Image size (match resolution)</MenuItem>
                <MenuItem value={'a4_portrait'}>A4 (portrait)</MenuItem>
                <MenuItem value={'a4_landscape'}>A4 (landscape)</MenuItem>
                <MenuItem value={'letter_portrait'}>Letter (portrait)</MenuItem>
                <MenuItem value={'letter_landscape'}>Letter (landscape)</MenuItem>
                <MenuItem value={'custom'}>Custom (inches)</MenuItem>
              </Select>
            </FormControl>
            {pdfPageSize === 'custom' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField label="Width (in)" type="number" size="small" value={pdfCustomWidthIn} onChange={(e) => setPdfCustomWidthIn(Math.max(0.1, parseFloat(e.target.value || '0') || 0.1))} />
                <TextField label="Height (in)" type="number" size="small" value={pdfCustomHeightIn} onChange={(e) => setPdfCustomHeightIn(Math.max(0.1, parseFloat(e.target.value || '0') || 0.1))} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            // Revert to previously-snapped settings when the dialog was opened
            const prev = prevExportSettingsRef.current;
            if (prev) {
              setExportResolutionOption(prev.exportResolutionOption as any);
              setExportWidthPx(prev.exportWidthPx);
              setExportHeightPx(prev.exportHeightPx);
              setJpegQuality(prev.jpegQuality);
              setPdfPageSize(prev.pdfPageSize as any);
              setPdfCustomWidthIn(prev.pdfCustomWidthIn);
              setPdfCustomHeightIn(prev.pdfCustomHeightIn);
            }
            setExportSettingsOpen(false);
          }}>Cancel</Button>
          <Button onClick={async () => {
            // Compute chosen resolution (unless custom) and persist settings
            let newWidth = exportWidthPx;
            let newHeight = exportHeightPx;
            if (exportResolutionOption !== 'custom') {
              const map: Record<string, [number, number]> = {
                '800x450': [800, 450],
                '1280x720': [1280, 720],
                '1600x900': [1600, 900],
                '1920x1080': [1920, 1080],
                '3840x2160': [3840, 2160],
              };
              const chosen = map[exportResolutionOption];
              if (chosen) {
                newWidth = chosen[0];
                newHeight = chosen[1];
                setExportWidthPx(newWidth);
                setExportHeightPx(newHeight);
              }
            }
            const payload = {
              exportResolutionOption,
              exportWidthPx: newWidth,
              exportHeightPx: newHeight,
              jpegQuality,
              pdfPageSize,
              pdfCustomWidthIn,
              pdfCustomHeightIn,
            };

            // Persist to server only. Require sign-in to save settings.
            if (!currentUser) {
              alert('Please sign in to persist export settings to your account.');
            } else {
              try {
                const { apiFetch } = await import('../../utils/apiFetch');
                const resp = await apiFetch(`${serverUrl}/users/me/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { exportSettings: payload } }) });
                if (!resp.ok) {
                  const text = await resp.text().catch(() => '<no response text>');
                  console.warn('Failed to persist export settings to server:', resp.status, text);
                  alert('Failed to save export settings to server. See console for details.');
                }
              } catch (e) {
                console.warn('Failed to persist export settings to server', e);
                alert('Failed to save export settings to server. See console for details.');
              }
            }

            setExportSettingsOpen(false);
          }} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Ensure pending flag is cleared if user navigates away or closes menus */}
      {/* (Handled above in onClose handlers) */}
      {/* Flexible spacer pushes account UI to far right */}
      <Box sx={{ flex: 1 }} />
      <AccountMenu />
    </Toolbar>
  );
};

export default MainToolbar;
