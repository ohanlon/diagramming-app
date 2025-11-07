/**
 * Utility functions for downloading files in the browser
 */

/**
 * Downloads a Blob as a file by creating a temporary anchor element
 * @param blob The Blob to download
 * @param filename The name to use for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a data URL as a file by converting it to a Blob first
 * @param dataUrl The data URL to download (e.g., "data:image/png;base64,...")
 * @param filename The name to use for the downloaded file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const parts = dataUrl.split(',');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    console.error('Invalid data URL format');
    return;
  }
  
  const m = parts[0].match(/:(.*?);/);
  const mime = m && m[1] ? m[1] : 'application/octet-stream';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  const blob = new Blob([u8arr], { type: mime });
  downloadBlob(blob, filename);
}
