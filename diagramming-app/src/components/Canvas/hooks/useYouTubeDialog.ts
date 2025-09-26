// Custom hook for handling YouTube embed dialog
import { useState, useCallback } from 'react';
import type { Shape } from '../../../types';

export interface YouTubeDialogState {
  isYouTubeDialogOpen: boolean;
  youTubeUrl: string;
  youTubeShapeData: Omit<Shape, 'id'> | null;
  urlError: boolean;
}

export interface YouTubeDialogActions {
  openYouTubeDialog: (shapeData: Omit<Shape, 'id'>) => void;
  closeYouTubeDialog: () => void;
  setYouTubeUrl: (url: string) => void;
  validateAndSave: (addShape: (shape: Omit<Shape, 'id'>) => void) => boolean;
}

export const useYouTubeDialog = (): YouTubeDialogState & YouTubeDialogActions => {
  const [isYouTubeDialogOpen, setIsYouTubeDialogOpen] = useState(false);
  const [youTubeUrl, setYouTubeUrlState] = useState('');
  const [youTubeShapeData, setYouTubeShapeData] = useState<Omit<Shape, 'id'> | null>(null);
  const [urlError, setUrlError] = useState(false);

  const isValidYouTubeUrl = useCallback((url: string): boolean => {
    const youTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youTubeRegex.test(url);
  }, []);

  const openYouTubeDialog = useCallback((shapeData: Omit<Shape, 'id'>) => {
    setYouTubeShapeData(shapeData);
    setIsYouTubeDialogOpen(true);
    setYouTubeUrlState('');
    setUrlError(false);
  }, []);

  const closeYouTubeDialog = useCallback(() => {
    setIsYouTubeDialogOpen(false);
    setYouTubeUrlState('');
    setYouTubeShapeData(null);
    setUrlError(false);
  }, []);

  const setYouTubeUrl = useCallback((url: string) => {
    setYouTubeUrlState(url);
    setUrlError(false);
  }, []);

  const validateAndSave = useCallback((addShape: (shape: Omit<Shape, 'id'>) => void): boolean => {
    if (!isValidYouTubeUrl(youTubeUrl)) {
      setUrlError(true);
      return false;
    }

    if (youTubeShapeData) {
      const finalShape = {
        ...youTubeShapeData,
        interaction: { ...youTubeShapeData.interaction, url: youTubeUrl, type: 'embed' as const },
      };
      addShape(finalShape);
      closeYouTubeDialog();
      return true;
    }
    
    return false;
  }, [youTubeUrl, youTubeShapeData, isValidYouTubeUrl, closeYouTubeDialog]);

  return {
    isYouTubeDialogOpen,
    youTubeUrl,
    youTubeShapeData,
    urlError,
    openYouTubeDialog,
    closeYouTubeDialog,
    setYouTubeUrl,
    validateAndSave,
  };
};