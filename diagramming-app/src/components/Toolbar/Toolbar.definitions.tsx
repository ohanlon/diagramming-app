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
  Menu,
  Box,
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
  VerticalAlignBottom,
  VerticalAlignCenter,
  VerticalAlignTop,
} from '@mui/icons-material';
import type { LineStyle, ArrowStyle, Sheet, ConnectionType } from '../../types';
import { googleFonts, fontSizes } from './Fonts';
import { CUSTOM_PATTERN_1_LINE_STYLE, CUSTOM_PATTERN_2_LINE_STYLE, DASHED_LINE_STYLE, DOT_DASH_PATTERN_LINE_STYLE, LONG_DASH_PATTERN_LINE_STYLE, LONG_DASH_SPACE_PATTERN_LINE_STYLE, LONG_SPACE_SHORT_DOT_PATTERN_STYLE } from '../../constants/constant';
import { ARROW_STYLE_SVG } from './constants/svgIcons';

export const LINE_STYLE_SVG: Record<LineStyle, string> = {
    continuous: `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="currentColor" stroke-width="2"/></svg>`,
    'long-dash-space': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="currentColor" stroke-width="2" stroke-dasharray="${LONG_DASH_SPACE_PATTERN_LINE_STYLE}"/></svg>`,
    dashed: `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="currentColor" stroke-width="2" stroke-dasharray="${DASHED_LINE_STYLE}"/></svg>`,
    'long-dash': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="currentColor" stroke-width="2" stroke-dasharray="${LONG_DASH_PATTERN_LINE_STYLE}"/></svg>`,
    'dot-dash': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="currentColor" stroke-width="2" stroke-dasharray="${DOT_DASH_PATTERN_LINE_STYLE}"/></svg>`,
    'custom-1': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="currentColor" stroke-width="2" stroke-dasharray="${CUSTOM_PATTERN_1_LINE_STYLE}"/></svg>`,
    'custom-2': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="currentColor" stroke-width="2" stroke-dasharray="${CUSTOM_PATTERN_2_LINE_STYLE}"/></svg>`,
    'long-space-short-dot': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="currentColor" stroke-width="2" stroke-dasharray="${LONG_SPACE_SHORT_DOT_PATTERN_STYLE}"/></svg>`,
};

