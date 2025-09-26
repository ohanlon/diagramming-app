import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import ShapeStore from '../ShapeStore/ShapeStore';
import './ResizableShapeStore.less';

interface ResizableShapeStoreProps {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

const ResizableShapeStore: React.FC<ResizableShapeStoreProps> = ({
  minWidth = 300, // 18.75rem at 16px base font size
  maxWidth = 400,
  defaultWidth = 200,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Save width to localStorage
  const saveWidth = useCallback((newWidth: number) => {
    localStorage.setItem('shapeStoreWidth', newWidth.toString());
  }, []);

  // Load width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('shapeStoreWidth');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
      }
    }
  }, [minWidth, maxWidth]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  // Double-click to reset to default width
  const handleDoubleClick = useCallback(() => {
    setWidth(defaultWidth);
    saveWidth(defaultWidth);
  }, [defaultWidth, saveWidth]);

  // Keyboard shortcuts for preset widths
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target !== document.body) return; // Only handle when no input is focused

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          setWidth(300); // Minimum width (18.75rem)
          saveWidth(300);
          break;
        case '2':
          e.preventDefault();
          setWidth(200); // Default width
          saveWidth(200);
          break;
        case '3':
          e.preventDefault();
          setWidth(300); // Large width
          saveWidth(300);
          break;
      }
    }
  }, [saveWidth]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    saveWidth(width);
  }, [width, saveWidth]);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
    setWidth(newWidth);
  }, [isResizing, minWidth, maxWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);

      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResizing);
      };
    }
  }, [isResizing, resize, stopResizing]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        position: 'relative',
        width: `${width}px`,
        minWidth: `${minWidth / 16}rem`, // Convert px to rem (assuming 16px base)
        maxWidth: `${maxWidth / 16}rem`, // Convert px to rem (assuming 16px base)
        transition: isResizing ? 'none' : 'width 0.2s ease',
      }}
    >
      {/* Shape Store Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          paddingRight: '8px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ShapeStore />
      </Box>

      {/* Resize Handle */}
      <Box
        onMouseDown={startResizing}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize, double-click to reset"
        sx={{
          width: '0.25rem', // 4px at 16px base font size
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#1976d2' : 'transparent',
          position: 'relative',
          '&:hover': {
            backgroundColor: '#2196f3',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-2px',
              right: '-2px',
              bottom: 0,
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
            },
          },
          '&:active': {
            backgroundColor: '#1976d2',
          },
        }}
      >
        {/* Vertical separator line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: '1px',
            backgroundColor: '#e0e0e0',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
        {/* Visual indicator for resize handle */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '2px',
            height: '20px',
            backgroundColor: '#ccc',
            borderRadius: '1px',
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Box>
  );
};

export default ResizableShapeStore;