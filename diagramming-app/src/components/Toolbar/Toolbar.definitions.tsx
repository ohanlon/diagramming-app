import React from 'react';
import {
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  AlignHorizontalCenter,
  AlignHorizontalLeft,
  AlignHorizontalRight,
  ContentCopy,
  ContentCut,
  ContentPaste,
  FormatBold,
  FormatColorFill,
  FormatColorTextOutlined,
  FormatItalic,
  FormatUnderlined,
  GroupAdd,
  NoteAdd,
  Redo,
  Undo,
  VerticalAlignBottom,
  VerticalAlignCenter,
  VerticalAlignTop,
} from '@mui/icons-material';
import type { LineStyle } from '../../types';
import { googleFonts, fontSizes } from './Fonts';

export const LINE_STYLE_SVG: Record<LineStyle, string> = {
    continuous: `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2"/></svg>`,
    dashed: `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="5 5"/></svg>`,
    'long-dash': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="10 5"/></svg>`,
    'dot-dash': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="2 3 10 3"/></svg>`,
    'custom-1': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="16 4 1 4 1 4"/></svg>`,
    'custom-2': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="40 10 20 10"/></svg>`,
};

export const lineStyles: { name: string, value: LineStyle }[] = [
    { name: 'Continuous', value: 'continuous' },
    { name: 'Dashed', value: 'dashed' },
    { name: 'Long Dash', value: 'long-dash' },
    { name: 'Dot Dash', value: 'dot-dash' },
    { name: 'Custom 1', value: 'custom-1' },
    { name: 'Custom 2', value: 'custom-2' },
];

export interface ToolDefinition {
    id: string;
    element: React.ReactNode;
    width: number;
}

