import React from 'react';
import { Menu, MenuItem, ListItemText, Divider } from '@mui/material';

interface ExportMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onMouseMove: (ev: React.MouseEvent) => void;
  onExportToPowerPoint: () => void;
  onExportCurrentAsPng: () => void;
  onExportCurrentAsJpg: () => void;
  onExportCurrentAsTiff: () => void;
  onExportCurrentAsGif: () => void;
  onExportCurrentAsPdf: () => void;
  onOpenExportSettings: () => void;
  hasSheets: boolean;
  hasActiveSheet: boolean;
}

const ExportMenu: React.FC<ExportMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onKeyDown,
  onMouseMove,
  onExportToPowerPoint,
  onExportCurrentAsPng,
  onExportCurrentAsJpg,
  onExportCurrentAsTiff,
  onExportCurrentAsGif,
  onExportCurrentAsPdf,
  onOpenExportSettings,
  hasSheets,
  hasActiveSheet,
}) => {
  return (
    <Menu
      id="export-menu"
      elevation={0}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onKeyDown={onKeyDown}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{
        style: { border: '1px solid #a0a0a0' },
        onMouseMove,
      }}
    >
      <MenuItem onClick={onExportToPowerPoint} disabled={!hasSheets}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>PowerPoint</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={onExportCurrentAsPng} disabled={!hasActiveSheet}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>PNG (current sheet)</ListItemText>
      </MenuItem>
      <MenuItem onClick={onExportCurrentAsJpg} disabled={!hasActiveSheet}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>JPG (current sheet)</ListItemText>
      </MenuItem>
      <MenuItem onClick={onExportCurrentAsTiff} disabled={!hasActiveSheet}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>TIFF (current sheet)</ListItemText>
      </MenuItem>
      <MenuItem onClick={onExportCurrentAsGif} disabled={!hasActiveSheet}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>GIF (current sheet)</ListItemText>
      </MenuItem>
      <MenuItem onClick={onExportCurrentAsPdf} disabled={!hasActiveSheet}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>PDF (current sheet)</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={onOpenExportSettings}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Export Settings...</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default ExportMenu;
