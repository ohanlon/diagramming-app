import { render, screen } from '@testing-library/react';
import ConnectorComponent from './Connector';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock the useDiagramStore hook
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: jest.fn(),
}));

describe('ConnectorComponent', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (useDiagramStore as jest.Mock).mockReturnValue({
      sheets: {
        'sheet-1': {
          id: 'sheet-1',
          name: 'Sheet 1',
          nodes: {},
          connectors: {},
          zoom: 1,
          offset: { x: 0, y: 0 },
          shapesById: {
            'node-1': { id: 'node-1', x: 0, y: 0, width: 50, height: 50, type: 'rectangle', text: 'Node 1', color: 'blue', layerId: 'layer-1', svgContent: '', fontFamily: 'Arial' },
            'node-2': { id: 'node-2', x: 100, y: 100, width: 50, height: 50, type: 'rectangle', text: 'Node 2', color: 'green', layerId: 'layer-1', svgContent: '', fontFamily: 'Arial' },
          },
        },
      },
      activeSheetId: 'sheet-1',
    });
  });

  const mockConnector = {
    id: 'conn-1',
    startNodeId: 'node-1',
    endNodeId: 'node-2',
    startAnchorType: 'right',
    endAnchorType: 'left',
  };

  test('renders connector path', () => {
    render(
      <svg>
        <ConnectorComponent connector={mockConnector} />
      </svg>
    );
    expect(screen.getByRole('graphics-symbol')).toBeInTheDocument(); // Assuming path is rendered as img role
  });

  test('returns null if startNode or endNode is not found', () => {
    const invalidConnector = {
      ...mockConnector,
      startNodeId: 'non-existent-node',
    };

    const { container } = render(
      <svg>
        <ConnectorComponent connector={invalidConnector} />
      </svg>
    );

    // Check that the SVG has no children
    expect(container.firstChild).not.toBe(null);
    expect(container.innerHTML).toBe('<svg></svg>');
  });

});