export interface GetInitialToolsProps {
    activeSheet: Sheet;
    canUndo: boolean;
    canRedo: boolean;
    hasSelectedShapes: boolean;
    isBoldActive: boolean;
    isItalicActive: boolean;
    isUnderlinedActive: boolean;
    isVerticalAlignTopActive: boolean;
    isVerticalAlignCenterActive: boolean;
    isVerticalAlignBottomActive: boolean;
    isHorizontalAlignLeftActive: boolean;
    isHorizontalAlignCenterActive: boolean;
    isHorizontalAlignRightActive: boolean;
    currentTextColor: string;
    currentShapeColor: string;
    currentLineStyle: LineStyle;
    currentLineWidth: number;
    handleFontChange: (event: SelectChangeEvent<string>) => void;
    handleFontSizeChange: (event: SelectChangeEvent<string>) => void;
    handleLineStyleChange: (event: SelectChangeEvent<string>) => void;
    handleLineWidthChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    resetStore: () => void;
    undo: () => void;
    redo: () => void;
    cutShape: (ids: string[]) => void;
    copyShape: (ids: string[]) => void;
    pasteShape: () => void;
    groupShapes: (ids: string[]) => void;
    setVerticalAlign: (alignment: 'top' | 'middle' | 'bottom') => void;
    setHorizontalAlign: (alignment: 'left' | 'center' | 'right') => void;
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleUnderlined: () => void;
    handleColorPickerClick: (event: React.MouseEvent<HTMLElement>) => void;
    handleShapeColorPickerClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export const getInitialTools = ({
    activeSheet,
    canUndo,
    canRedo,
    hasSelectedShapes,
    isBoldActive,
    isItalicActive,
    isUnderlinedActive,
    isVerticalAlignTopActive,
    isVerticalAlignCenterActive,
    isVerticalAlignBottomActive,
    isHorizontalAlignLeftActive,
    isHorizontalAlignCenterActive,
    isHorizontalAlignRightActive,
    currentTextColor,
    currentShapeColor,
    currentLineStyle,
    currentLineWidth,
    handleColorPickerClick,
    handleShapeColorPickerClick,
    handleFontChange,
    handleFontSizeChange,
    handleLineStyleChange,
    handleLineWidthChange,
    resetStore,
    undo,
    redo,
    cutShape,
    copyShape,
    pasteShape,
    groupShapes,
    setVerticalAlign,
    setHorizontalAlign,
    toggleBold,
    toggleItalic,
    toggleUnderlined,
}: GetInitialToolsProps): ToolDefinition[] => {
    const selectedShapeIds = activeSheet.selectedShapeIds;

    return [
        {
            id: 'undo',
            element: (
                <Tooltip title="Undo">
                    <IconButton onClick={undo} color="inherit" disabled={!canUndo} sx={{ borderRadius: 0 }}>
                        <Undo />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'redo',
            element: (
                <Tooltip title="Redo">
                    <IconButton onClick={redo} color="inherit" disabled={!canRedo} sx={{ borderRadius: 0 }}>
                        <Redo />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'divider-1',
            element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
            width: 16,
        },
        {
            id: 'cut',
            element: (
                <Tooltip title="Cut">
                    <IconButton onClick={() => cutShape(selectedShapeIds)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
                        <ContentCut />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'copy',
            element: (
                <Tooltip title="Copy">
                    <IconButton onClick={() => copyShape(selectedShapeIds)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
                        <ContentCopy />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'paste',
            element: (
                <Tooltip title="Paste">
                    <IconButton onClick={pasteShape} color="inherit" sx={{ borderRadius: 0 }}>
                        <ContentPaste />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'divider-2',
            element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
            width: 16,
        },
        {
            id: 'font-family',
            element: (
                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                    <Select
                        value={activeSheet.selectedFont}
                        onChange={handleFontChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' } }}
                    >
                        {googleFonts.map((font) => (
                            <MenuItem key={font.value} value={font.value} sx={{ fontFamily: font.value }}>
                                {font.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ),
            width: 140,
        },
        {
            id: 'font-size',
            element: (
                <FormControl variant="standard" sx={{ m: 1, minWidth: 60 }}>
                    <Select
                        value={activeSheet.selectedFontSize.toString()}
                        onChange={handleFontSizeChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' } }}
                    >
                        {fontSizes.map((size) => (
                            <MenuItem key={size} value={size}>
                                {size}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ),
            width: 80,
        },
        {
            id: 'bold',
            element: (
                <Tooltip title="Bold">
                    <IconButton onClick={toggleBold} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isBoldActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <FormatBold />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'italic',
            element: (
                <Tooltip title="Italic">
                    <IconButton onClick={toggleItalic} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isItalicActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <FormatItalic />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'underline',
            element: (
                <Tooltip title="Underline">
                    <IconButton onClick={toggleUnderlined} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isUnderlinedActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <FormatUnderlined />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'text-color',
            element: (
                <Tooltip title="Text Color">
                    <IconButton onClick={handleColorPickerClick} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
                        <FormatColorTextOutlined sx={{ color: currentTextColor }} />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'shape-color',
            element: (
                <Tooltip title="Shape Color">
                    <IconButton onClick={handleShapeColorPickerClick} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
                        <FormatColorFill sx={{ color: currentShapeColor }} />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'divider-3',
            element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
            width: 16,
        },
        {
            id: 'line-style',
            element: (
                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                    <Select
                        value={currentLineStyle}
                        onChange={handleLineStyleChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Line Style' }}
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' } }}
                        renderValue={(selected) => (
                            <span dangerouslySetInnerHTML={{ __html: LINE_STYLE_SVG[selected] }} />
                        )}
                    >
                        {lineStyles.map((style) => (
                            <MenuItem key={style.value} value={style.value}>
                                <span dangerouslySetInnerHTML={{ __html: LINE_STYLE_SVG[style.value] }} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ),
            width: 140,
        },
        {
            id: 'line-width',
            element: (
                <TextField
                    type="number"
                    value={currentLineWidth}
                    onChange={handleLineWidthChange}
                    inputProps={{ min: 1, max: 12, step: 1 }}
                    sx={{ width: 40, margin: '8px' }}
                    variant="standard"
                />
            ),
            width: 90,
        },
        {
            id: 'divider-4',
            element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
            width: 16,
        },
        {
            id: 'align-top',
            element: (
                <Tooltip title="Align Top">
                    <IconButton onClick={() => setVerticalAlign('top')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignTopActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <VerticalAlignTop />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'align-middle',
            element: (
                <Tooltip title="Align Middle">
                    <IconButton onClick={() => setVerticalAlign('middle')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignCenterActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <VerticalAlignCenter />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'align-bottom',
            element: (
                <Tooltip title="Align Bottom">
                    <IconButton onClick={() => setVerticalAlign('bottom')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignBottomActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <VerticalAlignBottom />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'divider-5',
            element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
            width: 16,
        },
        {
            id: 'align-left',
            element: (
                <Tooltip title="Align Left">
                    <IconButton onClick={() => setHorizontalAlign('left')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignLeftActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <AlignHorizontalLeft />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'align-center',
            element: (
                <Tooltip title="Align Center">
                    <IconButton onClick={() => setHorizontalAlign('center')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignCenterActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <AlignHorizontalCenter />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'align-right',
            element: (
                <Tooltip title="Align Right">
                    <IconButton onClick={() => setHorizontalAlign('right')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignRightActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                        <AlignHorizontalRight />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        {
            id: 'divider-6',
            element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
            width: 16,
        },
        {
            id: 'group',
            element: (
                <Tooltip title="Group">
                    <IconButton onClick={() => groupShapes(selectedShapeIds)} color="inherit" disabled={selectedShapeIds.length < 2} sx={{ borderRadius: 0 }}>
                        <GroupAdd />
                    </IconButton>
                </Tooltip>
            ),
            width: 48,
        },
        // {
        //     id: 'add-note',
        //     element: (
        //         <Tooltip title="Add Note">
        //             <IconButton onClick={() => { /* Implement add note logic */ }} color="inherit" sx={{ borderRadius: 0 }}>
        //                 <NoteAdd />
        //             </IconButton>
        //         </Tooltip>
        //     ),
        //     width: 48,
        // },
    ];
};