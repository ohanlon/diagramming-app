import type { ShapeStore } from '../types';

export const shapeStore: ShapeStore = {
  categories: [
    {
      name: 'Flowchart',
      shapes: [
        {
          title: 'Start',
          
          shape: `
            <svg viewBox="-30 -20 60 40">
              <circle cx="0" cy="0" r="20" fill="#e9f5ff" stroke="#1a73e8" stroke-width="2"/>
            </svg>
          `,
        },
        {
          title: 'End',
          
          shape: `
            <svg viewBox="-30 -20 60 40">
              <circle cx="0" cy="0" r="20" fill="#e9f5ff" stroke="#1a73e8" stroke-width="2"/>
            </svg>
          `,
        },
        {
          title: 'Process',
          
          shape: `
            <svg viewBox="-40 -25 80 50">
              <rect x="-35" y="-20" width="70" height="40"
                    fill="#f1f8ff" stroke="#1a73e8" stroke-width="2"/>
            </svg>
          `,
        },
        {
          title: 'Decision',
          
          shape: `
            <svg viewBox="-30 -30 60 60">
              <polygon points="0,-25 25,0 0,25 -25,0"
                       fill="#f8d7da" stroke="#c12e2a" stroke-width="2"/>
            </svg>
          `,
        },
        {
          title: 'Input/Output',
          
          shape: `
            <svg viewBox="-40 -25 80 50">
              <polygon points="-35,-20 35,-20 45,10 -5,10"
                       fill="#fff9c4" stroke="#f57c00" stroke-width="2"/>
            </svg>
          `,
        },
        {
          title: '+',
          
          shape: `
            <svg viewBox="-20 -20 40 40">
              <circle cx="0" cy="0" r="18"
                      fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
            </svg>
          `,
        },
        {
          title: 'Subroutine',
          
          shape: `
            <svg viewBox="-45 -25 90 50">
              <rect x="-40" y="-20" width="80" height="40"
                    fill="#e7f3ff" stroke="#1a73e8" stroke-width="2"/>
              <!-- Double lines -->
              <line x1="-40" y1="5" x2="40" y2="5" stroke="#1a73e8" stroke-width="1.5"/>
              <line x1="-40" y1="15" x2="40" y2="15" stroke="#1a73e8" stroke-width="1.5"/>
            </svg>
          `,
        },
        {
          title: 'Terminator',
          
          shape: `
            <svg viewBox="-30 -20 60 40">
              <circle cx="0" cy="0" r="20"
                      fill="#e9f5ff" stroke="#c12e2a" stroke-width="2"/>
            </svg>
          `,
        },
        {
          title: 'Data',
          
          shape: `
            <svg viewBox="-45 -30 90 60">
              <rect x="-40" y="-25" width="80" height="50"
                    fill="#f1e9ff" stroke="#7b1fa2" stroke-width="2"/>
              <!-- Line across center -->
              <line x1="-40" y1="0" x2="40" y2="0" stroke="#7b1fa2" stroke-width="1.5"/>
            </svg>
          `,
        },
        {
          title: 'Delay',
          
          shape: `
            <svg viewBox="-40 -30 80 60">
              <rect x="-40" y="-25" width="80" height="50"
                    fill="#fff9c4" stroke="#f57c00" stroke-width="2"/>
              <!-- Wave -->
              <path d="M-40,-10 Q-10,0 0,10 T40,-10" 
                    stroke="#f57c00" fill="none" stroke-width="1.5"/>
            </svg>
          `,
        },
        {
          title: 'Manual Operation',
          
          shape: `
            <svg viewBox="-40 -30 80 60">
              <rect x="-40" y="-25" width="80" height="50"
                    fill="#e7f3ff" stroke="#1a73e8" stroke-width="2"/>
              <!-- Hand symbol -->
              <path d="M-20,-10 C -15,0 -15,10 0,15 Q 15,10 20,0 M40,-15 L40,0 M30,-15 L30,0"
                    stroke="#d679c8" fill="none" stroke-width="2"/>
            </svg>
          `,
        },
        {
          title: 'Initialization',
          
          shape: `
            <svg viewBox="-40 -30 80 60">
              <rect x="-40" y="-25" width="80" height="50"
                    fill="#e9f5ff" stroke="#1a73e8" stroke-width="2"/>
              <!-- Clock -->
              <circle cx="0" cy="0" r="10" stroke="#1a73e8" fill="none" stroke-width="2"/>
              <line x1="0" y1="-5" x2="0" y2="0" stroke="#1a73e8" stroke-width="2"/>
              <line x1="0" y1="0" x2="4" y2="6" stroke="#1a73e8" stroke-width="2"/>
            </svg>
          `,
        },
      ],
    },
  ],
};