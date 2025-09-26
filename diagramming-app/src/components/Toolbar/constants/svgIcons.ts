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
    }
};

export const CONNECTION_TYPE_SVG: Record<ConnectionType, string> = {
    direct: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10L55 10" stroke="black" stroke-width="2"/></svg>`,
    orthogonal: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 15L20 15L20 5L55 5" stroke="black" stroke-width="2" fill="none"/></svg>`,
    bezier: `<svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 15 Q 20 15, 25 10 T 55 5" stroke="black" stroke-width="2" fill="none"/></svg>`
};