// SVG Icons and constants for toolbars
import type { LineStyle, ArrowStyle, ConnectionType } from '../../../types';
import { CUSTOM_PATTERN_1_LINE_STYLE, CUSTOM_PATTERN_2_LINE_STYLE, DASHED_LINE_STYLE, DOT_DASH_PATTERN_LINE_STYLE, LONG_DASH_PATTERN_LINE_STYLE, LONG_DASH_SPACE_PATTERN_LINE_STYLE, LONG_SPACE_SHORT_DOT_PATTERN_STYLE } from '../../../constants/constant';

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
    },
    circle: {
        // The circle SVGs place the circle so their center aligns to the tip offset
        start: `<svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="0" cy="5" r="5" fill="black" /></svg>`,
        end: `<svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="5" r="5" fill="black" /></svg>`
    }
};

// Metadata that tells the rendering code how to align the arrow SVG tip to the connector tip
export const ARROW_STYLE_META: Record<string, { start?: 'left' | 'center' | 'right', end?: 'left' | 'center' | 'right' }> = {
    none: { start: 'left', end: 'right' },
    standard_arrow: { start: 'left', end: 'right' },
    polygon_arrow: { start: 'left', end: 'right' },
    circle: { start: 'center', end: 'center' },
};

export const CONNECTION_TYPE_SVG: Record<ConnectionType, string> = {
    direct: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10L55 10" stroke="black" stroke-width="2"/></svg>`,
    orthogonal: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 15L20 15L20 5L55 5" stroke="black" stroke-width="2" fill="none"/></svg>`,
    bezier: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 15 Q 20 15, 25 10 T 55 5" stroke="black" stroke-width="2" fill="none"/></svg>`
};

export const SNAP_TO_GRID_ICON = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 10.800781 16.800781 L 8.398438 16.800781 L 8.398438 13.199219 L 10.800781 13.199219 L 10.800781 12 L 8.398438 12 L 8.398438 8.398438 L 12 8.398438 L 12 10.800781 L 13.199219 10.800781 L 13.199219 8.398438 L 16.800781 8.398438 L 16.800781 10.800781 L 18 10.800781 L 18 2.398438 L 2.398438 2.398438 L 2.398438 18 L 10.800781 18 Z M 7.199219 16.800781 L 3.601562 16.800781 L 3.601562 13.199219 L 7.199219 13.199219 Z M 3.601562 3.601562 L 7.199219 3.601562 L 7.199219 7.199219 L 3.601562 7.199219 Z M 8.398438 3.601562 L 12 3.601562 L 12 7.199219 L 8.398438 7.199219 Z M 13.199219 3.601562 L 16.800781 3.601562 L 16.800781 7.199219 L 13.199219 7.199219 Z M 3.601562 8.398438 L 7.199219 8.398438 L 7.199219 12 L 3.601562 12 Z M 3.601562 8.398438 "/>
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 16.800781 12 L 12 12 L 12 14.398438 L 16.800781 14.398438 C 18.125 14.398438 19.199219 15.476562 19.199219 16.800781 C 19.199219 18.125 18.125 19.199219 16.800781 19.199219 L 12 19.199219 L 12 21.601562 L 16.800781 21.601562 C 19.445312 21.601562 21.601562 19.445312 21.601562 16.800781 C 21.601562 14.152344 19.445312 12 16.800781 12 Z M 16.800781 12 "/>
</g>
</svg>
`;