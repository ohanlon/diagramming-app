import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Print from '../Print/Print';
import { Toolbar, Button, MenuList, MenuItem, Menu, ListItemText, Typography, ListItemIcon, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, TextField } from '@mui/material';
import { ContentCopy, ContentCut, ContentPaste, PrintOutlined, RedoOutlined, SaveOutlined, UndoOutlined, Dashboard, History } from '@mui/icons-material';
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
  const exportRef = useRef<HTMLButtonElement | null>(null);
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
    setFileMenuAnchorEl(null);
    setEditMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    setMenubarActive(true);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
    setMenubarActive(false);
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
    const widthPx = 1600;
    const heightPx = 900;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/png');
    if (res.dataUrl) {
      const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.png`;
      downloadDataUrl(res.dataUrl, name);
    } else {
      alert('Failed to render sheet for PNG export');
    }
    handleExportMenuClose();
  };

  const handleExportCurrentAsJpg = async () => {
    if (!activeSheet) return;
    const widthPx = 1600;
    const heightPx = 900;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/jpeg', 0.92);
    if (res.dataUrl) {
      const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.jpg`;
      downloadDataUrl(res.dataUrl, name);
    } else {
      alert('Failed to render sheet for JPG export');
    }
    handleExportMenuClose();
  };

  const handleExportCurrentAsPdf = async () => {
    if (!activeSheet) return;
    const widthPx = 1600;
    const heightPx = 900;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/png');
    if (!res.dataUrl) {
      alert('Failed to render sheet for PDF export');
      handleExportMenuClose();
      return;
    }
    try {
      const jspdfModule: any = await import('jspdf');
      const jsPDFClass: any = jspdfModule && (jspdfModule.jsPDF || jspdfModule.default || jspdfModule);
      // Use pixel units if supported; otherwise fall back to points
      const usePx = true;
      const fileName = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.pdf`;
      if (usePx) {
        const doc = new jsPDFClass({ orientation: widthPx > heightPx ? 'landscape' : 'portrait', unit: 'px', format: [widthPx, heightPx] });
        doc.addImage(res.dataUrl, 'PNG', 0, 0, widthPx, heightPx);
        doc.save(fileName);
      } else {
        const inchesW = widthPx / 96;
        const inchesH = heightPx / 96;
        const doc = new jsPDFClass({ orientation: inchesW > inchesH ? 'landscape' : 'portrait', unit: 'in', format: [inchesW, inchesH] });
        doc.addImage(res.dataUrl, 'PNG', 0, 0, inchesW, inchesH);
        doc.save(fileName);
      }
    } catch (e) {
      console.error('PDF export failed', e);
      alert('PDF export failed. Please ensure jspdf is installed.');
    }
    handleExportMenuClose();
  };

  const handleExportCurrentAsGif = async () => {
    if (!activeSheet) return;
    const widthPx = 800; // GIFs can be smaller; choose moderate size
    const heightPx = Math.round((widthPx * 9) / 16);
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/png');
    if (!res.canvas) {
      alert('Failed to render sheet for GIF export');
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
      const gif = new GIFClass({ workers: 2, quality: 10, width: widthPx, height: heightPx });
      gif.addFrame(res.canvas, { copy: true, delay: 0 });
      gif.on('finished', (blob: Blob) => {
        const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.gif`;
        downloadBlob(blob, name);
      });
      gif.render();
    } catch (e) {
      console.warn('GIF export failed or gif.js not installed', e);
      // Fallback to PNG download
      const name = `${diagramName || 'diagram'} - ${activeSheet.name || 'sheet'}.png`;
      if (res.dataUrl) downloadDataUrl(res.dataUrl, name);
      alert('GIF export requires gif.js. PNG has been saved instead.');
    }
    handleExportMenuClose();
  };

  const handleExportCurrentAsTiff = async () => {
    if (!activeSheet) return;
    const widthPx = 1600;
    const heightPx = 900;
    const res = await renderSheetToImage(activeSheet.id, widthPx, heightPx, 'image/png');
    if (!res.canvas) {
      alert('Failed to render sheet for TIFF export');
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
    handleExportMenuClose();
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
    } else {
      if (name === 'select') {
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
      const idx = order.indexOf(current);
      const next = order[(idx + 1) % order.length];
      openMenuByName(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const order: ('file'|'edit'|'select'|'export')[] = ['file','edit','select','export'];
      const idx = order.indexOf(current);
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

      // Standard widescreen slide width in inches -- use 16:9 at 10 inches wide
      const slideWidthInches = 10;
      const slideHeightInches = 10 * (9 / 16); // 5.625

      for (let i = 0; i < sheetIds.length; i++) {
        const id = sheetIds[i];
        setExportProgress({ current: i + 1, total: sheetIds.length });
        // Render a reasonably high-resolution PNG for embedding
        const result = await renderSheetToImage(id, 1600, 900, 'image/png');
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
      handleExportMenuClose();
    }
  };

  const { saveDiagram } = useDiagramStore();
  const isEditable = useDiagramStore(state => state.isEditable !== false);
  const remoteDiagramId = useDiagramStore(state => state.remoteDiagramId);

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
    handleFileMenuClose();
  };

  const handleNewDiagram = () => {
    // Start the 'create new diagram' flow. If there are unsaved changes, ask the user
    // to confirm discarding them, otherwise prompt for a name immediately.
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
          onClick={handleExportMenuOpen}
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
        <NewMenuItem onNew={handleNewDiagram} />
        <Divider />
        <MenuItem onClick={() => { if (isEditable) saveDiagram(); handleFileMenuClose(); }} disabled={!isEditable}>
          <ListItemIcon>
            <SaveOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Save</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+S</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handlePrint}>
          <ListItemIcon>
            <PrintOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Print</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+P</Typography>
        </MenuItem>
        {/* Export moved to the top-level Export menu */}
        <Divider />
        <MenuItem onClick={() => { handleFileMenuClose(); navigate('/dashboard'); }}>
          <ListItemIcon>
            <Dashboard fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Dashboard</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleFileMenuClose(); if (remoteDiagramId) navigate(`/diagram/${remoteDiagramId}/history`); }} disabled={!isEditable || !remoteDiagramId}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>History</ListItemText>
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
        <MenuItem onClick={() => { handleExportToPowerPoint(); handleExportMenuClose(); }} disabled={!sheets || Object.keys(sheets).length === 0}>
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
      {/* Ensure pending flag is cleared if user navigates away or closes menus */}
      {/* (Handled above in onClose handlers) */}
      {/* Flexible spacer pushes account UI to far right */}
      <Box sx={{ flex: 1 }} />
      <AccountMenu />
    </Toolbar>
  );
};

export default MainToolbar;
