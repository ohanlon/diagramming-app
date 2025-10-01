import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Box, Slider, Button, Typography } from '@mui/material';

interface Props {
  imageSrc: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
  maxBytes?: number;
}

// Helper: create an HTMLImageElement from src
function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Helper: get cropped image as canvas
async function getCroppedCanvas(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }, outputSize?: number) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Default to pixelCrop size
  const cropWidth = Math.max(1, Math.round(pixelCrop.width));
  const cropHeight = Math.max(1, Math.round(pixelCrop.height));
  const targetSize = outputSize || Math.max(cropWidth, cropHeight);

  // Make a square output for avatar
  canvas.width = targetSize;
  canvas.height = targetSize;

  // draw image portion scaled to fit square
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    cropWidth,
    cropHeight,
    0,
    0,
    targetSize,
    targetSize
  );

  return canvas;
}

// Convert canvas to dataUrl with quality
function canvasToDataUrl(canvas: HTMLCanvasElement, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    }, 'image/jpeg', quality);
  });
}

// Compress canvas to target size by adjusting quality and scale
async function compressCanvasToTarget(canvas: HTMLCanvasElement, maxBytes: number, minSize = 64) {
  let quality = 0.92;
  let currentCanvas = canvas;

  // Try reducing quality first
  for (let qAttempts = 0; qAttempts < 6; qAttempts++) {
    const dataUrl = await canvasToDataUrl(currentCanvas, quality);
    const size = Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * (3 / 4));
    if (size <= maxBytes) return dataUrl;
    quality -= 0.12; // reduce
    if (quality < 0.3) break;
  }

  // If still too big, scale down canvas by 0.85 and retry
  let scaledCanvas = currentCanvas;
  while (true) {
    const newWidth = Math.round(scaledCanvas.width * 0.85);
    if (newWidth < minSize) break;
    const tmp = document.createElement('canvas');
    tmp.width = newWidth;
    tmp.height = newWidth;
    const tctx = tmp.getContext('2d')!;
    tctx.drawImage(scaledCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height, 0, 0, tmp.width, tmp.height);
    scaledCanvas = tmp;

    // Try quality loop again
    let q = 0.9;
    for (let i = 0; i < 6; i++) {
      const url = await canvasToDataUrl(scaledCanvas, q);
      const size = Math.ceil((url.length - 'data:image/jpeg;base64,'.length) * (3 / 4));
      if (size <= maxBytes) return url;
      q -= 0.12;
      if (q < 0.3) break;
    }
  }

  return null; // cannot compress below maxBytes
}

const AvatarEditor: React.FC<Props> = ({ imageSrc, onCancel, onSave, maxBytes = 50 * 1024 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPixels, setCropAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCropAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    if (!cropAreaPixels) return;
    setProcessing(true);
    try {
      // create a high-resolution canvas from crop (e.g., 512px)
      const canvas = await getCroppedCanvas(imageSrc, cropAreaPixels, 512);
      // try to compress to target
      const compressed = await compressCanvasToTarget(canvas, maxBytes, 64);
      if (!compressed) {
        setError('Unable to compress avatar below 50KB. Try another image or crop a smaller area.');
        setProcessing(false);
        return;
      }
      onSave(compressed);
    } catch (e) {
      console.error('Avatar crop failed', e);
      setError('Failed to process image');
    } finally {
      setProcessing(false);
    }
  }, [cropAreaPixels, imageSrc, maxBytes, onSave]);

  return (
    <Box sx={{ width: 480, height: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ position: 'relative', width: '100%', height: 300, background: '#333' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2">Zoom</Typography>
        <Slider value={zoom} min={1} max={4} step={0.1} onChange={(_e, v) => setZoom(v as number)} sx={{ flex: 1 }} />
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={processing}>{processing ? 'Processing...' : 'Save'}</Button>
      </Box>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default AvatarEditor;
