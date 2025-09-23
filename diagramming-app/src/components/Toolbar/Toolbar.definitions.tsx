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
  Redo,
  Undo,
  VerticalAlignBottom,
  VerticalAlignCenter,
  VerticalAlignTop,
} from '@mui/icons-material';
import type { LineStyle, ArrowStyle, Sheet } from '../../types';
import { googleFonts, fontSizes } from './Fonts';
import { CUSTOM_PATTERN_1_LINE_STYLE, CUSTOM_PATTERN_2_LINE_STYLE, DASHED_LINE_STYLE, DOT_DASH_PATTERN_LINE_STYLE, LONG_DASH_PATTERN_LINE_STYLE, LONG_DASH_SPACE_PATTERN_LINE_STYLE, LONG_SPACE_SHORT_DOT_PATTERN_STYLE } from '../../constants/constant';

export const LINE_STYLE_SVG: Record<LineStyle, string> = {
    continuous: `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2"/></svg>`,
    'long-dash-space': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="${LONG_DASH_SPACE_PATTERN_LINE_STYLE}"/></svg>`,
    dashed: `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="${DASHED_LINE_STYLE}"/></svg>`,
    'long-dash': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="${LONG_DASH_PATTERN_LINE_STYLE}"/></svg>`,
    'dot-dash': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="${DOT_DASH_PATTERN_LINE_STYLE}"/></svg>`,
    'custom-1': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="${CUSTOM_PATTERN_1_LINE_STYLE}"/></svg>`,
    'custom-2': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="${CUSTOM_PATTERN_2_LINE_STYLE}"/></svg>`,
    'long-space-short-dot': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="${LONG_SPACE_SHORT_DOT_PATTERN_STYLE}"/></svg>`,
};

export const ARROW_STYLE_SVG: Record<ArrowStyle, {start: string, end: string}> = {
    none: {
        start: `<svg width="30" height="12" viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 6H30" stroke="black" stroke-width="2"/></svg>`,
        end: `<svg width="30" height="12" viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 6H30" stroke="black" stroke-width="2"/></svg>`
    },
    standard_arrow: {
        start: `<svg width="30" height="12" viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 1L2 6L10 11" stroke="black" stroke-width="2"/><path d="M2 6H30" stroke="black" stroke-width="2"/></svg>`,
        end: `<svg width="30" height="12" viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 1L28 6L20 11" stroke="black" stroke-width="2"/><path d="M0 6H28" stroke="black" stroke-width="2"/></svg>`
    },
    polygon_arrow: {
        start: `<svg width="30" height="12" viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.5L0 6L10 9.5V2.5Z" fill="black"/><path d="M0 6H30" stroke="black" stroke-width="2"/></svg>`,
        end: `<svg width="30" height="12" viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 2.5L30 6L20 9.5V2.5Z" fill="black"/><path d="M0 6H30" stroke="black" stroke-width="2"/></svg>`
    }
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
    hasSelectedConnectors: boolean;
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
    currentStartArrow: ArrowStyle;
    currentEndArrow: ArrowStyle;
    handleFontChange: (event: SelectChangeEvent<string>) => void;
    handleFontSizeChange: (event: SelectChangeEvent<string>) => void;
    handleLineStyleChange: (event: SelectChangeEvent<string>) => void;
    handleLineWidthChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleStartArrowChange: (event: SelectChangeEvent<string>) => void;
    handleEndArrowChange: (event: SelectChangeEvent<string>) => void;
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
    onToolClick?: () => void;
}

export const getInitialTools = ({
    activeSheet,
    canUndo,
    canRedo,
    hasSelectedShapes,
    hasSelectedConnectors,
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
    currentStartArrow,
    currentEndArrow,
    handleColorPickerClick,
    handleShapeColorPickerClick,
    handleFontChange,
    handleFontSizeChange,
    handleLineStyleChange,
    handleLineWidthChange,
    handleStartArrowChange,
    handleEndArrowChange,
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
    onToolClick,
}: GetInitialToolsProps): ToolDefinition[] => {
    const selectedShapeIds = activeSheet.selectedShapeIds;

    const handleClick = (action: () => void) => {
        action();
        onToolClick?.();
    };

    return [
        {
            id: 'cut',
            element: (
                <Tooltip title="Cut">
                    <IconButton onClick={() => handleClick(() => cutShape(selectedShapeIds))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
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
                    <IconButton onClick={() => handleClick(() => copyShape(selectedShapeIds))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
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
                    <IconButton onClick={() => handleClick(pasteShape)} color="inherit" sx={{ borderRadius: 0 }}>
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
                <FormControl variant="standard" sx={{ m: 1, width: 120 }}>
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
                    <IconButton onClick={() => handleClick(toggleBold)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isBoldActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={() => handleClick(toggleItalic)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isItalicActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={() => handleClick(toggleUnderlined)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isUnderlinedActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={(e) => handleClick(() => handleColorPickerClick(e))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
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
                    <IconButton onClick={(e) => handleClick(() => handleShapeColorPickerClick(e))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
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
                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }} disabled={!hasSelectedConnectors}>
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
                    disabled={!hasSelectedConnectors}
                />
            ),
            width: 90,
        },
        {
            id: 'start-arrow',
            element: (
                <FormControl variant="standard" sx={{ m: 1, width: '4em' }} disabled={!hasSelectedConnectors}>
                    <Select
                        value={currentStartArrow}
                        onChange={handleStartArrowChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Start Arrow' }}
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' } }}
                        renderValue={(selected) => (
                            <span dangerouslySetInnerHTML={{ __html: ARROW_STYLE_SVG[selected as ArrowStyle].start }} />
                        )}
                    >
                        {Object.keys(ARROW_STYLE_SVG).map((style) => (
                            <MenuItem key={style} value={style}>
                                <span dangerouslySetInnerHTML={{ __html: ARROW_STYLE_SVG[style as ArrowStyle].start }} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ),
            width: 60,
        },
        {
            id: 'end-arrow',
            element: (
                <FormControl variant="standard" sx={{ m: 1, width: '4em' }} disabled={!hasSelectedConnectors}>
                    <Select
                        value={currentEndArrow}
                        onChange={handleEndArrowChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'End Arrow' }}
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' } }}
                        renderValue={(selected) => (
                            <span dangerouslySetInnerHTML={{ __html: ARROW_STYLE_SVG[selected as ArrowStyle].end }} />
                        )}
                    >
                        {Object.keys(ARROW_STYLE_SVG).map((style) => (
                            <MenuItem key={style} value={style}>
                                <span dangerouslySetInnerHTML={{ __html: ARROW_STYLE_SVG[style as ArrowStyle].end }} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ),
            width: 60,
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
                    <IconButton onClick={() => handleClick(() => setVerticalAlign('top'))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignTopActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={() => handleClick(() => setVerticalAlign('middle'))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignCenterActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={() => handleClick(() => setVerticalAlign('bottom'))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignBottomActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={() => handleClick(() => setHorizontalAlign('left'))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignLeftActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={() => handleClick(() => setHorizontalAlign('center'))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignCenterActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={() => handleClick(() => setHorizontalAlign('right'))} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignRightActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
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
                    <IconButton onClick={() => handleClick(() => groupShapes(selectedShapeIds))} color="inherit" disabled={selectedShapeIds.length < 2} sx={{ borderRadius: 0 }}>
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