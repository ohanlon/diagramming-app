import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Print from '../Print/Print';
import { Select, FormControl, InputLabel, Slider } from '@mui/material';
import { Toolbar, Button, MenuList, MenuItem, Typography, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, TextField, FormControlLabel, Switch } from '@mui/material';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import AccountMenu from '../AppBar/AccountMenu';
// Exporters via barrel
import { PngExporter, JpgExporter, PdfExporter, GifExporter, TiffExporter, PptExporter } from '../../exporters';
import FileMenu from './FileMenu';
import EditMenu from './EditMenu';
import SelectMenu from './SelectMenu';
import ArrangeMenu from './ArrangeMenu';
import ExportMenu from './ExportMenu';

const MainToolbar: React.FC = () => {
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectMenuAnchorEl, setSelectMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [arrangeMenuAnchorEl, setArrangeMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { resetStore, undo, redo, cutShape, copyShape, pasteShape, selectAll, selectShapes, selectConnectors, bringForward, sendBackward, bringToFront, sendToBack, activeSheetId, sheets, isDirty, currentUser, serverUrl: storeServerUrl, diagramName: storeDiagramName, setDiagramName } = useDiagramStore();
  const serverUrl = storeServerUrl || 'http://localhost:4000';
  const canUndo = useHistoryStore(state => state.canUndo());
  const canRedo = useHistoryStore(state => state.canRedo());
  const activeSheet = sheets?.[activeSheetId];
  const navigate = useNavigate();
  const diagramName = storeDiagramName || 'New Diagram';
  const [editNameOpen, setEditNameOpen] = React.useState(false);
  const [editingName, setEditingName] = React.useState(diagramName);
  const [pendingNewCreation, setPendingNewCreation] = React.useState(false);

  // Block in-app navigation if there are unsaved changes
  useUnsavedChangesWarning(Boolean(isDirty));

  // Guarded navigate: if there are unsaved changes, dispatch the unsaved dialog
  const guardedNavigate = (path: string) => {
    // Read live isDirty from the store to avoid stale closure values
    const liveIsDirty = useDiagramStore.getState().isDirty;
    if (liveIsDirty) {
      try {
        const ev = new CustomEvent('show-unsaved-dialog', { detail: { tx: { retry: () => navigate(path) } } });
        window.dispatchEvent(ev);
      } catch (e) {
        if (window.confirm('You have unsaved changes. Are you sure you want to leave this page?')) {
          navigate(path);
        }
      }
    } else {
      navigate(path);
    }
  };

  // Reset store if activeSheet is undefined (store state is inconsistent)
  useEffect(() => {
    if (!activeSheet) {
      console.error('Active sheet not found, resetting store');
      resetStore();
    }
  }, [activeSheet, resetStore]);

  // Warn user if navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): string | undefined => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

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
  const arrangeRef = useRef<HTMLButtonElement | null>(null);
  // Export is now its own top-level menu
  const exportRef = useRef<HTMLButtonElement | null>(null);
  // data-attribute will be used to detect clicks on the Export menu item
  // Hover-delay timer to avoid accidental menu switches
  const hoverTimerRef = useRef<number | null>(null);
  const HOVER_DELAY_MS = 200;
  const hoverCandidateRef = useRef<'file' | 'edit' | 'select' | 'arrange' | 'export' | null>(null);

  const setActiveMenu = (menu: 'file' | 'edit' | 'select' | 'arrange' | 'export', target: HTMLElement) => {
    setFileMenuAnchorEl(menu === 'file' ? target : null);
    setEditMenuAnchorEl(menu === 'edit' ? target : null);
    setSelectMenuAnchorEl(menu === 'select' ? target : null);
    setArrangeMenuAnchorEl(menu === 'arrange' ? target : null);
    setExportMenuAnchorEl(menu === 'export' ? target : null);
  };

  const handleTopLevelMouseEnter = (event: React.MouseEvent<HTMLElement>, menu: 'file' | 'edit' | 'select' | 'arrange' | 'export') => {
    // Only allow hover-to-open if the menubar has been activated (menu opened)
    if (!menubarActive) return;
    // Debounce switching menus on hover to avoid accidental switches
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    hoverTimerRef.current = window.setTimeout(() => {
      const target = event.currentTarget as HTMLElement;
      setActiveMenu(menu, target);
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

  // (Removed) download helpers are now encapsulated within exporters

  // Export handlers for the currently selected sheet
  const handleExportCurrentAsPng = async () => {
    if (!activeSheet) return;
    try {
      const exporter = new PngExporter(renderSheetToImage);
      await exporter.export({
        diagramName,
        sheetId: activeSheet.id,
        sheetName: activeSheet.name || 'sheet',
        widthPx: exportWidthPx,
        heightPx: exportHeightPx,
      });
    } catch (e) {
      alert('Failed to export PNG. See console for details.');
      console.error(e);
    }
    handleFileMenuClose();
    handleExportMenuClose();
  };

  const handleExportCurrentAsJpg = async () => {
    if (!activeSheet) return;
    try {
      const exporter = new JpgExporter(renderSheetToImage, jpegQuality);
      await exporter.export({
        diagramName,
        sheetId: activeSheet.id,
        sheetName: activeSheet.name || 'sheet',
        widthPx: exportWidthPx,
        heightPx: exportHeightPx,
      });
    } catch (e) {
      alert('Failed to export JPG. See console for details.');
      console.error(e);
    }
    handleFileMenuClose();
    handleExportMenuClose();
  };

  const handleExportCurrentAsPdf = async () => {
    if (!activeSheet) return;
    try {
      const exporter = new PdfExporter(renderSheetToImage, {
        pageSize: pdfPageSize,
        customWidthIn: pdfCustomWidthIn,
        customHeightIn: pdfCustomHeightIn,
      });
      await exporter.export({
        diagramName,
        sheetId: activeSheet.id,
        sheetName: activeSheet.name || 'sheet',
        widthPx: exportWidthPx,
        heightPx: exportHeightPx,
      });
    } catch (e) {
      alert('PDF export failed. Please ensure jspdf is installed.');
      console.error(e);
    }
    handleFileMenuClose(); handleExportMenuClose();
  };

  const handleExportCurrentAsGif = async () => {
    if (!activeSheet) return;
    try {
      const exporter = new GifExporter(renderSheetToImage);
      await exporter.export({
        diagramName,
        sheetId: activeSheet.id,
        sheetName: activeSheet.name || 'sheet',
        widthPx: exportWidthPx,
        heightPx: exportHeightPx,
      });
    } catch (e) {
      console.error('GIF export failed', e);
    }
    handleFileMenuClose(); handleExportMenuClose();
  };

  const handleExportCurrentAsTiff = async () => {
    if (!activeSheet) return;
    try {
      const exporter = new TiffExporter(renderSheetToImage);
      await exporter.export({
        diagramName,
        sheetId: activeSheet.id,
        sheetName: activeSheet.name || 'sheet',
        widthPx: exportWidthPx,
        heightPx: exportHeightPx,
      });
    } catch (e) {
      console.error('TIFF export failed', e);
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
        let candidate: 'file' | 'edit' | 'select' | 'arrange' | 'export' | null = null;
        if (checkRect(fileRef.current)) candidate = 'file';
        else if (checkRect(editRef.current)) candidate = 'edit';
        else if (checkRect(selectRef.current)) candidate = 'select';
        else if (checkRect(arrangeRef.current)) candidate = 'arrange';
        else if (checkRect(exportRef.current)) candidate = 'export';

        if (candidate === hoverCandidateRef.current) return;
        hoverCandidateRef.current = candidate;
        if (hoverTimerRef.current) {
          window.clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        if (!candidate) return;
        hoverTimerRef.current = window.setTimeout(() => {
          openMenuByName(candidate as 'file' | 'edit' | 'select' | 'arrange' | 'export');
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

  const handleArrangeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    clearHoverTimer();
    setArrangeMenuAnchorEl(event.currentTarget as HTMLElement);
    setFileMenuAnchorEl(null);
    setEditMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    setExportMenuAnchorEl(null);
    setMenubarActive(true);
  };

  const handleArrangeMenuClose = () => {
    setArrangeMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  // Ensure menubarActive reflects whether any menu is open (covers keyboard-open cases)
  useEffect(() => {
    setMenubarActive(Boolean(fileMenuAnchorEl || editMenuAnchorEl || selectMenuAnchorEl || exportMenuAnchorEl));
  }, [fileMenuAnchorEl, editMenuAnchorEl, selectMenuAnchorEl, exportMenuAnchorEl]);

  const openMenuByName = (name: 'file' | 'edit' | 'select' | 'arrange' | 'export') => {
    // Clear any pending hover timers and open the requested menu while
    // ensuring other menus are closed.
    clearHoverTimer();
    if (name === 'file') {
      if (fileRef.current) setFileMenuAnchorEl(fileRef.current);
      setEditMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
      setArrangeMenuAnchorEl(null);
      setExportMenuAnchorEl(null);
    } else if (name === 'edit') {
      if (editRef.current) setEditMenuAnchorEl(editRef.current);
      setFileMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
      setArrangeMenuAnchorEl(null);
      setExportMenuAnchorEl(null);
    } else if (name === 'select') {
      if (selectRef.current) setSelectMenuAnchorEl(selectRef.current);
      setFileMenuAnchorEl(null);
      setEditMenuAnchorEl(null);
      setArrangeMenuAnchorEl(null);
      setExportMenuAnchorEl(null);
    } else if (name === 'arrange') {
      if (arrangeRef.current) setArrangeMenuAnchorEl(arrangeRef.current);
      setFileMenuAnchorEl(null);
      setEditMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
      setExportMenuAnchorEl(null);
    } else if (name === 'export') {
      if (exportRef.current) setExportMenuAnchorEl(exportRef.current);
      setFileMenuAnchorEl(null);
      setEditMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
      setArrangeMenuAnchorEl(null);
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

  const handleMenuKeyDown = (e: React.KeyboardEvent, current: 'file' | 'edit' | 'select' | 'arrange' | 'export') => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const order: ('file' | 'edit' | 'select' | 'arrange' | 'export')[] = ['file', 'edit', 'select', 'arrange', 'export'];
      const idx = order.indexOf(current as any);
      const next = order[(idx + 1) % order.length];
      if (next) openMenuByName(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const order: ('file' | 'edit' | 'select' | 'arrange' | 'export')[] = ['file', 'edit', 'select', 'arrange', 'export'];
      const idx = order.indexOf(current as any);
      const prev = order[(idx + order.length - 1) % order.length];
      if (prev) openMenuByName(prev);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeAllMenus();
    }
  };

  // Keep menubarActive in sync with any open anchor so keyboard-open also enables hover switching
  useEffect(() => {
    setMenubarActive(Boolean(fileMenuAnchorEl || editMenuAnchorEl || selectMenuAnchorEl || arrangeMenuAnchorEl || exportMenuAnchorEl));
  }, [fileMenuAnchorEl, editMenuAnchorEl, selectMenuAnchorEl, arrangeMenuAnchorEl, exportMenuAnchorEl]);

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

  // Helper to generate onMouseMove handler for menu switching
  const createMenuMouseMoveHandler = () => (ev: React.MouseEvent) => {
    if (!menubarActive) return;
    try {
      const x = ev.clientX;
      const y = ev.clientY;
      const checkRect = (el: HTMLElement | null) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      };
      let candidate: 'file' | 'edit' | 'select' | 'arrange' | 'export' | null = null;
      if (checkRect(fileRef.current)) candidate = 'file';
      else if (checkRect(editRef.current)) candidate = 'edit';
      else if (checkRect(selectRef.current)) candidate = 'select';
      else if (checkRect(arrangeRef.current)) candidate = 'arrange';
      else if (checkRect(exportRef.current)) candidate = 'export';
      if (!candidate) return;
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = window.setTimeout(() => { openMenuByName(candidate as 'file' | 'edit' | 'select' | 'arrange' | 'export'); hoverTimerRef.current = null; }, HOVER_DELAY_MS);
    } catch (e) { }
  };

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
  const [exportResolutionOption, setExportResolutionOption] = useState<'800x450' | '1280x720' | '1600x900' | '1920x1080' | '3840x2160' | 'custom'>('1600x900');
  const [exportWidthPx, setExportWidthPx] = useState<number>(1600);
  const [exportHeightPx, setExportHeightPx] = useState<number>(900);
  const [jpegQuality, setJpegQuality] = useState<number>(0.92);
  const [pdfPageSize, setPdfPageSize] = useState<'image' | 'a4_portrait' | 'a4_landscape' | 'letter_portrait' | 'letter_landscape' | 'custom'>('image');
  const [pdfCustomWidthIn, setPdfCustomWidthIn] = useState<number>(8.5);
  const [pdfCustomHeightIn, setPdfCustomHeightIn] = useState<number>(11);
  // Local storage key and helper for persisting export settings
  type ExportSettings = {
    exportResolutionOption: '800x450' | '1280x720' | '1600x900' | '1920x1080' | '3840x2160' | 'custom';
    exportWidthPx: number;
    exportHeightPx: number;
    jpegQuality: number;
    pdfPageSize: 'image' | 'a4_portrait' | 'a4_landscape' | 'letter_portrait' | 'letter_landscape' | 'custom';
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
          try { root.unmount(); } catch (e) { }
          document.body.removeChild(container);
          resolve({ dataUrl: null });
          return;
        }

        const { canvas, dataUrl } = await (await import('../../utils/thumbnail')).rasterizeSvgElement(svg, widthPx, heightPx, mimeType, quality);
        try { root.unmount(); } catch (e) { }
        document.body.removeChild(container);
        resolve({ dataUrl: dataUrl || null, canvas });
      } catch (err) {
        console.error('Error rendering sheet for export', err);
        try { document.body.removeChild(container); } catch (e) { }
        resolve({ dataUrl: null });
      }
    });
  };

  const handleExportToPowerPoint = async () => {
    setIsExportingPpt(true);
    const allIds = Object.keys(sheets || {});
    setExportProgress({ current: 0, total: allIds.length });
    try {
      const exporter = new PptExporter(
        renderSheetToImage,
        () => Object.keys(sheets || {}),
        (id: string) => (sheets && sheets[id] ? sheets[id].name : undefined),
        exportWidthPx,
        exportHeightPx,
        (current, total) => setExportProgress({ current, total })
      );
      await exporter.export({
        diagramName,
        sheetId: activeSheet ? activeSheet.id : '',
        sheetName: activeSheet ? activeSheet.name || 'sheet' : 'sheet',
        widthPx: exportWidthPx,
        heightPx: exportHeightPx,
      });
    } catch (err) {
      console.error('Export to PowerPoint failed', err);
      alert('Export to PowerPoint failed. See console for details.');
    } finally {
      setIsExportingPpt(false);
      setExportProgress(null);
      handleFileMenuClose(); handleExportMenuClose();
    }
  };

  const { saveDiagram: saveDiagramOld } = useDiagramStore();
  const saveDiagramViaQuery = useDiagramStore(state => (state as any).saveDiagramViaQuery);
  const saveDiagram = saveDiagramViaQuery || saveDiagramOld;
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
    if (activeSheet?.selectedShapeIds && activeSheet.selectedShapeIds.length > 0) {
      cutShape(activeSheet.selectedShapeIds);
    }
    handleEditMenuClose();
  };

  const handleCopy = () => {
    if (activeSheet?.selectedShapeIds && activeSheet.selectedShapeIds.length > 0) {
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

  const handleBringToFront = () => {
    if (activeSheet?.selectedShapeIds && activeSheet.selectedShapeIds.length > 0) {
      activeSheet.selectedShapeIds.forEach(id => bringToFront(id));
    }
    handleArrangeMenuClose();
  };

  const handleBringForward = () => {
    if (activeSheet?.selectedShapeIds && activeSheet.selectedShapeIds.length > 0) {
      activeSheet.selectedShapeIds.forEach(id => bringForward(id));
    }
    handleArrangeMenuClose();
  };

  const handleSendBackward = () => {
    if (activeSheet?.selectedShapeIds && activeSheet.selectedShapeIds.length > 0) {
      activeSheet.selectedShapeIds.forEach(id => sendBackward(id));
    }
    handleArrangeMenuClose();
  };

  const handleSendToBack = () => {
    if (activeSheet?.selectedShapeIds && activeSheet.selectedShapeIds.length > 0) {
      activeSheet.selectedShapeIds.forEach(id => sendToBack(id));
    }
    handleArrangeMenuClose();
  };

  const [findDialogOpen, setFindDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseInsensitive, setCaseInsensitive] = useState(true);
  const [wholeWord, setWholeWord] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [searchAllSheets, setSearchAllSheets] = useState(false);

  // Keyboard shortcuts for Find/Replace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          setIsReplaceMode(false);
          setFindDialogOpen(true);
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setIsReplaceMode(true);
          setReplaceDialogOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update match count whenever search parameters change
  useEffect(() => {
    if (!findText.trim()) {
      setMatchCount(0);
      return;
    }

    const state = useDiagramStore.getState();
    const sheets = searchAllSheets ? Object.values(state.sheets) : (activeSheet ? [activeSheet] : []);
    
    if (sheets.length === 0) {
      setMatchCount(0);
      return;
    }

    let count = 0;
    const searchTerm = caseInsensitive ? findText.toLowerCase() : findText;

    // Helper to check if text matches
    const matchesSearch = (text: string | undefined) => {
      if (!text) return false;
      const compareText = caseInsensitive ? text.toLowerCase() : text;

      if (wholeWord) {
        // Match whole words only using word boundaries
        const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseInsensitive ? 'gi' : 'g');
        return regex.test(compareText);
      } else {
        // Partial match
        return compareText.includes(searchTerm);
      }
    };

    // Search in all relevant sheets
    sheets.forEach(sheet => {
      // Search in shapes
      Object.values(sheet.shapesById).forEach(shape => {
        if (matchesSearch(shape.text)) {
          count++;
        }
      });

      // Search in connectors
      Object.values(sheet.connectors).forEach(connector => {
        if (matchesSearch(connector.text)) {
          count++;
        }
      });
    });

    setMatchCount(count);
  }, [findText, caseInsensitive, wholeWord, activeSheet, searchAllSheets]);

  // Find handler: select all matching shapes and connectors
  const handleFind = () => {
    if (!findText.trim()) return;

    const state = useDiagramStore.getState();
    const sheets = searchAllSheets ? Object.values(state.sheets) : (activeSheet ? [activeSheet] : []);
    
    if (sheets.length === 0) return;

    const searchTerm = caseInsensitive ? findText.toLowerCase() : findText;
    const matchingShapeIds: string[] = [];
    const matchingConnectorIds: string[] = [];

    // Helper to check if text matches
    const matchesSearch = (text: string | undefined) => {
      if (!text) return false;
      const compareText = caseInsensitive ? text.toLowerCase() : text;

      if (wholeWord) {
        const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseInsensitive ? 'gi' : 'g');
        return regex.test(compareText);
      } else {
        return compareText.includes(searchTerm);
      }
    };

    // Find matching shapes and connectors in all relevant sheets
    sheets.forEach(sheet => {
      // Find matching shapes
      Object.values(sheet.shapesById).forEach(shape => {
        if (matchesSearch(shape.text)) {
          matchingShapeIds.push(shape.id);
        }
      });

      // Find matching connectors
      Object.values(sheet.connectors).forEach(connector => {
        if (matchesSearch(connector.text)) {
          matchingConnectorIds.push(connector.id);
        }
      });
    });

    // Select all matching items (only those on current sheet will be visible)
    useDiagramStore.getState().setSelectedShapes(matchingShapeIds);
    useDiagramStore.getState().setSelectedConnectors(matchingConnectorIds);

    setFindDialogOpen(false);
    setReplaceDialogOpen(false);
  };

  // Replace handler: replace text in all matching shapes and connectors
  const handleReplace = () => {
    if (!findText.trim()) return;

    const state = useDiagramStore.getState();
    
    const searchTerm = caseInsensitive ? findText.toLowerCase() : findText;
    const matchingShapeIds: string[] = [];
    const matchingConnectorIds: string[] = [];

    // Helper to check if text matches and perform replacement
    const replaceInText = (text: string | undefined): { matched: boolean; newText: string } => {
      if (!text) return { matched: false, newText: text || '' };
      const compareText = caseInsensitive ? text.toLowerCase() : text;

      if (wholeWord) {
        const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseInsensitive ? 'gi' : 'g');
        if (regex.test(compareText)) {
          return { matched: true, newText: text.replace(regex, replaceText) };
        }
      } else {
        if (compareText.includes(searchTerm)) {
          // Use global replace for partial matches
          const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseInsensitive ? 'gi' : 'g');
          return { matched: true, newText: text.replace(regex, replaceText) };
        }
      }
      return { matched: false, newText: text };
    };

    if (searchAllSheets) {
      // For all sheets, we need to update the state directly across all sheets
      const updatedSheets = { ...state.sheets };
      
      Object.entries(updatedSheets).forEach(([sheetId, sheet]) => {
        let sheetModified = false;
        const updatedShapesById = { ...sheet.shapesById };
        const updatedConnectors = { ...sheet.connectors };

        // Replace in shapes
        Object.values(sheet.shapesById).forEach(shape => {
          const result = replaceInText(shape.text);
          if (result.matched) {
            matchingShapeIds.push(shape.id);
            updatedShapesById[shape.id] = { ...shape, text: result.newText, isTextPositionManuallySet: false };
            sheetModified = true;
          }
        });

        // Replace in connectors
        Object.values(sheet.connectors).forEach(connector => {
          const result = replaceInText(connector.text);
          if (result.matched) {
            matchingConnectorIds.push(connector.id);
            updatedConnectors[connector.id] = { ...connector, text: result.newText };
            sheetModified = true;
          }
        });

        if (sheetModified) {
          updatedSheets[sheetId] = {
            ...sheet,
            shapesById: updatedShapesById,
            connectors: updatedConnectors,
          };
        }
      });

      // Update all sheets at once
      useDiagramStore.setState({ sheets: updatedSheets });
    } else {
      // For current sheet only, use the existing methods
      if (!activeSheet) return;
      
      // Replace in shapes
      Object.values(activeSheet.shapesById).forEach(shape => {
        const result = replaceInText(shape.text);
        if (result.matched) {
          matchingShapeIds.push(shape.id);
          useDiagramStore.getState().updateShapeText(shape.id, result.newText);
        }
      });

      // Replace in connectors
      Object.values(activeSheet.connectors).forEach(connector => {
        const result = replaceInText(connector.text);
        if (result.matched) {
          matchingConnectorIds.push(connector.id);
          useDiagramStore.getState().updateConnectorText(connector.id, result.newText);
        }
      });
    }

    // Select all items that had replacements
    useDiagramStore.getState().setSelectedShapes(matchingShapeIds);
    useDiagramStore.getState().setSelectedConnectors(matchingConnectorIds);

    setFindDialogOpen(false);
    setReplaceDialogOpen(false);
  };

  // ...existing code...
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
          ref={arrangeRef}
          onClick={handleArrangeMenuOpen}
          onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'arrange')}
          onMouseLeave={() => clearHoverTimer()}
          aria-haspopup="true"
          aria-controls={arrangeMenuAnchorEl ? 'arrange-menu' : undefined}
          aria-expanded={Boolean(arrangeMenuAnchorEl)}
          sx={{ color: 'inherit' }}
        >
          Arrange
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
      <FileMenu
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl)}
        onClose={handleFileMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'file')}
        onMouseMove={createMenuMouseMoveHandler()}
        onNewDiagram={handleNewDiagram}
        onSave={saveDiagram}
        onPrint={handlePrint}
        onDashboard={() => guardedNavigate('/dashboard')}
        onExportMenuClose={handleExportMenuClose}
        isEditable={isEditable}
      />

      {/* Export menu */}
      <ExportMenu
        anchorEl={exportMenuAnchorEl}
        open={Boolean(exportMenuAnchorEl)}
        onClose={handleExportMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'export')}
        onMouseMove={createMenuMouseMoveHandler()}
        onExportToPowerPoint={() => { handleExportToPowerPoint(); handleFileMenuClose(); handleExportMenuClose(); }}
        onExportCurrentAsPng={handleExportCurrentAsPng}
        onExportCurrentAsJpg={handleExportCurrentAsJpg}
        onExportCurrentAsTiff={handleExportCurrentAsTiff}
        onExportCurrentAsGif={handleExportCurrentAsGif}
        onExportCurrentAsPdf={handleExportCurrentAsPdf}
        onOpenExportSettings={() => { openExportSettings(); handleFileMenuClose(); handleExportMenuClose(); }}
        hasSheets={Boolean(sheets && Object.keys(sheets).length > 0)}
        hasActiveSheet={Boolean(activeSheet)}
      />

      {/* Edit menu */}
      <EditMenu
        anchorEl={editMenuAnchorEl}
        open={Boolean(editMenuAnchorEl)}
        onClose={handleEditMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'edit')}
        onMouseMove={createMenuMouseMoveHandler()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onFind={() => { setIsReplaceMode(false); setFindDialogOpen(true); handleEditMenuClose(); }}
        onReplace={() => { setIsReplaceMode(true); setReplaceDialogOpen(true); handleEditMenuClose(); }}
        canUndo={canUndo}
        canRedo={canRedo}
        canCut={Boolean(activeSheet && activeSheet.selectedShapeIds.length > 0)}
        canCopy={Boolean(activeSheet && activeSheet.selectedShapeIds.length > 0)}
        canPaste={Boolean(activeSheet && activeSheet.clipboard && activeSheet.clipboard.length > 0)}
      />

      {/* Arrange menu (top-level) */}
      <ArrangeMenu
        anchorEl={arrangeMenuAnchorEl}
        open={Boolean(arrangeMenuAnchorEl)}
        onClose={handleArrangeMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'arrange')}
        onMouseMove={createMenuMouseMoveHandler()}
        onBringToFront={handleBringToFront}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onSendToBack={handleSendToBack}
        disabled={!activeSheet || activeSheet.selectedShapeIds.length === 0}
      />

      {/* Select menu */}
      <SelectMenu
        anchorEl={selectMenuAnchorEl}
        open={Boolean(selectMenuAnchorEl)}
        onClose={handleSelectMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'select')}
        onMouseMove={createMenuMouseMoveHandler()}
        onSelectAll={handleSelectAll}
        onSelectShapes={handleSelectShapes}
        onSelectLines={handleSelectLines}
      />
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
      <Dialog fullWidth maxWidth="sm" open={findDialogOpen || replaceDialogOpen} onClose={() => { setFindDialogOpen(false); setReplaceDialogOpen(false); }}>
        <DialogTitle>{isReplaceMode ? 'Replace' : 'Find'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Find"
            value={findText}
            onChange={e => setFindText(e.target.value)}
            required
            autoFocus
            fullWidth
            sx={{ mb: 1 }}
          />
          {isReplaceMode && (
            <TextField
              label="Replace with"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              fullWidth
              sx={{ mb: 1 }}
            />
          )}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, alignContent: 'center' }}>
            <FormControlLabel
              control={<Switch checked={caseInsensitive} onChange={e => setCaseInsensitive(e.target.checked)} />}
              label="Match case"
            />
            <FormControlLabel
              control={<Switch checked={wholeWord} onChange={e => setWholeWord(e.target.checked)} />}
              label="Whole word"
            />
            <FormControlLabel
              control={<Switch checked={searchAllSheets} onChange={e => setSearchAllSheets(e.target.checked)} />}
              label="All sheets"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {findText ? `${matchCount} match${matchCount === 1 ? '' : 'es'} found` : 'Enter text to search'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setFindDialogOpen(false); setReplaceDialogOpen(false); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={isReplaceMode ? handleReplace : handleFind}
            disabled={!findText.trim()}
          >
            {isReplaceMode ? 'Replace' : 'Find'}
          </Button>
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
