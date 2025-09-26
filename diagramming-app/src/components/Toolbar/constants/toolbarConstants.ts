// Toolbar constants and configuration
import type { LineStyle, ConnectionType } from '../../../types';

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