export const CONNECTION_TYPE_SVG: Record<ConnectionType, string> = {
    direct: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10L55 10" stroke="currentColor" stroke-width="2"/></svg>`,
    orthogonal: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 15 L 30 15 L 30 5 L 55 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
    bezier: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 15 Q 20 15, 25 10 T 55 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>`
};

export const lineStyles: { name: string, value: LineStyle }[] = [
    { name: 'Continuous', value: 'continuous' },
    { name: 'Dashed', value: 'dashed' },
    { name: 'Long Dash', value: 'long-dash' },
    { name: 'Dot Dash', value: 'dot-dash' },
    { name: 'Custom 1', value: 'custom-1' },
    { name: 'Custom 2', value: 'custom-2' },
];

export const connectionTypes: { name: string, value: ConnectionType }[] = [
    { name: 'Direct', value: 'direct' },
    { name: 'Orthogonal', value: 'orthogonal' },
    { name: 'Bezier', value: 'bezier' },
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
    currentConnectionType: ConnectionType;
    currentStartArrow: ArrowStyle;
    currentEndArrow: ArrowStyle;
    handleFontChange: (event: SelectChangeEvent<string>) => void;
    handleFontSizeChange: (event: SelectChangeEvent<string>) => void;
    handleLineStyleChange: (event: SelectChangeEvent<string>) => void;
    handleLineWidthChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleConnectionTypeChange: (event: SelectChangeEvent<string>) => void;
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
    currentConnectionType,
    currentStartArrow,
    currentEndArrow,
    handleColorPickerClick,
    handleShapeColorPickerClick,
    handleFontChange,
    handleFontSizeChange,
    handleLineStyleChange,
    handleLineWidthChange,
    handleConnectionTypeChange,
    handleStartArrowChange,
    handleEndArrowChange,
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
                        sx={{ '.MuiSelect-select': { padding: '.5rem 0.75rem' }, color: 'inherit' }}
                    >
                        {googleFonts.map((font) => (
                            <MenuItem key={font.value} value={font.value} sx={{ fontFamily: font.value, color: 'text.primary' }}>
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
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' }, color: 'inherit' }}
                    >
                        {fontSizes.map((size) => (
                            <MenuItem key={size} value={size} sx={{ color: 'text.primary' }}>
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
                    <IconButton onClick={() => handleClick(toggleBold)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: (theme) => (isBoldActive ? theme.palette.action.selected : 'transparent') }}>
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
                    <IconButton onClick={() => handleClick(toggleItalic)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: (theme) => (isItalicActive ? theme.palette.action.selected : 'transparent') }}>
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
                    <IconButton onClick={() => handleClick(toggleUnderlined)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: (theme) => (isUnderlinedActive ? theme.palette.action.selected : 'transparent') }}>
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
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' }, color: 'inherit' }}
                        renderValue={(selected) => (
                            <span dangerouslySetInnerHTML={{ __html: LINE_STYLE_SVG[selected] }} />
                        )}
                    >
                        {lineStyles.map((style) => (
                            <MenuItem key={style.value} value={style.value} sx={{ color: 'text.primary' }}>
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
                    sx={{ width: 40, margin: '8px', '& .MuiInputBase-input': { color: 'inherit' } }}
                    variant="standard"
                    disabled={!hasSelectedConnectors}
                />
            ),
            width: 90,
        },
        {
            id: 'connection-type',
            element: (
                <FormControl variant="standard" sx={{ m: 1, minWidth: 80 }}>
                    <Select
                        value={currentConnectionType}
                        onChange={handleConnectionTypeChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Connection Type' }}
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' }, color: 'inherit' }}
                        renderValue={(selected) => (
                            <span dangerouslySetInnerHTML={{ __html: CONNECTION_TYPE_SVG[selected as ConnectionType] }} />
                        )}
                    >
                        {connectionTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value} sx={{ color: 'text.primary' }}>
                                <span dangerouslySetInnerHTML={{ __html: CONNECTION_TYPE_SVG[type.value] }} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ),
            width: 120,
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
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' }, color: 'inherit' }}
                        renderValue={(selected) => (
                            <span dangerouslySetInnerHTML={{ __html: ARROW_STYLE_SVG[selected as ArrowStyle].start }} />
                        )}
                    >
                        {Object.keys(ARROW_STYLE_SVG).map((style) => (
                            <MenuItem key={style} value={style} sx={{ color: 'text.primary' }}>
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
                        sx={{ '.MuiSelect-select': { padding: '8px 12px' }, color: 'inherit' }}
                        renderValue={(selected) => (
                            <span dangerouslySetInnerHTML={{ __html: ARROW_STYLE_SVG[selected as ArrowStyle].end }} />
                        )}
                    >
                        {Object.keys(ARROW_STYLE_SVG).map((style) => (
                            <MenuItem key={style} value={style} sx={{ color: 'text.primary' }}>
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
            id: 'align',
            element: (() => {
                const AlignDropdown: React.FC = () => {
                    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
                    const open = Boolean(anchorEl);
                    return (
                        <div>
                            <Tooltip title="Align">
                                    <IconButton
                                    onClick={(e) => setAnchorEl(e.currentTarget)}
                                    color="inherit"
                                    disabled={!hasSelectedShapes}
                                    sx={{ borderRadius: 0, backgroundColor: (theme) => ((isVerticalAlignTopActive && isVerticalAlignCenterActive && isVerticalAlignBottomActive && isHorizontalAlignLeftActive && isHorizontalAlignCenterActive && isHorizontalAlignRightActive) ? theme.palette.action.selected : 'transparent') }}
                                >
                                    <AlignHorizontalCenter />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={() => setAnchorEl(null)}
                                MenuListProps={{ 'aria-label': 'Align options' }}
                                PaperProps={{ sx: { p: 1 } }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {/* First row: Vertical alignment (icons arranged horizontally) */}
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <MenuItem onClick={() => { handleClick(() => setVerticalAlign('top')); setAnchorEl(null); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'auto', color: 'text.primary' }}>
                                                <VerticalAlignTop />
                                                <Box component="span" sx={{ fontSize: 12, color: 'text.primary' }}>Top</Box>
                                            </MenuItem>
                                        <MenuItem onClick={() => { handleClick(() => setVerticalAlign('middle')); setAnchorEl(null); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'auto', color: 'text.primary' }}>
                                            <VerticalAlignCenter />
                                            <Box component="span" sx={{ fontSize: 12, color: 'text.primary' }}>Middle</Box>
                                        </MenuItem>
                                        <MenuItem onClick={() => { handleClick(() => setVerticalAlign('bottom')); setAnchorEl(null); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'auto', color: 'text.primary' }}>
                                            <VerticalAlignBottom />
                                            <Box component="span" sx={{ fontSize: 12, color: 'text.primary' }}>Bottom</Box>
                                        </MenuItem>
                                    </Box>

                                    {/* Second row: Horizontal alignment (icons arranged horizontally) */}
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <MenuItem onClick={() => { handleClick(() => setHorizontalAlign('left')); setAnchorEl(null); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'auto', color: 'text.primary' }}>
                                            <AlignHorizontalLeft />
                                            <Box component="span" sx={{ fontSize: 12, color: 'text.primary' }}>Left</Box>
                                        </MenuItem>
                                        <MenuItem onClick={() => { handleClick(() => setHorizontalAlign('center')); setAnchorEl(null); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'auto', color: 'text.primary' }}>
                                            <AlignHorizontalCenter />
                                            <Box component="span" sx={{ fontSize: 12, color: 'text.primary' }}>Center</Box>
                                        </MenuItem>
                                        <MenuItem onClick={() => { handleClick(() => setHorizontalAlign('right')); setAnchorEl(null); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'auto', color: 'text.primary' }}>
                                            <AlignHorizontalRight />
                                            <Box component="span" sx={{ fontSize: 12, color: 'text.primary' }}>Right</Box>
                                        </MenuItem>
                                    </Box>
                                </Box>
                            </Menu>
                        </div>
                    );
                };
                return <AlignDropdown />;
            })(),
            width: 48,
        },
        {
            id: 'divider-5',
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